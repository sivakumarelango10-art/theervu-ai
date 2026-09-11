import { getLanguageByCode } from '@/lib/i18n/languages'
import type { TranslationRequest, TranslationResponse } from '@/lib/i18n/language-types'
import { translateWithSarvam } from '@/lib/ai/sarvam'
import { getGeminiClient } from '@/lib/ai/providers'
import { geminiConfig } from '@/lib/ai/config'

/**
 * Protects sensitive civic identifiers (Aadhaar, PAN, phone numbers, URLs)
 * from being modified, corrupted, or translated by replacing them with token placeholders.
 */
export function protectSensitiveTokens(text: string): {
  maskedText: string
  tokens: Map<string, string>
} {
  const tokens = new Map<string, string>()
  let counter = 0

  // 1. URLs
  const urlRegex = /https?:\/\/[^\s]+/gi
  let masked = text.replace(urlRegex, (match) => {
    const placeholder = `__TOKEN_URL_${counter++}__`
    tokens.set(placeholder, match)
    return placeholder
  })

  // 2. 12-digit Aadhaar pattern (e.g. 1234 5678 9012 or 1234-5678-9012 or 123456789012)
  const aadhaarRegex = /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g
  masked = masked.replace(aadhaarRegex, (match) => {
    const placeholder = `__TOKEN_ID_${counter++}__`
    tokens.set(placeholder, match)
    return placeholder
  })

  // 3. PAN card pattern (5 uppercase letters, 4 digits, 1 uppercase letter)
  const panRegex = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g
  masked = masked.replace(panRegex, (match) => {
    const placeholder = `__TOKEN_PAN_${counter++}__`
    tokens.set(placeholder, match)
    return placeholder
  })

  // 4. Indian Phone numbers (+91-9876543210 or 10-digit mobile)
  const phoneRegex = /(\+91[\-\s]?)?[6-9]\d{9}\b/g
  masked = masked.replace(phoneRegex, (match) => {
    const placeholder = `__TOKEN_TEL_${counter++}__`
    tokens.set(placeholder, match)
    return placeholder
  })

  return { maskedText: masked, tokens }
}

/**
 * Restores original sensitive tokens verbatim into translated text.
 */
export function restoreSensitiveTokens(text: string, tokens: Map<string, string>): string {
  let restored = text
  tokens.forEach((originalValue, placeholder) => {
    restored = restored.replaceAll(placeholder, originalValue)
  })
  return restored
}

/**
 * Unified translation engine for TheervuAI
 *
 * Employs Sarvam AI where available, falling back to Google Gemini with
 * strict preservation of official entities, dates, IDs, and URLs.
 */
export async function translateText(
  request: TranslationRequest
): Promise<TranslationResponse> {
  const { text, sourceLanguage = 'en', targetLanguage } = request

  if (!text || text.trim().length === 0) {
    return {
      translatedText: '',
      sourceLanguage,
      targetLanguage,
      provider: 'fallback',
    }
  }

  // If source and target are the same language
  if (sourceLanguage.toLowerCase() === targetLanguage.toLowerCase()) {
    return {
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      provider: 'fallback',
    }
  }

  const targetLang = getLanguageByCode(targetLanguage)

  // 1. Attempt Sarvam Translation first
  const sarvamBcp47 = targetLang.bcp47
  const sarvamResult = await translateWithSarvam({
    input: text,
    sourceLanguageCode: sourceLanguage === 'en' ? 'en-IN' : getLanguageByCode(sourceLanguage).bcp47,
    targetLanguageCode: sarvamBcp47,
  })

  if (sarvamResult) {
    return {
      translatedText: sarvamResult.translatedText,
      sourceLanguage,
      targetLanguage,
      provider: 'sarvam',
    }
  }

  // 2. Fallback to Google Gemini
  const gemini = getGeminiClient()
  if (gemini) {
    try {
      const prompt = `Translate the following text accurately into ${targetLang.name} (${targetLang.nativeName}).

CRITICAL PRESERVATION RULES:
- PRESERVE all dates, numbers, application IDs, form numbers, and URLs exactly as written.
- PRESERVE official government office and department names in English or their well-known local spelling.
- Do not add commentary or explanations. Return ONLY the translated text.

Text to translate:
"""
${text}
"""`

      const response = await gemini.models.generateContent({
        model: geminiConfig.model,
        contents: prompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      })

      const translated = response.text?.trim()
      if (translated) {
        return {
          translatedText: translated,
          sourceLanguage,
          targetLanguage,
          provider: 'gemini',
        }
      }
    } catch (geminiError) {
      console.warn('Gemini translation fallback error:', geminiError)
    }
  }

  // 3. Graceful fallback: return original text
  return {
    translatedText: text,
    sourceLanguage,
    targetLanguage,
    provider: 'fallback',
  }
}
