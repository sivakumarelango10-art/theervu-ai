import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
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

    // Verify ownership of plan
    const { data: plan, error: planError } = await supabase
      .from('preparation_plans')
      .select('id, title, purpose, location, summary, status, created_at, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: 'Preparation plan not found' }, { status: 404 })
    }

    // Fetch associated checklist items
    const { data: items, error: itemsError } = await supabase
      .from('preparation_items')
      .select('id, item_type, title, description, is_required, is_completed, priority, source_url')
      .eq('preparation_plan_id', id)
      .order('priority', { ascending: true })

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to fetch checklist items' }, { status: 500 })
    }

    return NextResponse.json({
      plan: {
        ...plan,
        items: items || [],
      },
    })
  } catch (error) {
    console.error('Preparation plan GET [id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ error: 'Database service not configured' }, { status: 503 })
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

    const { error } = await supabase
      .from('preparation_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete preparation plan DB error:', error)
      return NextResponse.json({ error: 'Failed to delete preparation plan' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Preparation plan DELETE [id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
