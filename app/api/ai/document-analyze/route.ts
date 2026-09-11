import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  analyzeDocumentMultimodal,
  SUPPORTED_DOCUMENT_MIME_TYPES,
} from '@/lib/ai/multimodal'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const documentAnalyzeRequestSchema = z.object({
  text: z.string().max(30000).optional(),
  fileBase64: z.string().max(20 * 1024 * 1024).optional(),
  mimeType: z.enum(SUPPORTED_DOCUMENT_MIME_TYPES).optional(),
  workflow: z
    .enum([
      'explain',
      'summarize',
      'extract_info',
      'required_actions',
      'missing_info',
      'important_dates',
      'qa',
      'difficult_terms',
      'next_steps',
    ])
    .default('explain'),
  question: z.string().max(1000).optional(),
  preferredLanguage: z.string().default('en'),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`doc_analyze_${ip}`, 15, 60)
  if (!rl.success) {
    return NextResponse.json(
      {
        error:
          'Document analysis rate limit reached. Please wait a minute before submitting another request.',
      },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const result = documentAnalyzeRequestSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid document analysis request', details: result.error.format() },
        { status: 400 }
      )
    }

    const { text, fileBase64, mimeType, workflow, question, preferredLanguage } =
      result.data

    if (!text && !fileBase64) {
      return NextResponse.json(
        { error: 'Please provide either document text or an uploaded file.' },
        { status: 400 }
      )
    }

    const analysis = await analyzeDocumentMultimodal({
      text,
      fileBase64,
      mimeType,
      workflow,
      question,
      preferredLanguage,
    })

    return NextResponse.json(analysis)
  } catch (error: unknown) {
    logger.error('Document Analysis API Error:', { error: String(error) })
    return NextResponse.json(
      { error: 'Failed to analyze document. Please try again.' },
      { status: 500 }
    )
  }
}
