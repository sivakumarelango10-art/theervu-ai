import { describe, it, expect } from 'vitest'
import { geminiConfig, getGeminiConfig } from '@/lib/ai/config'

describe('Centralized Gemini Configuration', () => {
  it('has valid default model identifier targeting gemini-3.8-flash', () => {
    expect(geminiConfig.model).toBe('gemini-3.8-flash')
  })

  it('contains valid generation and timeout constraints', () => {
    expect(geminiConfig.temperature).toBeGreaterThanOrEqual(0)
    expect(geminiConfig.temperature).toBeLessThanOrEqual(1)
    expect(geminiConfig.maxOutputTokens).toBeGreaterThanOrEqual(1024)
    expect(geminiConfig.requestTimeoutMs).toBe(30000)
    expect(geminiConfig.retry.maxRetries).toBe(2)
    expect(geminiConfig.retry.backoffMs).toBe(1000)
  })

  it('allows safe configuration overrides without mutating the global singleton', () => {
    const customConfig = getGeminiConfig({
      temperature: 0.1,
      requestTimeoutMs: 15000,
      retry: {
        maxRetries: 3,
        backoffMs: 500,
      },
    })

    expect(customConfig.temperature).toBe(0.1)
    expect(customConfig.requestTimeoutMs).toBe(15000)
    expect(customConfig.retry.maxRetries).toBe(3)
    expect(customConfig.retry.backoffMs).toBe(500)

    // Verify global singleton remains untouched
    expect(geminiConfig.temperature).toBe(0.3)
    expect(geminiConfig.requestTimeoutMs).toBe(30000)
    expect(geminiConfig.retry.maxRetries).toBe(2)
  })
})
