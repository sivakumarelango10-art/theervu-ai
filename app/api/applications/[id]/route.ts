import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

const updateApplicationSchema = z.object({
  status: z
    .enum([
      'draft',
      'submitted',
      'under_review',
      'info_requested',
      'approved',
      'rejected',
      'completed',
      'unknown',
    ])
    .optional(),
  next_action: z.string().max(250).optional().nullable(),
  next_action_deadline: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
})

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('application_trackers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Application tracker not found' }, { status: 404 })
    }

    return NextResponse.json({ application: data }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Application GET error:', { error: String(err) })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params
  const ip = getClientIp(request)
  const rl = checkRateLimit(`app_patch_${ip}`, 40, 60)
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

  const validated = updateApplicationSchema.safeParse(json)
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid update parameters', details: validated.error.format() },
      { status: 400 }
    )
  }

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, id, ...validated.data }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updatePayload: Record<string, string | null | undefined> = {
      ...validated.data,
      updated_at: new Date().toISOString(),
    }

    if (validated.data.status) {
      updatePayload.last_status_date = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('application_trackers')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      logger.error('Update application tracker error:', { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Application tracker not found' }, { status: 404 })
    }

    return NextResponse.json({ application: data }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Application PATCH error:', { error: String(err) })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const { id } = params
  const ip = getClientIp(request)
  const rl = checkRateLimit(`app_del_${ip}`, 30, 60)
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
      .from('application_trackers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      logger.error('Delete application tracker error:', { error: error.message })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Application DELETE error:', { error: String(err) })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
