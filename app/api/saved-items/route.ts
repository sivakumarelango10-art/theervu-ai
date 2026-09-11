import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

export async function GET() {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ savedItems: [] })
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
      console.error('Saved items fetch error:', error.message)
      return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 })
    }

    return NextResponse.json({ savedItems: items || [] })
  } catch (err: any) {
    console.error('Saved items GET error:', err?.message || err)
    return NextResponse.json({ error: 'Failed to fetch saved items' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, mode: 'local' })
  }

  try {
    const json = await request.json()
    const { item_type, item_reference_id, title, metadata } = json

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
        item_type,
        item_reference_id,
        title,
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Saved items insert error:', error.message)
      return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, savedItem: data })
  } catch (err: any) {
    console.error('Saved items POST error:', err?.message || err)
    return NextResponse.json({ error: 'Failed to save item' }, { status: 500 })
  }
}
