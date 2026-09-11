import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { geminiConfig, getGeminiConfig, type GeminiConfig } from '@/lib/ai/config'
import { evaluateSafety } from '@/lib/ai/safety'
import { generateFallbackChatResponse } from '@/lib/ai/fallback'
import {
  UNIVERSAL_ASSISTANT_SYSTEM_PROMPT,
  buildLanguageInstruction,
} from '@/lib/ai/prompts'
import { generateGeminiPreparationPlan } from '@/lib/ai/generate-preparation-plan'
import { explainGeminiDocument } from '@/lib/ai/explain-document'
import { getHybridRetrievalContext } from '@/lib/ai/hybrid'
import type {
  ChatResponse,
  ChatMessage,
  NormalizedGeminiError,
} from '@/lib/ai/types'

export * from '@/lib/ai/config'
export * from '@/lib/ai/types'
export { getGeminiClient, normalizeGeminiError }

/**
 * Executes a Gemini API call with configured timeout and exponential backoff retries.
 */
export async function executeGeminiWithRetry<T>(
  operation: (client: NonNullable<ReturnType<typeof getGeminiClient>>) => Promise<T>,
  configOverrides?: Partial<GeminiConfig>
): Promise<T> {
  const config = getGeminiConfig(configOverrides)
  const client = getGeminiClient()

  if (!client) {
    throw new Error('GEMINI_NOT_CONFIGURED')
  }

  let attempt = 0
  let lastError: unknown

  while (attempt <= config.retry.maxRetries) {
    try {
      // Execute with timeout promise race
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Timeout: Gemini request exceeded ${config.requestTimeoutMs}ms`))
        }, config.requestTimeoutMs)
      })

      return await Promise.race([operation(client), timeoutPromise])
    } catch (error: any) {
      lastError = error
      const norm = normalizeGeminiError(error)

      // Do not retry on client-side errors or authentication issues
      if (norm.code === 'AUTH_FAILED' || norm.code === 'INVALID_PAYLOAD') {
        throw error
      }

      attempt++
      if (attempt <= config.retry.maxRetries) {
        const delay = config.retry.backoffMs * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * Centralized Universal AI Chat Assistant entry point
 */
export async function generateChatResponse(
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  preferredLanguage: string = 'en'
): Promise<ChatResponse> {
  // 1. Safety screening
  const safety = evaluateSafety(question)
  if (!safety.isSafe) {
    return {
      answer:
        'I cannot fulfill this request because it violates our safety guidelines. Please ask a question related to civic, institutional, or healthcare preparation.',
      summary: 'Request could not be processed.',
      steps: [],
      sources: [],
      isEmergency: false,
    }
  }

  // 2. Emergency routing
  if (safety.isEmergency) {
    return {
      answer: safety.emergencyResponse || 'Urgent situation detected.',
      summary: 'Emergency services required immediately.',
      steps: [
        'Call 112 / 108 immediately.',
        'Follow instructions of emergency dispatchers.',
        'Do not wait for online guidance.',
      ],
      sources: [
        {
          title: 'National Emergency Number (India)',
          url: 'tel:112',
          authority: 'Ministry of Home Affairs',
        },
      ],
      isEmergency: true,
      disclaimer: safety.disclaimer,
    }
  }

  // 3. Fallback check if Gemini is not configured
  const client = getGeminiClient()
  if (!client) {
    const fallback = generateFallbackChatResponse(question)
    return {
      ...fallback,
      disclaimer: safety.disclaimer,
      isEmergency: false,
    }
  }

  // 4. Live generation with retry & timeout
  try {
    const languageInstruction = buildLanguageInstruction(preferredLanguage)
    const hybrid = getHybridRetrievalContext(safety.sanitizedInput)
    let systemInstruction = `${UNIVERSAL_ASSISTANT_SYSTEM_PROMPT}\n\n${languageInstruction}`
    if (hybrid.hybridSystemContext) {
      systemInstruction += `\n\n${hybrid.hybridSystemContext}`
    }

    let contents: any
    if (history.length === 0) {
      contents = safety.sanitizedInput
    } else {
      contents = [
        ...history.slice(-6).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
        {
          role: 'user',
          parts: [{ text: safety.sanitizedInput }],
        },
      ]
    }

    const response = await executeGeminiWithRetry(async (gemini) => {
      return await gemini.models.generateContent({
        model: geminiConfig.model,
        contents,
        config: {
          systemInstruction,
          temperature: geminiConfig.temperature,
          maxOutputTokens: geminiConfig.maxOutputTokens,
        },
      })
    })

    const content = response.text || ''

    const sources = hybrid.matchedService
      ? [
          {
            title: hybrid.matchedService.sourceName,
            url: hybrid.matchedService.officialSourceUrl,
            authority: hybrid.matchedService.authority,
          },
          {
            title: 'National Government Services Portal',
            url: 'https://services.india.gov.in/',
            authority: 'Government of India',
          },
        ]
      : [
          {
            title: 'National Government Services Portal',
            url: 'https://services.india.gov.in/',
            authority: 'Government of India',
          },
        ]

    return {
      answer: content,
      summary: hybrid.matchedService
        ? `Official guidance for ${hybrid.matchedService.name}.`
        : 'Guidance tailored to your situation.',
      steps: [],
      sources,
      disclaimer: safety.disclaimer,
      isEmergency: false,
    }
  } catch (error: any) {
    const norm = normalizeGeminiError(error)
    console.error(`Gemini Chat Error [${norm.code}], falling back to local engine:`, norm.userMessage)
    const fallback = generateFallbackChatResponse(question)
    return {
      ...fallback,
      disclaimer: safety.disclaimer,
      isEmergency: false,
    }
  }
}

export { generateGeminiPreparationPlan as generatePreparationPlan }
export { explainGeminiDocument as explainDocument }
