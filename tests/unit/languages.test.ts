import { describe, it, expect } from 'vitest'
import {
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  isSupportedLanguage,
  LANGUAGE_LIST,
} from '@/lib/i18n/languages'
import { detectLanguage } from '@/lib/i18n/language-detection'

describe('Phase 4 Regional Language Architecture', () => {
  it('contains all 11 Indian languages with valid BCP-47 tags', () => {
    expect(LANGUAGE_LIST.length).toBe(11)
    expect(SUPPORTED_LANGUAGES.ta.bcp47).toBe('ta-IN')
    expect(SUPPORTED_LANGUAGES.hi.bcp47).toBe('hi-IN')
    expect(SUPPORTED_LANGUAGES.te.bcp47).toBe('te-IN')
    expect(SUPPORTED_LANGUAGES.kn.bcp47).toBe('kn-IN')
    expect(SUPPORTED_LANGUAGES.ml.bcp47).toBe('ml-IN')
    expect(SUPPORTED_LANGUAGES.bn.bcp47).toBe('bn-IN')
    expect(SUPPORTED_LANGUAGES.mr.bcp47).toBe('mr-IN')
    expect(SUPPORTED_LANGUAGES.gu.bcp47).toBe('gu-IN')
    expect(SUPPORTED_LANGUAGES.pa.bcp47).toBe('pa-IN')
    expect(SUPPORTED_LANGUAGES.or.bcp47).toBe('or-IN')
  })

  it('correctly resolves language by code with fallback to English', () => {
    expect(getLanguageByCode('ta').name).toBe('Tamil')
    expect(getLanguageByCode('TA').name).toBe('Tamil')
    expect(getLanguageByCode('hi').name).toBe('Hindi')
    expect(getLanguageByCode('unknown-code').code).toBe('en')
  })

  it('verifies supported language check', () => {
    expect(isSupportedLanguage('ta')).toBe(true)
    expect(isSupportedLanguage('mr')).toBe(true)
    expect(isSupportedLanguage('xyz')).toBe(false)
  })

  it('accurately identifies Tamil text', () => {
    const tamilText = 'எனது ஓட்டுநர் உரிமத்தை புதுப்பிக்க என்ன செய்ய வேண்டும்?'
    const res = detectLanguage(tamilText)
    expect(res.detectedLanguage).toBe('ta')
    expect(res.script).toBe('Tamil')
    expect(res.confidence).toBeGreaterThanOrEqual(0.7)
  })

  it('accurately identifies Hindi / Devanagari text', () => {
    const hindiText = 'पासपोर्ट नवीनीकरण के लिए कौन से दस्तावेज आवश्यक हैं?'
    const res = detectLanguage(hindiText)
    expect(res.detectedLanguage).toBe('hi')
    expect(res.script).toBe('Devanagari')
  })

  it('accurately identifies Telugu text', () => {
    const teluguText = 'డ్రైవింగ్ లైసెన్స్ పునరుద్ధరణ విధానం ఏమిటి?'
    const res = detectLanguage(teluguText)
    expect(res.detectedLanguage).toBe('te')
    expect(res.script).toBe('Telugu')
  })

  it('defaults to English for standard Latin text', () => {
    const englishText = 'How do I renew my driving licence in Chennai?'
    const res = detectLanguage(englishText)
    expect(res.detectedLanguage).toBe('en')
    expect(res.script).toBe('Latin')
  })
})
