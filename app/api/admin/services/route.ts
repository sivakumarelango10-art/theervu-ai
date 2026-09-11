import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminUser } from '@/lib/admin/auth'
import { SEED_SERVICES } from '@/lib/data/services'

const adminServiceSchema = z.object({
  name: z.string().min(3).max(150),
  slug: z.string().min(3).max(100),
  category: z.string().min(2).max(100),
  description: z.string().min(10).max(1000),
  department: z.string().min(2).max(150),
  authority: z.string().min(2).max(150),
  state: z.string().min(2).max(100).default('All India'),
  district: z.string().max(100).optional().nullable(),
  office_type: z.string().min(2).max(100),
  official_url: z.string().url(),
  official_source_url: z.string().url(),
  source_name: z.string().min(2).max(100),
  source_type: z.enum(['central_gov', 'state_gov', 'municipal', 'statutory']),
  verification_status: z.enum(['verified', 'needs_confirmation', 'location_dependent']).default('verified'),
  eligibility: z.array(z.string()).default([]),
  required_documents: z.array(z.any()).default([]),
  application_steps: z.array(z.any()).default([]),
  appointment_required: z.boolean().default(false),
  fees: z.array(z.any()).default([]),
  expected_timeline: z.string().default('Varies'),
  important_notes: z.array(z.string()).default([]),
  location_dependency: z.enum(['none', 'state', 'district', 'municipal']).default('none'),
  disclaimer: z.string().optional().nullable(),
  status: z.enum(['active', 'archived']).default('active'),
})

export async function GET() {
  const auth = await verifyAdminUser()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.user ? 403 : 401 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      services: data || SEED_SERVICES,
      count: data?.length || SEED_SERVICES.length,
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminUser()
  if (!auth.isAdmin || !auth.user) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.user ? 403 : 401 })
  }

  try {
    const body = await request.json()
    const validated = adminServiceSchema.safeParse(body)

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid service record format', details: validated.error.format() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .insert({
        ...validated.data,
        last_verified_at: new Date().toISOString(),
        verified_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { service: data, message: 'Service published to verified registry' },
      { status: 201 }
    )
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
