import { geminiConfig } from '@/lib/ai/config'
import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { DOCUMENT_EXPLAIN_PROMPT, buildLanguageInstruction } from '@/lib/ai/prompts'
import { evaluateSafety } from '@/lib/ai/safety'
import { geminiDocumentExplainSchema, type GeminiDocumentExplain } from '@/lib/ai/schemas'

export interface MultimodalFileData {
  mimeType: string
  base64: string
}

/**
 * Explains civic or institutional documents using Google Gemini.
 * Supports plain extracted text and direct multimodal image/PDF attachments.
 */
export async function explainGeminiDocument(
  extractedText: string,
  documentType?: string,
  preferredLanguage: string = 'en',
  fileData?: MultimodalFileData
): Promise<GeminiDocumentExplain> {
  const safety = evaluateSafety(extractedText || 'Document analysis')
  const gemini = getGeminiClient()

  const defaultFallback: GeminiDocumentExplain = {
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
    const textPrompt = `Document Category: ${documentType || 'General'}\nContent / Context:\n${(extractedText || '').slice(0, 4000)}\n\nPlease provide a clear, empathetic explanation conforming strictly to the requested JSON schema. Never claim legal or medical certainty. Highlight any unknown or unverified details.`

    let contents: any = textPrompt

    // If multimodal file is supplied, attach it as inlineData
    if (fileData && fileData.base64 && fileData.mimeType) {
      contents = [
        {
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64,
          },
        },
        {
          text: textPrompt,
        },
      ]
    }

    const response = await gemini.models.generateContent({
      model: geminiConfig.model,
      contents,
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
