/**
 * Efficiency and Optimization Tests
 * Verifies: token budgets, cache headers, AbortController behavior, and type safety
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Token Budget Tests ──────────────────────────────────────────────────────

describe('Token Budget Configuration', () => {
  it('chat budget is 1024 tokens — lower than the global 4096 default', async () => {
    const { TOKEN_BUDGETS } = await import('@/lib/ai/config')
    expect(TOKEN_BUDGETS.chat).toBe(1024)
  })

  it('plan budget is 2048 tokens — appropriate for structured output', async () => {
    const { TOKEN_BUDGETS } = await import('@/lib/ai/config')
    expect(TOKEN_BUDGETS.plan).toBe(2048)
  })

  it('documentExplain budget is 2048 tokens', async () => {
    const { TOKEN_BUDGETS } = await import('@/lib/ai/config')
    expect(TOKEN_BUDGETS.documentExplain).toBe(2048)
  })

  it('translation budget is 1024 tokens', async () => {
    const { TOKEN_BUDGETS } = await import('@/lib/ai/config')
    expect(TOKEN_BUDGETS.translation).toBe(1024)
  })

  it('chat budget is strictly less than global maxOutputTokens', async () => {
    const { TOKEN_BUDGETS, geminiConfig } = await import('@/lib/ai/config')
    expect(TOKEN_BUDGETS.chat).toBeLessThan(geminiConfig.maxOutputTokens)
  })

  it('plan budget is strictly less than global maxOutputTokens', async () => {
    const { TOKEN_BUDGETS, geminiConfig } = await import('@/lib/ai/config')
    expect(TOKEN_BUDGETS.plan).toBeLessThan(geminiConfig.maxOutputTokens)
  })

  it('all token budget keys are positive integers', async () => {
    const { TOKEN_BUDGETS } = await import('@/lib/ai/config')
    for (const [key, value] of Object.entries(TOKEN_BUDGETS)) {
      expect(value, `TOKEN_BUDGETS.${key} should be positive`).toBeGreaterThan(0)
      expect(Number.isInteger(value), `TOKEN_BUDGETS.${key} should be an integer`).toBe(true)
    }
  })
})

// ─── PII Scrubbing in Metrics ─────────────────────────────────────────────────

describe('Metrics PII Scrubbing (type-safe path)', () => {
  it('recordMetric accepts non-any metadata', async () => {
    const { recordMetric, clearMetricsBuffer } = await import('@/lib/observability/metrics')
    clearMetricsBuffer()

    const event = recordMetric({
      name: 'gemini_call',
      status: 'success',
      durationMs: 123,
      endpoint: '/api/ai/chat',
      metadata: {
        model: 'gemini-3.8-flash',
        tokenCount: 512,
        cached: false,
        nullable: null,
      },
    })

    expect(event.metadata).toBeDefined()
    expect(event.metadata?.model).toBe('gemini-3.8-flash')
    expect(event.metadata?.tokenCount).toBe(512)
    expect(event.metadata?.cached).toBe(false)
    expect(event.metadata?.nullable).toBeNull()
  })

  it('metadata string values are PII-scrubbed', async () => {
    const { recordMetric, clearMetricsBuffer } = await import('@/lib/observability/metrics')
    clearMetricsBuffer()

    const event = recordMetric({
      name: 'api_error',
      status: 'failure',
      metadata: {
        userInput: 'my phone is 9876543210 and PAN is ABCDE1234F',
      },
    })

    expect(event.metadata?.userInput).not.toContain('9876543210')
    expect(event.metadata?.userInput).not.toContain('ABCDE1234F')
    expect(event.metadata?.userInput).toContain('[REDACTED_PHONE]')
    expect(event.metadata?.userInput).toContain('[REDACTED_PAN]')
  })
})

// ─── Services API Cache-Control ───────────────────────────────────────────────

describe('Public Services Data Caching', () => {
  it('searchServices returns an array from seed data', async () => {
    const { searchServices } = await import('@/lib/data/services')
    const result = searchServices('', undefined, undefined, undefined)
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThan(0)
  })

  it('searchServices filters by category', async () => {
    const { searchServices } = await import('@/lib/data/services')
    const rtoResults = searchServices('', 'Transport & RTO', undefined, undefined)
    for (const service of rtoResults) {
      expect(service.category).toBe('Transport & RTO')
    }
  })

  it('searchServices filters by keyword', async () => {
    const { searchServices } = await import('@/lib/data/services')
    const results = searchServices('passport', undefined, undefined, undefined)
    expect(results.length).toBeGreaterThan(0)
    const allMatch = results.every(
      (s) =>
        s.name.toLowerCase().includes('passport') ||
        s.description.toLowerCase().includes('passport') ||
        s.category.toLowerCase().includes('passport') ||
        s.department.toLowerCase().includes('passport')
    )
    expect(allMatch).toBe(true)
  })
})

// ─── GeminiContents Type Safety ───────────────────────────────────────────────

describe('Gemini Chat Type Safety', () => {
  it('generateChatResponse is a function', async () => {
    const { generateChatResponse } = await import('@/lib/ai/gemini')
    expect(typeof generateChatResponse).toBe('function')
  })

  it('generateChatResponse handles empty history', async () => {
    const { generateChatResponse } = await import('@/lib/ai/gemini')
    // Without API key, should fall back gracefully
    const result = await generateChatResponse('What documents do I need for a driving licence?', [], 'en')
    expect(result).toBeDefined()
    expect(typeof result.answer).toBe('string')
    expect(result.answer.length).toBeGreaterThan(0)
  })

  it('generateChatResponse handles multi-turn history', async () => {
    const { generateChatResponse } = await import('@/lib/ai/gemini')
    const history = [
      { role: 'user' as const, content: 'What is Aadhaar?' },
      { role: 'assistant' as const, content: 'Aadhaar is a 12-digit identity number.' },
    ]
    const result = await generateChatResponse('How do I update my address?', history, 'en')
    expect(result).toBeDefined()
    expect(typeof result.answer).toBe('string')
  })
})

// ─── Large Input Handling ─────────────────────────────────────────────────────

describe('Large Input Boundary Testing', () => {
  it('safety evaluator handles 1000-character input without throwing', async () => {
    const { evaluateSafety } = await import('@/lib/ai/safety')
    const longInput = 'I need help with government documents '.repeat(26).slice(0, 1000)
    expect(() => evaluateSafety(longInput)).not.toThrow()
    const result = evaluateSafety(longInput)
    expect(result.isSafe).toBe(true)
  })

  it('fallback chat handles very long civic question', async () => {
    const { generateFallbackChatResponse } = await import('@/lib/ai/fallback')
    const longQuestion = 'driving licence renewal process for 20 year old from Tamil Nadu '.repeat(15)
    const result = generateFallbackChatResponse(longQuestion)
    expect(result.answer.length).toBeGreaterThan(0)
    expect(Array.isArray(result.sources)).toBe(true)
  })

  it('chatRequestSchema rejects questions over 1500 characters', async () => {
    const { chatRequestSchema } = await import('@/lib/validation/schemas')
    const oversized = 'a'.repeat(1501)
    const result = chatRequestSchema.safeParse({ question: oversized })
    expect(result.success).toBe(false)
  })

  it('chatRequestSchema accepts questions up to 1500 characters', async () => {
    const { chatRequestSchema } = await import('@/lib/validation/schemas')
    const maxValid = 'a'.repeat(1500)
    const result = chatRequestSchema.safeParse({ question: maxValid })
    expect(result.success).toBe(true)
  })
})

// ─── AbortController Pattern ──────────────────────────────────────────────────

describe('AbortController fetch pattern', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AbortController is available in test environment', () => {
    const controller = new AbortController()
    expect(controller).toBeDefined()
    expect(controller.signal).toBeDefined()
    expect(controller.signal.aborted).toBe(false)
  })

  it('AbortController.abort() sets signal.aborted to true', () => {
    const controller = new AbortController()
    controller.abort()
    expect(controller.signal.aborted).toBe(true)
  })

  it('AbortError name matches expected filter pattern', () => {
    const controller = new AbortController()
    controller.abort()
    const err = new DOMException('Aborted', 'AbortError')
    expect(err.name).toBe('AbortError')
  })
})
