'use client'

import * as React from 'react'
import type { VoicePlaybackState, VoiceError } from '@/lib/voice/types'
import { getLanguageByCode } from '@/lib/i18n/languages'

export function useVoiceOutput() {
  const [state, setState] = React.useState<VoicePlaybackState>('idle')
  const [currentText, setCurrentText] = React.useState<string>('')
  const [error, setError] = React.useState<VoiceError | null>(null)
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null)

  const isSupported = React.useMemo(() => {
    if (typeof window === 'undefined') return false
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
  }, [])

  const stop = React.useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      window.speechSynthesis.cancel()
    } catch {}
    setState('idle')
    setCurrentText('')
  }, [])

  const pause = React.useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      window.speechSynthesis.pause()
      setState('paused')
    } catch {}
  }, [])

  const resume = React.useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      window.speechSynthesis.resume()
      setState('playing')
    } catch {}
  }, [])

  const speak = React.useCallback(
    (text: string, langCode: string = 'en') => {
      if (typeof window === 'undefined') return

      if (!isSupported) {
        setError({
          code: 'not_supported',
          message: 'Text-to-speech is not supported in your browser.',
        })
        setState('error')
        return
      }

      if (!text || text.trim().length === 0) return

      stop()
      setError(null)
      setCurrentText(text)

      try {
        const lang = getLanguageByCode(langCode)
        const utterance = new SpeechSynthesisUtterance(text)
        utteranceRef.current = utterance

        utterance.lang = lang.bcp47
        utterance.rate = 0.95 // Clear, measured pace for civic guidance
        utterance.pitch = 1.0

        // Attempt to match an installed voice matching the language BCP-47
        const availableVoices = window.speechSynthesis.getVoices()
        const matchedVoice = availableVoices.find(
          (v) =>
            v.lang.toLowerCase() === lang.bcp47.toLowerCase() ||
            v.lang.toLowerCase().startsWith(lang.code)
        )
        if (matchedVoice) {
          utterance.voice = matchedVoice
        }

        utterance.onstart = () => {
          setState('playing')
        }

        utterance.onend = () => {
          setState('idle')
          setCurrentText('')
        }

        utterance.onerror = (e) => {
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            setError({
              code: 'unknown',
              message: 'Failed to play speech audio.',
            })
            setState('error')
          } else {
            setState('idle')
          }
        }

        window.speechSynthesis.speak(utterance)
      } catch (err: any) {
        setError({
          code: 'unknown',
          message: err?.message || 'Error initializing speech synthesis.',
        })
        setState('error')
      }
    },
    [isSupported, stop]
  )

  React.useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        try {
          window.speechSynthesis.cancel()
        } catch {}
      }
    }
  }, [])

  return {
    state,
    isPlaying: state === 'playing',
    isPaused: state === 'paused',
    isSupported,
    currentText,
    error,
    speak,
    pause,
    resume,
    stop,
  }
}
