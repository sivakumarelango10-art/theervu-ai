import { env } from '@/lib/config/env'
import {
  UNIVERSAL_ASSISTANT_SYSTEM_PROMPT,
  buildLanguageInstruction,
} from '@/lib/ai/prompts'
import {
  generateFallbackChatResponse,
  type FallbackPreparationPlan,
} from '@/lib/ai/fallback'
import { evaluateSafety } from '@/lib/ai/safety'
import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { generateGeminiPreparationPlan } from '@/lib/ai/generate-preparation-plan'
import { explainGeminiDocument } from '@/lib/ai/explain-document'

/**
 * Universal AI chat response generation using Google Gemini API
 */
export async function generateChatResponse(
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  preferredLanguage: string = 'en'
) {
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

  // 3. Obtain Gemini client
  const gemini = getGeminiClient()

  if (!gemini) {
    // Development Fallback Mode
    const fallback = generateFallbackChatResponse(question)
    return {
      ...fallback,
      disclaimer: safety.disclaimer,
      isEmergency: false,
    }
  }

  try {
    const languageInstruction = buildLanguageInstruction(preferredLanguage)
    const systemInstruction = `${UNIVERSAL_ASSISTANT_SYSTEM_PROMPT}\n\n${languageInstruction}`

    // Format conversation history for Gemini (user / model roles)
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

    const response = await gemini.models.generateContent({
      model: env.ai.geminiModel,
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    })

    const content = response.text || ''

    return {
      answer: content,
      summary: 'Guidance tailored to your situation.',
      steps: [],
      sources: [
        {
          title: 'National Government Services Portal',
          url: 'https://services.india.gov.in/',
          authority: 'Government of India',
        },
      ],
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

/**
 * Re-export plan generation and document explanation
 */
export async function generatePreparationPlan(
  task: string,
  location?: string,
  preferredLanguage: string = 'en'
): Promise<FallbackPreparationPlan> {
  return generateGeminiPreparationPlan(task, location, preferredLanguage)
}

export async function explainDocument(
  extractedText: string,
  documentType?: string,
  preferredLanguage: string = 'en'
) {
  return explainGeminiDocument(extractedText, documentType, preferredLanguage)
}
