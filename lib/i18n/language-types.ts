import type { LanguageOption } from '@/lib/i18n/languages'

export type SupportedLanguageCode =
  | 'en'
  | 'ta'
  | 'hi'
  | 'te'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'mr'
  | 'gu'
  | 'pa'
  | 'or'

export interface TranslationRequest {
  text: string
  sourceLanguage?: string
  targetLanguage: string
  preserveEntities?: boolean
}

export interface TranslationResponse {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  provider: 'sarvam' | 'gemini' | 'fallback'
  confidence?: number
}

export interface LanguageDetectionResult {
  detectedLanguage: string
  languageName: string
  confidence: number
  script: string
}
