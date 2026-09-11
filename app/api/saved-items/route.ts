import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { logger } from '@/lib/observability/logger'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

export async function GET() {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ savedItems: [] }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: items, error } = await supabase
      .from('saved_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Saved items fetch error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 })
    }

    return NextResponse.json({ savedItems: items || [] }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Saved items GET error:', { error: String(err) })
    return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, mode: 'local' }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    if (typeof json !== 'object' || json === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { item_type, item_reference_id, title, metadata } = json as Record<string, unknown>

    if (!item_type || !item_reference_id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sign in required to save items' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('saved_items')
      .insert({
        user_id: user.id,
        item_type: String(item_type),
        item_reference_id: String(item_reference_id),
        title: String(title),
        metadata: (typeof metadata === 'object' && metadata !== null) ? metadata : {},
      })
      .select()
      .single()

    if (error) {
      logger.error('Saved items insert error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, savedItem: data }, { status: 201, headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Saved items POST error:', { error: String(err) })
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
  }
}
