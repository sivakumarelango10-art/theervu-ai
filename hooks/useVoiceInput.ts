'use client'

import * as React from 'react'
import type { VoiceRecordingState, VoiceError } from '@/lib/voice/types'
import { getLanguageByCode } from '@/lib/i18n/languages'

export function useVoiceInput(options?: {
  defaultLanguage?: string
  onTranscript?: (text: string) => void
}) {
  const [state, setState] = React.useState<VoiceRecordingState>('idle')
  const [transcript, setTranscript] = React.useState<string>('')
  const [error, setError] = React.useState<VoiceError | null>(null)
  const recognitionRef = React.useRef<any>(null)

  const isSupported = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    )
  }, [])

  const startListening = React.useCallback(
    (langCode?: string) => {
      if (typeof window === 'undefined') return

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError({
          code: 'not_supported',
          message: 'Voice dictation is not supported in this browser. Please use Chrome, Edge, or Safari.',
        })
        setState('error')
        return
      }

      // Stop any existing recognition instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }

      setError(null)
      setState('requesting')

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      const targetLang = getLanguageByCode(langCode || options?.defaultLanguage || 'en')
      recognition.lang = targetLang.bcp47
      recognition.interimResults = true
      recognition.continuous = false

      recognition.onstart = () => {
        setState('recording')
      }

      recognition.onresult = (event: any) => {
        let currentTranscript = ''
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript
        }

        setTranscript(currentTranscript)
        if (options?.onTranscript) {
          options.onTranscript(currentTranscript)
        }
      }

      recognition.onerror = (event: any) => {
        let errCode: VoiceError['code'] = 'unknown'
        let errMsg = 'Voice recognition error. Please try again.'

        if (event.error === 'not-allowed') {
          errCode = 'not_allowed'
          errMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings.'
        } else if (event.error === 'no-speech') {
          errCode = 'no_speech'
          errMsg = 'No speech detected. Please speak into the microphone and try again.'
        } else if (event.error === 'audio-capture') {
          errCode = 'audio_capture'
          errMsg = 'No microphone was found on this device.'
        } else if (event.error === 'network') {
          errCode = 'network'
          errMsg = 'Network error during voice recognition.'
        }

        setError({ code: errCode, message: errMsg })
        setState('error')
      }

      recognition.onend = () => {
        setState('idle')
      }

      try {
        recognition.start()
      } catch (err: any) {
        setError({
          code: 'unknown',
          message: err?.message || 'Could not initiate microphone recording.',
        })
        setState('error')
      }
    },
    [options]
  )

  const stopListening = React.useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    setState('idle')
  }, [])

  const cancelListening = React.useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
    }
    setTranscript('')
    setError(null)
    setState('idle')
  }, [])

  const resetTranscript = React.useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {}
      }
    }
  }, [])

  return {
    state,
    isListening: state === 'recording' || state === 'requesting',
    isSupported,
    transcript,
    error,
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,
  }
}
