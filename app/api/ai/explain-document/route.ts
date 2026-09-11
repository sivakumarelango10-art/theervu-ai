import { NextResponse } from 'next/server'
import { documentExplainSchema } from '@/lib/validation/schemas'
import { explainDocument } from '@/lib/ai/client'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`explain_${ip}`, 15, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Document explanation rate limit reached. Please wait a minute before requesting another explanation.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  let json: any
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const result = documentExplainSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid document content', details: result.error.format() },
        { status: 400 }
      )
    }

    const { extractedText, documentType, preferredLanguage } = result.data

    const explanation = await explainDocument(
      extractedText,
      documentType,
      preferredLanguage
    )

    return NextResponse.json(explanation)
  } catch (error: any) {
    console.error('Explain Document API Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate document explanation. Please try again.' },
      { status: 500 }
    )
  }
}
