import { NextResponse } from 'next/server'
import { transcribeAudio } from '@/lib/voice/speech-to-text'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`voice_tx_${ip}`, 10, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Voice transcription limit reached. Please wait a minute.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const languageCode = (formData.get('language') as string) || 'en-IN'

    if (!file) {
      return NextResponse.json(
        { error: 'No audio recording provided' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await transcribeAudio(buffer, languageCode)
    if (result) {
      return NextResponse.json(result)
    }

    return NextResponse.json({
      transcript: '',
      provider: 'browser',
      message: 'Server speech model not active. Please use browser speech dictation.',
    })
  } catch (err: any) {
    console.error('Voice Transcribe Error:', err)
    return NextResponse.json(
      { error: 'Failed to process voice transcription.' },
      { status: 500 }
    )
  }
}
