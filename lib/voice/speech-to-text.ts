import { transcribeWithSarvam } from '@/lib/ai/sarvam'
import type { TranscriptionResponse } from '@/lib/voice/types'

/**
 * Server-side audio speech-to-text transcription
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  languageCode: string = 'en-IN'
): Promise<TranscriptionResponse | null> {
  const sarvamTranscript = await transcribeWithSarvam(audioBuffer, languageCode)
  if (sarvamTranscript) {
    return {
      transcript: sarvamTranscript,
      languageCode,
      provider: 'sarvam',
    }
  }

  return null
}
