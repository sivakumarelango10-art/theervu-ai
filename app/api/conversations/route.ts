import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

export async function GET(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ conversations: [] }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, title, category, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Fetch conversations DB error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations: conversations || [] }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (error: unknown) {
    logger.error('Conversations GET error:', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(ip, 30, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  if (!env.supabase.isConfigured) {
    return NextResponse.json(
      { error: 'Database service is operating in local mode' },
      { status: 503 }
    )
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'New Conversation'
    const category = typeof body.category === 'string' ? body.category : 'general'

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: title.slice(0, 80),
        category,
      })
      .select('id, title, category, created_at')
      .single()

    if (error) {
      logger.error('Create conversation DB error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ conversation }, { status: 201, headers: PRIVATE_CACHE_HEADERS })
  } catch (error: unknown) {
    logger.error('Conversations POST error:', { error: String(error) })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
