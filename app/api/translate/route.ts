import { NextResponse } from 'next/server'
import { z } from 'zod'
import { translateText } from '@/lib/i18n/translation'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const translateSchema = z.object({
  text: z.string().min(1).max(10000),
  sourceLanguage: z.string().default('en'),
  targetLanguage: z.string().min(2).max(10),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`translate_${ip}`, 20, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Translation rate limit reached. Please wait a minute before submitting another request.' },
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
    const result = translateSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid translation request', details: result.error.format() },
        { status: 400 }
      )
    }

    const { text, sourceLanguage, targetLanguage } = result.data
    const translation = await translateText({
      text,
      sourceLanguage,
      targetLanguage,
    })

    return NextResponse.json(translation)
  } catch (error: unknown) {
    logger.error('Translation API Error:', { error: String(error) })
    return NextResponse.json(
      { error: 'Failed to translate content. Please try again.' },
      { status: 500 }
    )
  }
}
