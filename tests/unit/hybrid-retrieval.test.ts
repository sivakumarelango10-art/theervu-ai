import { describe, it, expect } from 'vitest'
import {
  findMatchingCivicService,
  buildVerifiedCivicContext,
  getHybridRetrievalContext,
} from '@/lib/ai/hybrid'

describe('Hybrid Civic AI Retrieval Engine', () => {
  it('correctly matches user intent queries to verified civic services', () => {
    // Driving Licence
    const dlMatch = findMatchingCivicService('How do I apply for a driving licence renewal in Chennai?')
    expect(dlMatch.service).toBeDefined()
    expect(dlMatch.service?.slug).toBe('driving-licence-renewal')
    expect(dlMatch.confidence).toBeGreaterThan(0.4)

    // Passport
    const passportMatch = findMatchingCivicService('Need to apply for a fresh tatkaal passport for international travel')
    expect(passportMatch.service).toBeDefined()
    expect(passportMatch.service?.slug).toBe('fresh-passport-application')

    // Ayushman Bharat
    const ayushmanMatch = findMatchingCivicService('How to get Ayushman Bharat health card for hospital cashless treatment')
    expect(ayushmanMatch.service).toBeDefined()
    expect(ayushmanMatch.service?.slug).toBe('ayushman-bharat-card')

    // Ration Card
    const rationMatch = findMatchingCivicService('Apply for family smart ration card PDS member addition')
    expect(rationMatch.service).toBeDefined()
    expect(rationMatch.service?.slug).toBe('ration-card-member-addition')
  })

  it('returns null match for unrelated, conversational, or general inquiries', () => {
    const general = findMatchingCivicService('What is the weather like today?')
    expect(general.service).toBeNull()
    expect(general.confidence).toBe(0)

    const blank = findMatchingCivicService('')
    expect(blank.service).toBeNull()
  })

  it('builds zero-fabrication grounding context with official facts', () => {
    const { service } = findMatchingCivicService('driver license renewal')
    expect(service).toBeDefined()

    if (service) {
      const context = buildVerifiedCivicContext(service)
      expect(context).toContain('STRICT ZERO-FABRICATION RULE')
      expect(context).toContain(service.officialSourceUrl)
      expect(context).toContain(service.sourceName)
      expect(context).toContain('VERIFIED REQUIRED DOCUMENTS:')
      expect(context).toContain('VERIFIED FEES & PAYMENT:')
      expect(context).toContain('Information not available in the current verified database')
    }
  })

  it('provides complete hybrid retrieval context payload for Gemini prompt injection', () => {
    const result = getHybridRetrievalContext('How to file RTI online application?')
    expect(result.matchedService).toBeDefined()
    expect(result.matchedService?.slug).toBe('rti-online-application')
    expect(result.hybridSystemContext).toBeTruthy()
    expect(result.confidence).toBeGreaterThan(0)
  })
})
