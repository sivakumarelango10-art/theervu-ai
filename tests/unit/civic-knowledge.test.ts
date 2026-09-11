import { describe, it, expect } from 'vitest'
import {
  SEED_SERVICES,
  searchServices,
  getServiceBySlug,
  type CivicService,
} from '@/lib/data/services'
import { INDIAN_STATES, getStateByName, isLocationMatched } from '@/lib/location/states'

describe('Phase 6 Civic Knowledge Catalog', () => {
  it('contains comprehensive verified services covering major civic domains', () => {
    expect(SEED_SERVICES.length).toBeGreaterThanOrEqual(12)

    const categories = new Set(SEED_SERVICES.map((s) => s.category))
    expect(categories.has('Transport & RTO')).toBe(true)
    expect(categories.has('Identity & Passports')).toBe(true)
    expect(categories.has('Healthcare & Welfare')).toBe(true)
    expect(categories.has('Revenue & Certificates')).toBe(true)
    expect(categories.has('Municipal & Property')).toBe(true)
    expect(categories.has('Employment & Rights')).toBe(true)
  })

  it('validates every service conforms to strict verified schema', () => {
    for (const service of SEED_SERVICES) {
      expect(service.id).toBeTruthy()
      expect(service.slug).toMatch(/^[a-z0-9-]+$/)
      expect(service.name).toBeTruthy()
      expect(service.department).toBeTruthy()
      expect(service.authority).toBeTruthy()
      expect(service.officeType).toBeTruthy()

      // Zero-fabrication official URL checks (must be official portal domain or authorized provider)
      expect(service.officialSourceUrl).toMatch(/^https:\/\//)
      expect(service.officialSourceUrl).toMatch(/(gov\.in|nic\.in|pmjay\.gov\.in|nvsp\.in|indiapost\.gov\.in|nsdl\.com)/)

      // Required documents
      expect(service.requiredDocuments.length).toBeGreaterThan(0)
      for (const doc of service.requiredDocuments) {
        expect(doc.name).toBeTruthy()
        expect(doc.description).toBeTruthy()
        expect(typeof doc.mandatory).toBe('boolean')
      }

      // Fees & timeline
      expect(service.fees.length).toBeGreaterThan(0)
      for (const fee of service.fees) {
        expect(fee.name).toBeTruthy()
        expect(fee.amount).toBeTruthy()
        expect(fee.paymentMode).toBeTruthy()
      }
      expect(service.expectedTimeline).toBeTruthy()
      expect(service.verificationStatus).toBe('verified')
    }
  })

  it('correctly filters services by search query, category, and state', () => {
    // 1. Keyword search
    const rtoResults = searchServices('licence')
    expect(rtoResults.length).toBeGreaterThan(0)
    expect(rtoResults.some((s) => s.slug.includes('licence'))).toBe(true)

    // 2. Category filtering
    const passportResults = searchServices('', 'Identity & Passports')
    expect(passportResults.length).toBeGreaterThanOrEqual(3)
    expect(passportResults.every((s) => s.category === 'Identity & Passports')).toBe(true)

    // 3. State filtering
    const tnResults = searchServices('', undefined, 'Tamil Nadu')
    expect(tnResults.length).toBeGreaterThan(0)
    // All India services should be included alongside Tamil Nadu specific services
    expect(tnResults.every((s) => s.state === 'All India' || s.state === 'Tamil Nadu')).toBe(true)
  })

  it('retrieves individual services by slug', () => {
    const passport = getServiceBySlug('fresh-passport-application')
    expect(passport).toBeDefined()
    expect(passport?.authority).toBe('Ministry of External Affairs (MEA)')

    const nonExistent = getServiceBySlug('imaginary-service-123')
    expect(nonExistent).toBeUndefined()
  })

  it('verifies location catalog and state matching logic', () => {
    expect(INDIAN_STATES.length).toBeGreaterThanOrEqual(30)

    const tn = getStateByName('Tamil Nadu')
    expect(tn).toBeDefined()
    expect(tn?.districts).toContain('Chennai')

    const mh = getStateByName('MH')
    expect(mh).toBeDefined()
    expect(mh?.name).toBe('Maharashtra')

    // Matching logic
    expect(isLocationMatched('All India', undefined, 'Karnataka')).toBe(true)
    expect(isLocationMatched('Tamil Nadu', undefined, 'Tamil Nadu')).toBe(true)
    expect(isLocationMatched('Tamil Nadu', undefined, 'Maharashtra')).toBe(false)
  })
})
