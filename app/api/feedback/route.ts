import { NextResponse } from 'next/server'
import { feedbackSchema } from '@/lib/validation/schemas'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const result = feedbackSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const { category, rating, message, page_context } = result.data

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
          message,
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
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to submit feedback. Please try again.' },
      { status: 500 }
    )
  }
}
