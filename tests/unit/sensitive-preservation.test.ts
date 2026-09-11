import { describe, it, expect } from 'vitest'
import {
  protectSensitiveTokens,
  restoreSensitiveTokens,
} from '@/lib/i18n/translation'

describe('Sensitive Identifier & Official Token Preservation Tests', () => {
  it('masks and restores 12-digit Aadhaar patterns exactly', () => {
    const input = 'Please bring your Aadhaar card number 1234 5678 9012 to the taluk office.'
    const { maskedText, tokens } = protectSensitiveTokens(input)

    expect(maskedText).not.toContain('1234 5678 9012')
    expect(maskedText).toContain('__TOKEN_ID_')

    // Simulate translation preserving tokens
    const translatedWithToken = maskedText.replace('taluk office', 'வட்டாட்சியர் அலுவலகம்')
    const restored = restoreSensitiveTokens(translatedWithToken, tokens)

    expect(restored).toContain('1234 5678 9012')
    expect(restored).toContain('வட்டாட்சியர் அலுவலகம்')
  })

  it('masks and restores official PAN card alphanumeric format', () => {
    const input = 'Your application for PAN card ABCDE1234F is under process.'
    const { maskedText, tokens } = protectSensitiveTokens(input)

    expect(maskedText).not.toContain('ABCDE1234F')
    expect(maskedText).toContain('__TOKEN_PAN_')

    const restored = restoreSensitiveTokens(maskedText, tokens)
    expect(restored).toBe(input)
  })

  it('preserves government portal URLs and mobile numbers verbatim', () => {
    const input = 'Visit https://parivahan.gov.in/ or call our helpline at +91-9876543210 for assistance.'
    const { maskedText, tokens } = protectSensitiveTokens(input)

    expect(maskedText).not.toContain('https://parivahan.gov.in/')
    expect(maskedText).not.toContain('+91-9876543210')

    const restored = restoreSensitiveTokens(maskedText, tokens)
    expect(restored).toContain('https://parivahan.gov.in/')
    expect(restored).toContain('+91-9876543210')
  })

  it('handles text without sensitive tokens cleanly without modifications', () => {
    const input = 'Normal instructions without any numbers or links.'
    const { maskedText, tokens } = protectSensitiveTokens(input)

    expect(maskedText).toBe(input)
    expect(tokens.size).toBe(0)
    expect(restoreSensitiveTokens(maskedText, tokens)).toBe(input)
  })
})
