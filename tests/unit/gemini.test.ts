import { describe, it, expect } from 'vitest'
import {
  geminiChatResponseSchema,
  geminiPreparationPlanSchema,
  geminiDocumentExplainSchema,
} from '@/lib/ai/schemas'
import { normalizeGeminiError } from '@/lib/ai/providers'
import { generateChatResponse, generatePreparationPlan, explainDocument } from '@/lib/ai/client'

describe('Google Gemini AI Integration Layer', () => {
  it('validates a structured Gemini chat response against schema', () => {
    const raw = {
      answer: 'To renew your driving licence, submit Form 9 and Form 1A medical fitness certificate.',
      summary: 'DL Renewal Guidance',
      steps: ['Download Form 1A', 'Book RTO slot on Parivahan'],
      sources: [
        {
          title: 'Parivahan Sewa',
          url: 'https://parivahan.gov.in/',
          authority: 'MoRTH',
        },
      ],
      isEmergency: false,
    }

    const validated = geminiChatResponseSchema.parse(raw)
    expect(validated.answer).toContain('driving licence')
    expect(validated.steps.length).toBe(2)
    expect(validated.sources[0].authority).toBe('MoRTH')
  })

  it('validates a structured Gemini preparation plan against schema', () => {
    const planRaw = {
      title: 'Passport Tatkaal Verification Plan',
      summary: 'Complete list of original documents for Tatkaal appointment.',
      location: 'Chennai',
      service: 'Passport',
      sections: [
        {
          title: 'Identity Verification',
          items: [
            {
              title: 'Aadhaar Card',
              description: 'Original color print or e-Aadhaar with clear QR code',
              required: true,
              completed: false,
              priority: 1,
            },
          ],
        },
      ],
      warnings: ['Do not carry duplicate copies with unverified alterations.'],
      sources: [
        {
          title: 'Passport Seva',
          url: 'https://passportindia.gov.in',
          authority: 'MEA',
        },
      ],
    }

    const plan = geminiPreparationPlanSchema.parse(planRaw)
    expect(plan.title).toContain('Passport')
    expect(plan.sections[0].items[0].title).toBe('Aadhaar Card')
  })

  it('validates document explanation schema with healthcare questions', () => {
    const docRaw = {
      documentType: 'Discharge Summary',
      plainLanguageSummary: 'Post-operative care instructions following knee arthroscopy.',
      keyDetails: [
        { label: 'Follow-up Date', value: '7 days from discharge' },
      ],
      actionItems: ['Schedule suture removal with attending orthopedic surgeon.'],
      questionsToAsk: ['Are there any activity or weight-bearing restrictions?'],
      warnings: ['Seek immediate emergency care if high fever or sudden swelling occurs.'],
    }

    const explanation = geminiDocumentExplainSchema.parse(docRaw)
    expect(explanation.documentType).toBe('Discharge Summary')
    expect(explanation.questionsToAsk.length).toBe(1)
  })

  it('normalizes Gemini quota/rate-limit errors to user-safe messages', () => {
    const rateLimitError = new Error('Resource exhausted: 429 Quota exceeded for quota group')
    const normalized = normalizeGeminiError(rateLimitError)
    expect(normalized.isRateLimit).toBe(true)
    expect(normalized.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(normalized.userMessage).toContain('busy')
    expect(normalized.userMessage).not.toContain('429')
  })

  it('falls back seamlessly to local engine when Gemini API key is missing', async () => {
    const response = await generateChatResponse('How do I renew my driving licence in India?')
    expect(response).toBeDefined()
    expect(response.answer).toBeDefined()
    expect(response.steps.length).toBeGreaterThan(0)
    expect(response.sources.length).toBeGreaterThan(0)
  })

  it('generates a full preparation plan in fallback mode', async () => {
    const plan = await generatePreparationPlan('Passport application', 'Bengaluru')
    expect(plan.title).toBeDefined()
    expect(plan.sections.length).toBeGreaterThan(0)
  })

  it('explains documents safely in fallback mode', async () => {
    const explanation = await explainDocument('Prescription and follow-up letter from hospital', 'medical')
    expect(explanation.plainLanguageSummary).toBeDefined()
    expect(explanation.actionItems.length).toBeGreaterThan(0)
    expect(explanation.questionsToAsk.length).toBeGreaterThan(0)
  })
})
