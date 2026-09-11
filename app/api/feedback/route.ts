import { NextResponse } from 'next/server'
import { feedbackSchema } from '@/lib/validation/schemas'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`feedback_${ip}`, 15, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Feedback submission limit reached. Please try again later.' },
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
    const result = feedbackSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { category, feedback_type, feature, related_record_id, rating, message, page_context } = result.data

    if (env.supabase.isConfigured) {
      try {
        const supabase = await createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        await supabase.from('feedback').insert({
          user_id: user?.id || null,
          category,
          rating,
          message: `${feedback_type ? `[${feedback_type}] ` : ''}${feature ? `(${feature}) ` : ''}${message}`,
          page_context: page_context || '/',
        })
      } catch (err) {
        console.warn('Could not insert feedback to DB:', err)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! It helps improve TheervuAI for everyone.',
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to submit feedback. Please try again.' },
      { status: 500 }
    )
  }
}
