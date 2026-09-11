import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

const updateReminderSchema = z.object({
  status: z.enum(['pending', 'completed', 'dismissed']).optional(),
  scheduled_for: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid scheduled date/time format',
    })
    .optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
})

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params
  const ip = getClientIp(request)
  const rl = checkRateLimit(`reminder_patch_${ip}`, 30, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit reached.' },
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
    const result = updateReminderSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid update parameters', details: result.error.format() },
        { status: 400 }
      )
    }

    if (!env.supabase.isConfigured) {
      return NextResponse.json({ success: true, id, ...result.data })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: updated, error } = await supabase
      .from('reminders')
      .update({
        ...result.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Update Reminder Error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 })
    }

    if (!updated) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    return NextResponse.json(updated, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Update Reminder API Error:', { error: String(err) })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params
  const ip = getClientIp(request)
  const rl = checkRateLimit(`reminder_del_${ip}`, 30, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit reached.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, id }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Delete Reminder Error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Delete Reminder API Error:', { error: String(err) })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
