import { GoogleGenAI } from '@google/genai'
import { env } from '@/lib/config/env'

let cachedClient: GoogleGenAI | null = null

/**
 * Initializes and returns the official Google Gemini client safely on the server.
 * Returns null if GEMINI_API_KEY is not configured or in development fallback mode.
 */
export function getGeminiClient(): GoogleGenAI | null {
  if (!env.ai.isGeminiConfigured) {
    return null
  }

  if (!cachedClient) {
    cachedClient = new GoogleGenAI({
      apiKey: env.ai.geminiApiKey,
    })
  }

  return cachedClient
}

/**
 * Normalizes external Gemini errors into safe, user-friendly messages
 * without exposing internal API keys, server paths, or stack traces.
 */
export function normalizeGeminiError(error: unknown): {
  userMessage: string
  code: string
  isRateLimit: boolean
} {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  if (lower.includes('quota') || lower.includes('429') || lower.includes('resource_exhausted')) {
    return {
      userMessage: 'Service is currently busy. Please try again in a few moments.',
      code: 'RATE_LIMIT_EXCEEDED',
      isRateLimit: true,
    }
  }

  if (lower.includes('api key') || lower.includes('unauthenticated') || lower.includes('403')) {
    return {
      userMessage: 'AI provider authentication issue. Operating in verified guidance mode.',
      code: 'AUTH_FAILED',
      isRateLimit: false,
    }
  }

  if (lower.includes('timeout') || lower.includes('deadline')) {
    return {
      userMessage: 'The request took too long to complete. Please try again.',
      code: 'TIMEOUT',
      isRateLimit: false,
    }
  }

  if (lower.includes('not found') || lower.includes('404') || lower.includes('is not supported') || lower.includes('model')) {
    return {
      userMessage: 'The requested AI model is not supported or not found. Operating in verified guidance mode.',
      code: 'MODEL_NOT_FOUND',
      isRateLimit: false,
    }
  }

  return {
    userMessage: 'We could not generate live AI guidance right now. Verified local guidance is provided.',
    code: 'GENERATION_FAILED',
    isRateLimit: false,
  }
}
