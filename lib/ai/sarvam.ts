import { env } from '@/lib/config/env'

/**
 * Sarvam AI Provider Abstraction for Indian Regional Language Processing
 *
 * All Sarvam operations run strictly on the server using SARVAM_API_KEY.
 * If Sarvam is unconfigured or unreachable, functions return null, allowing
 * clean fallback to Google Gemini or browser-native capabilities.
 */

const SARVAM_BASE_URL = 'https://api.sarvam.ai'

export interface SarvamTranslateParams {
  input: string
  sourceLanguageCode?: string
  targetLanguageCode: string
  mode?: 'formal' | 'colloquial'
}

export interface SarvamTranslateResult {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
}

/**
 * Translates text between Indian languages using Sarvam AI.
 * Returns null if SARVAM_API_KEY is not configured or if API returns an error.
 */
export async function translateWithSarvam(
  params: SarvamTranslateParams
): Promise<SarvamTranslateResult | null> {
  if (!env.ai.isSarvamConfigured) {
    return null
  }

  try {
    const res = await fetch(`${SARVAM_BASE_URL}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': env.ai.sarvamApiKey,
      },
      body: JSON.stringify({
        input: params.input,
        source_language_code: params.sourceLanguageCode || 'en-IN',
        target_language_code: params.targetLanguageCode,
        mode: params.mode || 'formal',
        speaker_gender: 'Female',
        model: 'mayura:v1',
      }),
    })

    if (!res.ok) {
      console.warn(`Sarvam Translation API returned HTTP ${res.status}`)
      return null
    }

    const data = await res.json()
    if (data && data.translated_text) {
      return {
        translatedText: data.translated_text,
        sourceLanguage: params.sourceLanguageCode || 'en',
        targetLanguage: params.targetLanguageCode,
      }
    }

    return null
  } catch (error) {
    console.warn('Sarvam Translation error, engaging fallback:', error)
    return null
  }
}

/**
 * Transcribes audio using Sarvam Speech-to-Text API.
 * Returns null if unconfigured or unsupported.
 */
export async function transcribeWithSarvam(
  audioBuffer: Buffer,
  languageCode: string = 'unknown'
): Promise<string | null> {
  if (!env.ai.isSarvamConfigured) {
    return null
  }

  try {
    const formData = new FormData()
    const blob = new Blob([audioBuffer], { type: 'audio/wav' })
    formData.append('file', blob, 'recording.wav')
    formData.append('language_code', languageCode)
    formData.append('model', 'saaras:v1')

    const res = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
      method: 'POST',
      headers: {
        'api-subscription-key': env.ai.sarvamApiKey,
      },
      body: formData,
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.transcript || null
  } catch (err) {
    console.warn('Sarvam Speech-to-Text error, engaging fallback:', err)
    return null
  }
}

/**
 * Synthesizes speech using Sarvam Text-to-Speech API.
 * Returns base64 audio or null if unconfigured.
 */
export async function synthesizeWithSarvam(
  text: string,
  targetLanguageCode: string
): Promise<{ audioBase64: string; format: string } | null> {
  if (!env.ai.isSarvamConfigured) {
    return null
  }

  try {
    const res = await fetch(`${SARVAM_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': env.ai.sarvamApiKey,
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 500)],
        target_language_code: targetLanguageCode,
        speaker: 'meera',
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1',
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    if (data.audios && data.audios[0]) {
      return {
        audioBase64: data.audios[0],
        format: 'audio/wav',
      }
    }
    return null
  } catch (err) {
    console.warn('Sarvam Text-to-Speech error, engaging fallback:', err)
    return null
  }
}
