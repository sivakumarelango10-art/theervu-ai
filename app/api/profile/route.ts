import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { profileUpdateSchema } from '@/lib/validation/schemas'
import { env } from '@/lib/config/env'
import { logger } from '@/lib/observability/logger'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

export async function GET() {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({
      profile: {
        id: 'guest',
        full_name: 'Guest User',
        email: 'guest@theervu.ai',
        preferred_language: 'en',
      },
    }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ profile: profile || { id: user.id, email: user.email } }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Profile GET error:', { error: String(err) })
    return NextResponse.json({ error: 'Failed to retrieve user profile' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, message: 'Settings saved (local mode)' }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const result = profileUpdateSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { full_name, preferred_language } = result.data

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        preferred_language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Profile update error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: updated }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Profile PATCH exception:', { error: String(err) })
    return NextResponse.json({ error: 'Failed to process profile update' }, { status: 500 })
  }
}
