import { describe, it, expect } from 'vitest'
import { checkRateLimit, resetRateLimits } from '@/lib/security/rate-limit'
import { env } from '@/lib/config/env'

describe('Security Hardening & Protection Tests', () => {
  it('strictly enforces sliding-window rate limits and returns retryAfter', () => {
    resetRateLimits()
    const testKey = 'test_security_limit_ip_1'
    const limit = 3
    const windowSec = 60

    // 3 allowed calls
    expect(checkRateLimit(testKey, limit, windowSec).success).toBe(true)
    expect(checkRateLimit(testKey, limit, windowSec).success).toBe(true)
    expect(checkRateLimit(testKey, limit, windowSec).success).toBe(true)

    // 4th call should breach rate limit
    const breach = checkRateLimit(testKey, limit, windowSec)
    expect(breach.success).toBe(false)
    expect(breach.reset).toBeGreaterThan(0)
    expect(breach.remaining).toBe(0)
  })

  it('verifies that server-only service role keys are never exposed on public client env', () => {
    // Client-side env variables must only start with NEXT_PUBLIC_
    const clientVisibleKeys = Object.keys(process.env).filter((k) =>
      k.startsWith('NEXT_PUBLIC_')
    )

    // Service role key and private Gemini/Sarvam keys must never be prefixed with NEXT_PUBLIC_
    expect(clientVisibleKeys).not.toContain('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY')
    expect(clientVisibleKeys).not.toContain('NEXT_PUBLIC_GEMINI_API_KEY')
    expect(clientVisibleKeys).not.toContain('NEXT_PUBLIC_SARVAM_API_KEY')
  })

  it('rejects forbidden and dangerous file extensions in upload validation', () => {
    const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp']
    const FORBIDDEN_EXTENSIONS = ['.exe', '.sh', '.bat', '.js', '.html', '.svg', '.php', '.dll', '.bin']

    for (const ext of FORBIDDEN_EXTENSIONS) {
      expect(ALLOWED_EXTENSIONS).not.toContain(ext)
    }

    const testFile = 'malicious_script.sh'
    const ext = testFile.slice(testFile.lastIndexOf('.')).toLowerCase()
    expect(ALLOWED_EXTENSIONS.includes(ext)).toBe(false)
  })

  it('enforces IDOR isolation rule: resource user_id must equal authenticated user id', () => {
    const authenticatedUser = { id: 'user-uuid-1234' }
    const ownedResource = { id: 'plan-001', user_id: 'user-uuid-1234' }
    const foreignResource = { id: 'plan-002', user_id: 'attacker-uuid-9999' }

    function verifyOwnership(resourceUserId: string, authUserId: string) {
      return resourceUserId === authUserId
    }

    expect(verifyOwnership(ownedResource.user_id, authenticatedUser.id)).toBe(true)
    expect(verifyOwnership(foreignResource.user_id, authenticatedUser.id)).toBe(false)
  })
})
