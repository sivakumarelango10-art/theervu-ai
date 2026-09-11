import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SEED_SERVICES } from '@/lib/data/services'
import { env } from '@/lib/config/env'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!env.supabase.isConfigured) {
    const service = SEED_SERVICES.find((s) => s.slug === slug)
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }
    return NextResponse.json({ service })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !data) {
      const fallback = SEED_SERVICES.find((s) => s.slug === slug)
      if (fallback) return NextResponse.json({ service: fallback })
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json({ service: data })
  } catch {
    const fallback = SEED_SERVICES.find((s) => s.slug === slug)
    if (fallback) return NextResponse.json({ service: fallback })
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
