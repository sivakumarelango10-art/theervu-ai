/**
 * Unified AI Client Interface for TheervuAI
 *
 * Forwards requests to the centralized Gemini engine with safety screening,
 * structured output validation, timeout management, and graceful local fallback.
 */

export {
  generateChatResponse,
  generatePreparationPlan,
  explainDocument,
  executeGeminiWithRetry,
  getGeminiClient,
  normalizeGeminiError,
} from '@/lib/ai/gemini'

export { geminiConfig, getGeminiConfig } from '@/lib/ai/config'
export * from '@/lib/ai/types'
export * from '@/lib/ai/schemas'
