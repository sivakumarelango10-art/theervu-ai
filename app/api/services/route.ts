import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SEED_SERVICES } from '@/lib/data/services'
import { env } from '@/lib/config/env'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const search = searchParams.get('q')?.toLowerCase()

  if (!env.supabase.isConfigured) {
    let filtered = SEED_SERVICES
    if (category && category !== 'all') {
      filtered = filtered.filter((s) => s.category.toLowerCase().includes(category.toLowerCase()))
    }
    if (search) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(search) ||
          s.description.toLowerCase().includes(search) ||
          s.authority.toLowerCase().includes(search)
      )
    }
    return NextResponse.json({ services: filtered })
  }

  try {
    const supabase = await createClient()
    let query = supabase.from('services').select('*').eq('status', 'active')

    if (category && category !== 'all') {
      query = query.ilike('category', `%${category}%`)
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,authority.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      // Return seed fallback if DB table is empty
      return NextResponse.json({ services: SEED_SERVICES })
    }

    return NextResponse.json({ services: data })
  } catch {
    return NextResponse.json({ services: SEED_SERVICES })
  }
}
