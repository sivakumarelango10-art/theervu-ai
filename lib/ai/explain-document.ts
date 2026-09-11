import { env } from '@/lib/config/env'
import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { DOCUMENT_EXPLAIN_PROMPT, buildLanguageInstruction } from '@/lib/ai/prompts'
import { evaluateSafety } from '@/lib/ai/safety'
import { geminiDocumentExplainSchema } from '@/lib/ai/schemas'

export async function explainGeminiDocument(
  extractedText: string,
  documentType?: string,
  preferredLanguage: string = 'en'
) {
  const safety = evaluateSafety(extractedText)
  const gemini = getGeminiClient()

  const defaultFallback = {
    documentType: documentType || 'Official Document',
    plainLanguageSummary:
      'This document contains institutional details or instructions. Review the key requirements below, verify any deadlines, and bring supporting identification when visiting.',
    keyDetails: [
      { label: 'Document Status', value: 'Ready for Review' },
      { label: 'Supporting ID', value: 'Check required identification' },
    ],
    actionItems: [
      'Keep the physical original document safe and make two photocopies.',
      'Verify any appointment slots or validity dates indicated.',
      'Ensure names and dates match your official government proof of identity.',
    ],
    questionsToAsk: [
      'What is the standard processing time and acknowledgment receipt protocol?',
    ],
    warnings: [
      'Do not laminate or write over original official certificates or documents.',
    ],
    disclaimer: safety.disclaimer,
  }

  if (!gemini || !safety.isSafe) {
    return defaultFallback
  }

  try {
    const languageInstruction = buildLanguageInstruction(preferredLanguage)
    const prompt = `Document Category: ${documentType || 'General'}\nContent:\n${extractedText.slice(0, 4000)}\n\nPlease provide a clear explanation conforming strictly to the requested JSON schema.`

    const response = await gemini.models.generateContent({
      model: env.ai.geminiModel,
      contents: prompt,
      config: {
        systemInstruction: `${DOCUMENT_EXPLAIN_PROMPT}\n\n${languageInstruction}`,
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    const raw = response.text
    if (raw) {
      try {
        const parsedJson = JSON.parse(raw)
        const validated = geminiDocumentExplainSchema.safeParse(parsedJson)
        if (validated.success) {
          return {
            ...validated.data,
            disclaimer: safety.disclaimer,
          }
        }
      } catch (jsonErr) {
        console.warn('Could not parse Gemini document explanation JSON, falling back:', jsonErr)
      }
    }

    return defaultFallback
  } catch (error) {
    const norm = normalizeGeminiError(error)
    console.error(`Gemini Document Explanation Error [${norm.code}]:`, norm.userMessage)
    return defaultFallback
  }
}
