import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

const applicationSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  service_name: z.string().min(2, 'Service name is required').max(150),
  authority: z.string().max(150).optional().nullable(),
  reference_number: z.string().max(100).optional().nullable(),
  portal_url: z.string().url().optional().nullable().or(z.literal('')),
  status: z.enum([
    'draft',
    'submitted',
    'under_review',
    'info_requested',
    'approved',
    'rejected',
    'completed',
    'unknown',
  ]).default('submitted'),
  submission_date: z.string().optional().nullable(),
  next_action: z.string().max(250).optional().nullable(),
  next_action_deadline: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export async function GET() {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({
      applications: [],
      notice: 'Supabase is not configured. Tracker persistence requires database setup.',
    })
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

    const { data, error } = await supabase
      .from('application_trackers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ applications: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json(
      { error: 'Database is not configured for application tracking' },
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

    const body = await request.json()
    const validated = applicationSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid application tracking data', details: validated.error.format() },
        { status: 400 }
      )
    }

    const payload = {
      ...validated.data,
      user_id: user.id,
      portal_url: validated.data.portal_url || null,
      last_status_date: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('application_trackers')
      .insert(payload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { application: data, message: 'Application tracker created successfully' },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
