import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { getClientIp, checkRateLimit } from '@/lib/security/rate-limit'
import { logger } from '@/lib/observability/logger'

const PRIVATE_CACHE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
}

const createReminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  reminder_type: z
    .enum(['appointment', 'document_expiry', 'checklist', 'follow_up'])
    .default('appointment'),
  scheduled_for: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid scheduled date/time format',
  }),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`reminders_get_${ip}`, 60, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit reached.' },
      { status: 429, headers: { 'Retry-After': String(rl.reset) } }
    )
  }

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ reminders: [] }, { headers: PRIVATE_CACHE_HEADERS })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: reminders, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_for', { ascending: true })

    if (error) {
      logger.error('Fetch Reminders Error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 })
    }

    return NextResponse.json({ reminders: reminders || [] }, { headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Reminders API Error:', { error: String(err) })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request)
  const rl = checkRateLimit(`reminders_post_${ip}`, 20, 60)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit reached. Please wait before creating more reminders.' },
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
    const result = createReminderSchema.safeParse(json)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid reminder parameters', details: result.error.format() },
        { status: 400 }
      )
    }

    const { title, description, reminder_type, scheduled_for, metadata } = result.data

    if (!env.supabase.isConfigured) {
      return NextResponse.json({
        id: 'mock_' + Math.random().toString(36).substring(7),
        title,
        description,
        reminder_type,
        scheduled_for,
        status: 'pending',
        created_at: new Date().toISOString(),
      }, { status: 201, headers: PRIVATE_CACHE_HEADERS })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required to create reminders' },
        { status: 401 }
      )
    }

    const { data: reminder, error } = await supabase
      .from('reminders')
      .insert({
        user_id: user.id,
        title,
        description: description || '',
        reminder_type,
        scheduled_for,
        status: 'pending',
        metadata: metadata || {},
      })
      .select()
      .single()

    if (error) {
      logger.error('Insert Reminder Error:', { error: error.message })
      return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 })
    }

    return NextResponse.json(reminder, { status: 201, headers: PRIVATE_CACHE_HEADERS })
  } catch (err: unknown) {
    logger.error('Create Reminder API Error:', { error: String(err) })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
