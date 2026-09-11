import { describe, it, expect } from 'vitest'
import {
  classifySource,
  OFFICIAL_SOURCE_DISCLAIMER,
} from '@/lib/sources/verifier'

describe('Official Source Classification', () => {
  it('identifies official government portals', () => {
    const s1 = classifySource('https://parivahan.gov.in/parivahan/', 'Parivahan Sewa')
    expect(s1.sourceType).toBe('official')
    expect(s1.domain).toBe('parivahan.gov.in')

    const s2 = classifySource('https://passportindia.gov.in', 'Passport Seva')
    expect(s2.sourceType).toBe('official')

    const s3 = classifySource('https://uidai.gov.in', 'UIDAI')
    expect(s3.sourceType).toBe('official')

    const s4 = classifySource('https://chennaicorporation.gov.in', 'GCC')
    expect(s4.sourceType).toBe('official')
  })

  it('classifies non-government portals as secondary or unknown', () => {
    const s1 = classifySource('https://example-blog.com/rto-tips', 'RTO Blog')
    expect(s1.sourceType).toBe('secondary')
    expect(s1.domain).toBe('example-blog.com')

    const s2 = classifySource('invalid-url-string', 'Broken Link')
    expect(s2.sourceType).toBe('unknown')
  })

  it('provides mandatory verification disclaimer text', () => {
    expect(OFFICIAL_SOURCE_DISCLAIMER).toContain('Requirements, fees, timings, and procedures may change')
  })
})
