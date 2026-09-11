import { NextResponse } from 'next/server'
import { z } from 'zod'
import { synthesizeSpeech } from '@/lib/voice/text-to-speech'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const synthesizeSchema = z.object({
  text: z.string().min(1).max(1000),
  languageCode: z.string().default('en-IN'),
})

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`voice_syn_${ip}`, 10, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Voice synthesis limit reached. Please wait a minute.' },
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
    const result = synthesizeSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid synthesis request', details: result.error.format() },
        { status: 400 }
      )
    }

    const { text, languageCode } = result.data
    const synthResult = await synthesizeSpeech(text, languageCode)

    if (synthResult) {
      return NextResponse.json(synthResult)
    }

    return NextResponse.json({
      audioBase64: null,
      provider: 'browser',
      message: 'Server speech synthesis not active. Using browser speech synthesis.',
    })
  } catch (err: unknown) {
    logger.error('Voice Synthesize Error:', { error: String(err) })
    return NextResponse.json(
      { error: 'Failed to process voice synthesis.' },
      { status: 500 }
    )
  }
}
