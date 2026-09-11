import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateChecklistItemSchema } from '@/lib/validation/schemas'
import { env } from '@/lib/config/env'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: planId } = await params

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, mode: 'fallback' })
  }

  try {
    const json = await request.json()
    const itemId = json.itemId
    const isCompleted =
      typeof json.is_completed === 'boolean'
        ? json.is_completed
        : typeof json.isCompleted === 'boolean'
        ? json.isCompleted
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

    // Verify ownership of plan
    const { data: plan } = await supabase
      .from('preparation_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single()

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found or unauthorized' }, { status: 404 })
    }

    // Update checklist item
    const { error: updateError } = await supabase
      .from('preparation_items')
      .update({ is_completed: isCompleted })
      .eq('id', itemId)
      .eq('preparation_plan_id', planId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, itemId, isCompleted })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
