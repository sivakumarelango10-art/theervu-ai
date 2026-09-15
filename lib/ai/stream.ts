import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { geminiConfig, TOKEN_BUDGETS } from '@/lib/ai/config'
import { evaluateSafety } from '@/lib/ai/safety'
import { generateFallbackChatResponse } from '@/lib/ai/fallback'
import {
  UNIVERSAL_ASSISTANT_SYSTEM_PROMPT,
  buildLanguageInstruction,
} from '@/lib/ai/prompts'
import { getHybridRetrievalContext } from '@/lib/ai/hybrid'
import type { ChatResponse } from '@/lib/ai/types'

export interface StreamChunkEvent {
  type: 'token' | 'meta' | 'done' | 'error'
  content?: string
  data?: Partial<ChatResponse> & { conversationId?: string }
  error?: string
}

/**
 * Creates an SSE ReadableStream that streams Gemini response tokens in real-time.
 * If Gemini is not configured or fails, it streams the verified fallback response cleanly.
 */
export function createChatEventStream(
  question: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  preferredLanguage: string = 'en',
  onComplete?: (fullText: string, meta: Partial<ChatResponse>) => Promise<void> | void
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      function send(event: StreamChunkEvent) {
        const payload = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(payload))
      }

      // 1. Safety Screening
      const safety = evaluateSafety(question)
      if (!safety.isSafe) {
        send({
          type: 'token',
          content:
            'I cannot fulfill this request because it violates our safety guidelines. Please ask a question related to civic, institutional, or healthcare preparation.',
        })
        send({
          type: 'done',
          data: {
            summary: 'Request could not be processed.',
            sources: [],
            isEmergency: false,
          },
        })
        controller.close()
        return
      }

      // 2. Emergency Routing
      if (safety.isEmergency) {
        const emergencyText =
          safety.emergencyResponse ||
          '🚨 Urgent medical or safety emergency detected. Call 112 or 108 immediately.'
        send({ type: 'token', content: emergencyText })
        send({
          type: 'done',
          data: {
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
          },
        })
        controller.close()
        return
      }

      const client = getGeminiClient()
      const hybrid = getHybridRetrievalContext(safety.sanitizedInput)
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

      const meta: Partial<ChatResponse> = {
        summary: hybrid.matchedService
          ? `Official guidance for ${hybrid.matchedService.name}.`
          : 'Guidance tailored to your situation.',
        sources,
        disclaimer: safety.disclaimer,
        isEmergency: false,
      }

      // 3. Fallback streaming if client not configured
      if (!client) {
        const fallback = generateFallbackChatResponse(question)
        // Stream the fallback text in smooth word tokens
        const words = fallback.answer.split(/(\s+)/)
        for (const word of words) {
          send({ type: 'token', content: word })
          // Small yield to allow smooth UI rendering
          await new Promise((r) => setTimeout(r, 12))
        }

        send({
          type: 'done',
          data: {
            ...meta,
            summary: fallback.summary,
            steps: fallback.steps,
            sources: fallback.sources?.length ? fallback.sources : sources,
          },
        })

        if (onComplete) {
          try {
            await onComplete(fallback.answer, meta)
          } catch {}
        }
        controller.close()
        return
      }

      // 4. Live Gemini Streaming
      try {
        const languageInstruction = buildLanguageInstruction(preferredLanguage)
        let systemInstruction = `${UNIVERSAL_ASSISTANT_SYSTEM_PROMPT}\n\n${languageInstruction}`
        if (hybrid.hybridSystemContext) {
          systemInstruction += `\n\n${hybrid.hybridSystemContext}`
        }

        const contents =
          history.length === 0
            ? safety.sanitizedInput
            : [
                ...history.slice(-6).map((h) => ({
                  role: h.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: h.content }],
                })),
                {
                  role: 'user' as const,
                  parts: [{ text: safety.sanitizedInput }],
                },
              ]

        const responseStream = await client.models.generateContentStream({
          model: geminiConfig.model,
          contents,
          config: {
            systemInstruction,
            temperature: geminiConfig.temperature,
            maxOutputTokens: TOKEN_BUDGETS.chat,
          },
        })

        let accumulatedText = ''

        for await (const chunk of responseStream) {
          const chunkText = chunk.text || ''
          if (chunkText) {
            accumulatedText += chunkText
            send({ type: 'token', content: chunkText })
          }
        }

        send({
          type: 'done',
          data: {
            ...meta,
            answer: accumulatedText,
          },
        })

        if (onComplete) {
          try {
            await onComplete(accumulatedText, meta)
          } catch {}
        }
      } catch (err: unknown) {
        const norm = normalizeGeminiError(err)
        console.warn(`Gemini Stream Error [${norm.code}], streaming verified fallback:`, norm.userMessage)
        
        const fallback = generateFallbackChatResponse(question)
        const words = fallback.answer.split(/(\s+)/)
        for (const word of words) {
          send({ type: 'token', content: word })
          await new Promise((r) => setTimeout(r, 10))
        }

        send({
          type: 'done',
          data: {
            ...meta,
            summary: fallback.summary,
            steps: fallback.steps,
            sources: fallback.sources?.length ? fallback.sources : sources,
          },
        })

        if (onComplete) {
          try {
            await onComplete(fallback.answer, meta)
          } catch {}
        }
      } finally {
        controller.close()
      }
    },
  })
}
