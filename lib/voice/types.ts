export type VoiceRecordingState =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'transcribing'
  | 'error'

export type VoicePlaybackState = 'idle' | 'playing' | 'paused' | 'error'

export interface VoiceError {
  code:
    | 'not_allowed'
    | 'not_supported'
    | 'no_speech'
    | 'audio_capture'
    | 'network'
    | 'aborted'
    | 'unknown'
  message: string
}

export interface VoiceInputOptions {
  languageCode?: string
  continuous?: boolean
  interimResults?: boolean
  onTranscript?: (transcript: string) => void
  onError?: (error: VoiceError) => void
}

export interface VoiceOutputOptions {
  languageCode?: string
  rate?: number
  pitch?: number
  volume?: number
  onEnd?: () => void
  onError?: (error: VoiceError) => void
}

export interface TranscriptionResponse {
  transcript: string
  languageCode?: string
  provider: 'browser' | 'sarvam' | 'fallback'
}
