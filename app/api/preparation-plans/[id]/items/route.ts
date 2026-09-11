import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateChecklistItemSchema } from '@/lib/validation/schemas'
import { env } from '@/lib/config/env'
import { logger } from '@/lib/observability/logger'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, mode: 'fallback' }, { headers: PRIVATE_CACHE_HEADERS })
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

    const payload = json as Record<string, unknown>
    const itemId = typeof payload.itemId === 'string' ? payload.itemId : null
    const isCompleted =
      typeof payload.is_completed === 'boolean'
        ? payload.is_completed
        : typeof payload.isCompleted === 'boolean'
        ? payload.isCompleted
        : null

    if (!itemId || isCompleted === null) {
      return NextResponse.json({ error: 'itemId and is_completed (boolean) required' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure plan belongs to user
    const { data: plan, error: planError } = await supabase
      .from('preparation_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (!plan || planError) {
      return NextResponse.json({ error: 'Plan not found or unauthorized' }, { status: 404 })
    }

    // Update checklist item
    const { error: updateError } = await supabase
      .from('preparation_items')
      .update({ is_completed: isCompleted })
      .eq('id', itemId)
      .eq('preparation_plan_id', planId)

    if (updateError) {
      logger.error('Checklist item update error:', { error: updateError.message })
      return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 })
    }

    return NextResponse.json({ success: true, itemId, isCompleted }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Checklist item PATCH exception:', { error: String(err) })
    return NextResponse.json({ error: 'Failed to update checklist item' }, { status: 500 })
  }
}
