interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting with automatic cleanup
const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000).unref?.()
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Checks sliding-window rate limit for a given identifier (IP or User ID).
 *
 * @param identifier Unique client key (IP or user ID)
 * @param limit Maximum requests allowed in the window (default: 30)
 * @param windowSeconds Window length in seconds (default: 60)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 30,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(identifier, newRecord)
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(newRecord.resetTime / 1000),
    }
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
    }
  }

  record.count += 1
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: Math.ceil(record.resetTime / 1000),
  }
}

/**
 * Extracts client IP safely from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

/**
 * Resets all active in-memory rate limits (primarily used in automated testing)
 */
export function resetRateLimits(): void {
  rateLimitStore.clear()
}

