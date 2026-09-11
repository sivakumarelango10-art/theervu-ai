import { synthesizeWithSarvam } from '@/lib/ai/sarvam'

/**
 * Server-side audio text-to-speech synthesis
 */
export async function synthesizeSpeech(
  text: string,
  languageCode: string = 'en-IN'
): Promise<{ audioBase64: string; format: string } | null> {
  return synthesizeWithSarvam(text, languageCode)
}
