import { geminiConfig, TOKEN_BUDGETS } from '@/lib/ai/config'
import { getGeminiClient, normalizeGeminiError } from '@/lib/ai/providers'
import { evaluateSafety } from '@/lib/ai/safety'
import { buildLanguageInstruction } from '@/lib/ai/prompts'
import {
  advancedDocumentExtractionSchema,
  type AdvancedDocumentExtraction,
  type DocumentWorkflowAction,
} from '@/lib/ai/schemas'

export const SUPPORTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
] as const

export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp',
] as const

export interface DocumentAnalysisInput {
  text?: string
  fileBase64?: string
  mimeType?: string
  workflow?: DocumentWorkflowAction
  question?: string
  preferredLanguage?: string
}

export const WORKFLOW_PROMPTS: Record<DocumentWorkflowAction, string> = {
  explain:
    'Provide a comprehensive plain-language explanation of this document. Explain what kind of document it is, who issued it, what it means for the recipient, and what they should verify.',
  summarize:
    'Provide a crisp, clear 2-3 sentence summary of the core purpose and immediate implications of this document.',
  extract_info:
    'Extract all critical data fields (reference numbers, department name, beneficiary name, address, fees, certificate IDs) with confidence levels. Mark missing fields as unknown.',
  required_actions:
    'Identify all mandatory and recommended actions the holder must perform. Prioritize each action as high, medium, or low.',
  missing_info:
    'Audit this document for missing attachments, absent stamps/signatures, incomplete form sections, or unverified declarations.',
  important_dates:
    'Extract every date mentioned in this document (application date, hearing date, due date, expiry date, validity period).',
  qa:
    'Answer the user question accurately based solely on the visible content of this document.',
  difficult_terms:
    'Identify and explain any complex legal, medical, or administrative jargon used in this document in plain, everyday language.',
  next_steps:
    'Generate a sequence of practical next steps the recipient should take to move forward safely.',
}

/**
 * Executes advanced document intelligence via Gemini 3.8 Flash multimodal API.
 */
export async function analyzeDocumentMultimodal(
  input: DocumentAnalysisInput
): Promise<AdvancedDocumentExtraction> {
  const workflow = input.workflow || 'explain'
  const lang = input.preferredLanguage || 'en'
  const safety = evaluateSafety(input.text || input.question || 'Document inspection')

  const fallbackResult: AdvancedDocumentExtraction = {
    documentType: 'Official Document',
    summary:
      'This document contains institutional details. Review the key information below, check any deadlines, and carry supporting identification when visiting official counters.',
    keyInformation: [
      { label: 'Document Status', value: 'Ready for Review', confidence: 'medium' },
      { label: 'Supporting ID', value: 'Verification Required', confidence: 'medium' },
    ],
    importantDates: [
      {
        label: 'Action Timeline',
        date: 'Please verify on original notice',
        notes: 'Check for specific counter appointment or validity dates',
      },
    ],
    requiredActions: [
      {
        title: 'Keep physical original safe',
        description: 'Store the original physical certificate/notice securely and make photocopies.',
        priority: 'high',
      },
      {
        title: 'Verify dates and details',
        description: 'Ensure names, parentage, and dates match your government proof of identity.',
        priority: 'high',
      },
    ],
    missingInformation: [
      'Specific counter fee schedule (verify at the official office)',
    ],
    warnings: [
      'Do not laminate or alter original official documents or certificates.',
      'Information extracted by AI is for civic guidance and must be verified with the issuing authority.',
    ],
    verificationNotes: [
      'Please verify all details directly with the issuing department.',
    ],
  }

  const client = getGeminiClient()
  if (!client || !safety.isSafe) {
    return fallbackResult
  }

  try {
    const languageInstruction = buildLanguageInstruction(lang)
    const workflowInstruction = WORKFLOW_PROMPTS[workflow] || WORKFLOW_PROMPTS.explain
    const questionText = input.question ? `\nUser Question: ${input.question}` : ''

    const systemInstruction = `You are TheervuAI's Advanced Document Intelligence Specialist.
Your task is to analyze documents (official notices, government forms, hospital discharge summaries, certificates, tax bills) accurately and safely.

CRITICAL RESPONSIBILITY RULES:
1. STRICT TRUTHFULNESS: Do not invent missing dates, fees, document numbers, or names. If a detail is not visible, state "Unable to determine" or "Not visible in the document".
2. NO LEGAL / MEDICAL CERTIFICATION: Never certify a document as authentic or legally binding. Never diagnose illnesses.
3. STRUCTURED JSON: You must respond STRICTLY with a valid JSON object conforming to the required schema:
{
  "documentType": "string",
  "summary": "string",
  "keyInformation": [{ "label": "string", "value": "string", "confidence": "high|medium|low|unknown" }],
  "importantDates": [{ "label": "string", "date": "string", "notes": "string" }],
  "requiredActions": [{ "title": "string", "description": "string", "priority": "high|medium|low" }],
  "missingInformation": ["string"],
  "warnings": ["string"],
  "verificationNotes": ["string"]
}

Workflow Focus: ${workflowInstruction}${questionText}
${languageInstruction}`

    const textPart = `Analyze this document following the '${workflow}' workflow.${questionText}\nText content:\n${(input.text || 'Document attached as file.').slice(0, 5000)}`

    type MultimodalPart =
      | { inlineData: { mimeType: string; data: string }; text?: never }
      | { text: string; inlineData?: never }
    let contents: string | MultimodalPart[] = textPart

    if (input.fileBase64 && input.mimeType) {
      contents = [
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.fileBase64,
          },
        },
        {
          text: textPart,
        },
      ]
    }

    const response = await client.models.generateContent({
      model: geminiConfig.model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: TOKEN_BUDGETS.documentAnalyze,
      },
    })

    const raw = response.text
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        const validated = advancedDocumentExtractionSchema.safeParse(parsed)
        if (validated.success) {
          return validated.data
        }
      } catch (parseError) {
        console.warn('Could not parse multimodal document JSON output:', parseError)
      }
    }

    return fallbackResult
  } catch (error) {
    const norm = normalizeGeminiError(error)
    console.error(`Gemini Multimodal Document Error [${norm.code}]:`, norm.userMessage)
    return fallbackResult
  }
}
