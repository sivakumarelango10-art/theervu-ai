import { describe, it, expect } from 'vitest'
import { generateCorrelationId, logger } from '@/lib/observability/logger'
import { scrubPII, recordMetric, getRecentMetrics, clearMetricsBuffer } from '@/lib/observability/metrics'

describe('Observability', () => {
  describe('generateCorrelationId', () => {
    it('generates unique correlation IDs', () => {
      const id1 = generateCorrelationId()
      const id2 = generateCorrelationId()
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^req_/)
    })

    it('correlation ID is a predictable safe format', () => {
      const id = generateCorrelationId()
      // Should not contain spaces or special chars that would break logs
      expect(id).toMatch(/^req_[a-z0-9_]+$/)
    })
  })

  describe('logger (no-throw guarantee)', () => {
    it('logger.info does not throw', () => {
      expect(() =>
        logger.info('Test log entry', { endpoint: '/api/test', statusCode: 200 })
      ).not.toThrow()
    })

    it('logger.error does not throw', () => {
      expect(() =>
        logger.error('Test error', { endpoint: '/api/fail', statusCode: 500 })
      ).not.toThrow()
    })

    it('logger.apiRequest does not throw', () => {
      expect(() =>
        logger.apiRequest('POST', '/api/ai/chat', 200, 1234, 'req_abc123')
      ).not.toThrow()
    })

    it('logger.authFailure does not throw', () => {
      expect(() =>
        logger.authFailure('Session expired')
      ).not.toThrow()
    })
  })

  describe('PII scrubbing in metrics', () => {
    it('scrubs Aadhaar numbers from strings', () => {
      const scrubbed = scrubPII('User Aadhaar: 1234 5678 9012')
      expect(scrubbed).not.toContain('1234 5678 9012')
      expect(scrubbed).toContain('[REDACTED_AADHAAR]')
    })

    it('scrubs PAN numbers', () => {
      const scrubbed = scrubPII('PAN: ABCDE1234F')
      expect(scrubbed).toContain('[REDACTED_PAN]')
    })

    it('scrubs Indian phone numbers', () => {
      const scrubbed = scrubPII('Call me at 9876543210')
      expect(scrubbed).toContain('[REDACTED_PHONE]')
    })

    it('preserves non-PII content', () => {
      const text = 'Visit the RTO office at 10am'
      expect(scrubPII(text)).toBe(text)
    })
  })

  describe('metrics buffer', () => {
    it('records and retrieves metrics', () => {
      clearMetricsBuffer()
      recordMetric({
        name: 'gemini_call',
        status: 'success',
        durationMs: 1200,
        endpoint: '/api/ai/chat',
      })
      const metrics = getRecentMetrics()
      expect(metrics.length).toBeGreaterThan(0)
      expect(metrics[0].name).toBe('gemini_call')
    })
  })
})
