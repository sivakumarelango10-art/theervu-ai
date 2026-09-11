import { describe, it, expect, beforeEach } from 'vitest'
import {
  scrubPII,
  recordMetric,
  getRecentMetrics,
  clearMetricsBuffer,
} from '@/lib/observability/metrics'

describe('Admin & Observability Sanitization Suite', () => {
  beforeEach(() => {
    clearMetricsBuffer()
  })

  it('reliably redacts sensitive civic PII from telemetry logs', () => {
    // Aadhaar number redaction
    const aadhaarText = 'User requested guidance with Aadhaar 5412 8921 4310 for verification'
    const redactedAadhaar = scrubPII(aadhaarText)
    expect(redactedAadhaar).not.toContain('5412 8921 4310')
    expect(redactedAadhaar).toContain('[REDACTED_AADHAAR]')

    // PAN card redaction
    const panText = 'Application submitted with PAN ABCDE1234F'
    const redactedPAN = scrubPII(panText)
    expect(redactedPAN).not.toContain('ABCDE1234F')
    expect(redactedPAN).toContain('[REDACTED_PAN]')

    // Phone number redaction
    const phoneText = 'User contact number is +91 9840123456'
    const redactedPhone = scrubPII(phoneText)
    expect(redactedPhone).not.toContain('9840123456')
    expect(redactedPhone).toContain('[REDACTED_PHONE]')

    // Email redaction
    const emailText = 'Alert sent to citizen.test@example.gov.in'
    const redactedEmail = scrubPII(emailText)
    expect(redactedEmail).not.toContain('citizen.test@example.gov.in')
    expect(redactedEmail).toContain('[REDACTED_EMAIL]')
  })

  it('records and buffers sanitized operational metrics', () => {
    recordMetric({
      name: 'service_search',
      status: 'success',
      durationMs: 42,
      endpoint: '/api/services',
      metadata: {
        query: 'passport renewal with Aadhaar 1234 5678 9012',
        resultCount: 4,
      },
    })

    const metrics = getRecentMetrics()
    expect(metrics.length).toBe(1)
    expect(metrics[0].name).toBe('service_search')
    expect(metrics[0].status).toBe('success')
    expect(metrics[0].durationMs).toBe(42)

    // Verify metadata was scrubbed before recording
    expect(metrics[0].metadata?.query).not.toContain('1234 5678 9012')
    expect(metrics[0].metadata?.query).toContain('[REDACTED_AADHAAR]')
  })

  it('bounds the in-memory metric buffer correctly', () => {
    for (let i = 0; i < 210; i++) {
      recordMetric({
        name: 'plan_generate',
        status: 'success',
        durationMs: i,
      })
    }

    const metrics = getRecentMetrics()
    expect(metrics.length).toBeLessThanOrEqual(200)
  })
})
