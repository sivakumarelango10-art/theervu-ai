import { env } from '@/lib/config/env'

/**
 * Centralized Gemini AI Service Configuration
 *
 * Consolidates all model identifiers, generation parameters, timeouts,
 * and retry policies. The model is never hardcoded across multiple files.
 */
export interface GeminiConfig {
  apiKey: string
  model: string
  temperature: number
  maxOutputTokens: number
  requestTimeoutMs: number
  retry: {
    maxRetries: number
    backoffMs: number
  }
}

export const geminiConfig: GeminiConfig = {
  apiKey: env.ai.geminiApiKey,
  // Target model: verified Gemini 3.8 Flash (released Sept 2, 2026) with fallback capability
  model: env.ai.geminiModel || 'gemini-3.8-flash',
  temperature: 0.3,
  maxOutputTokens: 4096,
  requestTimeoutMs: 30000,
  retry: {
    maxRetries: 2,
    backoffMs: 1000,
  },
}

/**
 * Get active configuration with optional overrides for specific tasks
 * (e.g. lower temperature for structured outputs)
 */
export function getGeminiConfig(overrides?: Partial<GeminiConfig>): GeminiConfig {
  return {
    ...geminiConfig,
    ...overrides,
    retry: {
      ...geminiConfig.retry,
      ...(overrides?.retry || {}),
    },
  }
}

/**
 * Intent-based token budgets.
 *
 * Most conversational queries do not need the full 4096-token budget.
 * Reducing max tokens for simple chat lowers latency and AI provider cost
 * without sacrificing quality for longer generation tasks.
 */
export const TOKEN_BUDGETS = {
  /** Universal assistant chat — answers are concise by design */
  chat: 1024,
  /** Preparation plans — need more tokens for full structured output */
  plan: 2048,
  /** Document explanation — moderate length needed */
  documentExplain: 2048,
  /** Document analysis (full multimodal) — may be longer */
  documentAnalyze: 2048,
  /** Translation — output is typically proportional to input */
  translation: 1024,
} as const

export type TokenBudgetKey = keyof typeof TOKEN_BUDGETS
