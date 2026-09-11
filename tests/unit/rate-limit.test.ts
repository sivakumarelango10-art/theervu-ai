import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/security/rate-limit'

describe('Security & Rate Limiting Engine', () => {
  it('allows requests within specified rate limit', () => {
    const testId = `test_ip_${Date.now()}_1`
    const res1 = checkRateLimit(testId, 5, 10)
    expect(res1.success).toBe(true)
    expect(res1.remaining).toBe(4)

    const res2 = checkRateLimit(testId, 5, 10)
    expect(res2.success).toBe(true)
    expect(res2.remaining).toBe(3)
  })

  it('rejects requests exceeding the rate limit and sets remaining to 0', () => {
    const testId = `test_ip_${Date.now()}_2`
    for (let i = 0; i < 3; i++) {
      checkRateLimit(testId, 3, 10)
    }

    const blocked = checkRateLimit(testId, 3, 10)
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.reset).toBeGreaterThan(0)
  })
})
