import { getLanguageByCode } from '@/lib/i18n/languages'
import type { LanguageDetectionResult } from '@/lib/i18n/language-types'

const SCRIPT_PATTERNS: Array<{
  regex: RegExp
  code: string
  scriptName: string
}> = [
  { regex: /[\u0B80-\u0BFF]/, code: 'ta', scriptName: 'Tamil' },
  { regex: /[\u0C00-\u0C7F]/, code: 'te', scriptName: 'Telugu' },
  { regex: /[\u0C80-\u0CFF]/, code: 'kn', scriptName: 'Kannada' },
  { regex: /[\u0D00-\u0D7F]/, code: 'ml', scriptName: 'Malayalam' },
  { regex: /[\u0980-\u09FF]/, code: 'bn', scriptName: 'Bengali' },
  { regex: /[\u0A80-\u0AFF]/, code: 'gu', scriptName: 'Gujarati' },
  { regex: /[\u0A00-\u0A7F]/, code: 'pa', scriptName: 'Gurmukhi' },
  { regex: /[\u0B00-\u0B7F]/, code: 'or', scriptName: 'Odia' },
  { regex: /[\u0900-\u097F]/, code: 'hi', scriptName: 'Devanagari' },
]

/**
 * Detects the language and script of a text string using deterministic Unicode range profiling.
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      detectedLanguage: 'en',
      languageName: 'English',
      confidence: 1.0,
      script: 'Latin',
    }
  }

  const clean = text.trim()
  let bestMatch = {
    code: 'en',
    scriptName: 'Latin',
    count: 0,
  }

  for (const pattern of SCRIPT_PATTERNS) {
    const matches = clean.match(new RegExp(pattern.regex.source, 'g'))
    const count = matches ? matches.length : 0
    if (count > bestMatch.count) {
      bestMatch = {
        code: pattern.code,
        scriptName: pattern.scriptName,
        count,
      }
    }
  }

  // If Indic script characters constitute a meaningful fraction
  if (bestMatch.count > 2) {
    const lang = getLanguageByCode(bestMatch.code)
    const confidence = Math.min(1.0, 0.7 + bestMatch.count / clean.length)
    return {
      detectedLanguage: lang.code,
      languageName: lang.name,
      confidence: Number(confidence.toFixed(2)),
      script: bestMatch.scriptName,
    }
  }

  return {
    detectedLanguage: 'en',
    languageName: 'English',
    confidence: 0.95,
    script: 'Latin',
  }
}
