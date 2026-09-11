import { describe, it, expect } from 'vitest'
import {
  chatRequestSchema,
  prepareRequestSchema,
  feedbackSchema,
  profileUpdateSchema,
  documentExplainSchema,
} from '@/lib/validation/schemas'

describe('Validation Schemas', () => {
  it('validates a valid chat request', () => {
    const valid = {
      question: 'How do I renew my driving licence in Tamil Nadu?',
      preferredLanguage: 'en',
    }
    const result = chatRequestSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects too short chat question', () => {
    const invalid = { question: 'hi' }
    const result = chatRequestSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('validates a valid prepare request', () => {
    const valid = {
      task: 'Passport fresh application',
      location: 'Bengaluru',
      preferredLanguage: 'kn',
    }
    const result = prepareRequestSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('validates feedback schema with valid rating', () => {
    const valid = {
      category: 'plan_accuracy',
      rating: 5,
      message: 'The RTO checklist was very accurate and saved me a lot of time.',
    }
    const result = feedbackSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects feedback with rating out of range', () => {
    const invalid = {
      category: 'general',
      rating: 6,
      message: 'Great website.',
    }
    const result = feedbackSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('validates profile update schema', () => {
    const valid = {
      full_name: 'Sivakumar M',
      preferred_language: 'ta',
    }
    const result = profileUpdateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('validates document explanation schema', () => {
    const valid = {
      extractedText: 'Hospital discharge summary for patient. Review medicine dosage on page 2.',
      documentType: 'Medical Summary',
      preferredLanguage: 'en',
    }
    const result = documentExplainSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })
})
