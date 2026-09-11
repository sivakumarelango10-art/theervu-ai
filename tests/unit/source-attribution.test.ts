import { describe, it, expect } from 'vitest'
import {
  classifySourceTier,
  calculateFreshness,
  getAttributionBadge,
  formatSourceAttribution,
  buildSourceRecord,
} from '@/lib/sources/attribution'

describe('Source Attribution', () => {
  describe('classifySourceTier', () => {
    it('classifies .gov.in as VERIFIED_OFFICIAL', () => {
      expect(classifySourceTier('https://services.india.gov.in/')).toBe('VERIFIED_OFFICIAL')
      // parivahan.gov.in is in INSTITUTIONAL_DOMAINS → VERIFIED_INSTITUTIONAL (more specific)
      expect(['VERIFIED_OFFICIAL', 'VERIFIED_INSTITUTIONAL']).toContain(
        classifySourceTier('https://parivahan.gov.in/')
      )
    })

    it('classifies UIDAI as VERIFIED_INSTITUTIONAL', () => {
      expect(classifySourceTier('https://uidai.gov.in/')).toBe('VERIFIED_INSTITUTIONAL')
      expect(classifySourceTier('https://epfo.gov.in/')).toBe('VERIFIED_INSTITUTIONAL')
    })

    it('classifies unknown domains as REQUIRES_CONFIRMATION', () => {
      expect(classifySourceTier('https://random-blog.com/')).toBe('REQUIRES_CONFIRMATION')
    })
  })

  describe('calculateFreshness', () => {
    it('returns fresh for recent date', () => {
      const recent = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      expect(calculateFreshness(recent)).toBe('fresh')
    })

    it('returns recently_verified for 60 days ago', () => {
      const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      expect(calculateFreshness(date)).toBe('recently_verified')
    })

    it('returns review_due for old date', () => {
      const old = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
      expect(calculateFreshness(old)).toBe('review_due')
    })

    it('returns unknown for null', () => {
      expect(calculateFreshness(null)).toBe('unknown')
    })
  })

  describe('getAttributionBadge', () => {
    it('returns green badge for VERIFIED_OFFICIAL', () => {
      const badge = getAttributionBadge('VERIFIED_OFFICIAL')
      expect(badge.color).toBe('green')
      expect(badge.label).toContain('Official')
    })

    it('returns amber badge for REQUIRES_CONFIRMATION', () => {
      const badge = getAttributionBadge('REQUIRES_CONFIRMATION')
      expect(badge.color).toBe('amber')
    })
  })

  describe('buildSourceRecord', () => {
    it('builds a complete source record with tier and freshness', () => {
      const record = buildSourceRecord({
        title: 'Passport Seva Portal',
        url: 'https://passportindia.gov.in/',
        department: 'Ministry of External Affairs',
        authority: 'Government of India',
        lastVerifiedAt: new Date().toISOString(),
      })
      expect(record.tier).toBeDefined()
      expect(record.freshnessStatus).toBeDefined()
      expect(record.authority).toBe('Government of India')
    })
  })

  describe('formatSourceAttribution', () => {
    it('returns a non-empty string with attribution info', () => {
      const record = buildSourceRecord({
        title: 'UIDAI',
        url: 'https://uidai.gov.in/',
        department: 'UIDAI',
        authority: 'Government of India',
        lastVerifiedAt: new Date().toISOString(),
      })
      const attribution = formatSourceAttribution(record)
      expect(typeof attribution).toBe('string')
      expect(attribution.length).toBeGreaterThan(10)
      expect(attribution).toContain('UIDAI')
    })
  })
})
