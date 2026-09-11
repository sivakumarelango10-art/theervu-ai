import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SEED_SERVICES, searchServices, getServiceBySlug } from '@/lib/data/services'
import { env } from '@/lib/config/env'

/** Public, stable data: 1-hour CDN cache, 10-min stale-while-revalidate */
const PUBLIC_CACHE = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const category = searchParams.get('category') || undefined
  const search = searchParams.get('q') || searchParams.get('search') || undefined
  const state = searchParams.get('state') || undefined
  const district = searchParams.get('district') || undefined

  // Single service lookup by slug
  if (slug) {
    const matched = getServiceBySlug(slug)
    if (matched) {
      return NextResponse.json(
        { service: matched },
        { headers: { 'Cache-Control': PUBLIC_CACHE } }
      )
    }
  }

  // If Supabase is not configured, use the verified deterministic catalog
  if (!env.supabase.isConfigured) {
    const services = searchServices(search || '', category, state, district)
    return NextResponse.json(
      {
        services,
        total: services.length,
        source: 'verified_catalog',
      },
      { headers: { 'Cache-Control': PUBLIC_CACHE } }
    )
  }

  try {
    const supabase = await createClient()
    let query = supabase.from('services').select('*').eq('status', 'active')

    if (category && category.toLowerCase() !== 'all') {
      query = query.ilike('category', `%${category}%`)
    }

    if (state && state !== 'All India') {
      query = query.or(`state.eq.All India,state.ilike.%${state}%`)
    }

    if (district) {
      query = query.or(`district.is.null,district.ilike.%${district}%`)
    }

    if (search && search.trim().length > 0) {
      const q = search.trim()
      query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,department.ilike.%${q}%,authority.ilike.%${q}%`)
    }

    const { data, error } = await query

    if (error || !data || data.length === 0) {
      // Graceful fallback to verified catalog
      const fallbackServices = searchServices(search || '', category, state, district)
      return NextResponse.json(
        {
          services: fallbackServices,
          total: fallbackServices.length,
          source: 'verified_catalog',
        },
        { headers: { 'Cache-Control': PUBLIC_CACHE } }
      )
    }

    return NextResponse.json(
      {
        services: data,
        total: data.length,
        source: 'database',
      },
      { headers: { 'Cache-Control': PUBLIC_CACHE } }
    )
  } catch {
    const fallbackServices = searchServices(search || '', category, state, district)
    return NextResponse.json(
      {
        services: fallbackServices,
        total: fallbackServices.length,
        source: 'verified_catalog',
      },
      { headers: { 'Cache-Control': PUBLIC_CACHE } }
    )
  }
}
