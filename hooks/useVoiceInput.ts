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
  const [audioLevel, setAudioLevel] = React.useState<number>(0)
  const [error, setError] = React.useState<VoiceError | null>(null)
  const recognitionRef = React.useRef<any>(null)
  const audioContextRef = React.useRef<AudioContext | null>(null)
  const analyserRef = React.useRef<AnalyserNode | null>(null)
  const mediaStreamRef = React.useRef<MediaStream | null>(null)
  const animFrameRef = React.useRef<number | null>(null)

  const isSupported = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return Boolean(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    )
  }, [])

  const stopAudioMeter = React.useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop())
      mediaStreamRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close()
      } catch {}
      audioContextRef.current = null
    }
    analyserRef.current = null
    setAudioLevel(0)
  }, [])

  const startAudioMeter = React.useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      mediaStreamRef.current = stream

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return

      const ctx = new AudioCtx()
      audioContextRef.current = ctx

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5
      analyserRef.current = analyser

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)

        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i]
        }
        const average = sum / dataArray.length
        // Normalize between 0 and 100
        const normalized = Math.min(100, Math.round((average / 128) * 100))
        setAudioLevel(normalized)

        animFrameRef.current = requestAnimationFrame(updateLevel)
      }

      updateLevel()
    } catch {
      // Non-blocking: dictation can still proceed via SpeechRecognition even if getUserMedia audio meter fails
    }
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

      stopAudioMeter()
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
        startAudioMeter()
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
        stopAudioMeter()
      }

      recognition.onend = () => {
        setState('idle')
        stopAudioMeter()
      }

      try {
        recognition.start()
      } catch (err: any) {
        setError({
          code: 'unknown',
          message: err?.message || 'Could not initiate microphone recording.',
        })
        setState('error')
        stopAudioMeter()
      }
    },
    [options, startAudioMeter, stopAudioMeter]
  )

  const stopListening = React.useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
    }
    stopAudioMeter()
    setState('idle')
  }, [stopAudioMeter])

  const cancelListening = React.useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {}
    }
    stopAudioMeter()
    setTranscript('')
    setError(null)
    setState('idle')
  }, [stopAudioMeter])

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
      stopAudioMeter()
    }
  }, [stopAudioMeter])

  return {
    state,
    isListening: state === 'recording' || state === 'requesting',
    isSupported,
    transcript,
    audioLevel,
    error,
    startListening,
    stopListening,
    cancelListening,
    resetTranscript,
  }
}

