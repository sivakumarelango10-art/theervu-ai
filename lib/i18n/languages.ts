/**
 * Centralized Language Catalog for TheervuAI
 *
 * Covers 11 major Indian regional languages with BCP-47 voice tags,
 * native script designations, and directional metadata.
 */

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
  script: string
  bcp47: string
  direction: 'ltr' | 'rtl'
  voiceSupported: boolean
}

export const SUPPORTED_LANGUAGES: Record<string, LanguageOption> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    script: 'Latin',
    bcp47: 'en-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  ta: {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    script: 'Tamil',
    bcp47: 'ta-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    script: 'Devanagari',
    bcp47: 'hi-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  te: {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    script: 'Telugu',
    bcp47: 'te-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  kn: {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    script: 'Kannada',
    bcp47: 'kn-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  ml: {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    script: 'Malayalam',
    bcp47: 'ml-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  bn: {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    script: 'Bengali',
    bcp47: 'bn-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  mr: {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    script: 'Devanagari',
    bcp47: 'mr-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  gu: {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    script: 'Gujarati',
    bcp47: 'gu-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  pa: {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    script: 'Gurmukhi',
    bcp47: 'pa-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
  or: {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    script: 'Odia',
    bcp47: 'or-IN',
    direction: 'ltr',
    voiceSupported: true,
  },
}

export const LANGUAGE_LIST = Object.values(SUPPORTED_LANGUAGES)

export function getLanguageByCode(code: string): LanguageOption {
  const normalized = code.toLowerCase().trim()
  return SUPPORTED_LANGUAGES[normalized] || SUPPORTED_LANGUAGES.en
}

export function isSupportedLanguage(code: string): boolean {
  const normalized = code.toLowerCase().trim()
  return Boolean(SUPPORTED_LANGUAGES[normalized])
}
