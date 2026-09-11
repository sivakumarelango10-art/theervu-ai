import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

export async function GET() {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ plans: [] })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: plans, error } = await supabase
      .from('preparation_plans')
      .select(`
        id,
        title,
        purpose,
        location,
        summary,
        status,
        created_at,
        preparation_items (
          id,
          title,
          description,
          is_required,
          is_completed,
          priority,
          source_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Preparation plans fetch error:', error.message)
      return NextResponse.json({ error: 'Failed to retrieve preparation plans' }, { status: 500 })
    }

    return NextResponse.json({ plans: plans || [] })
  } catch (err: any) {
    console.error('Preparation plans GET exception:', err?.message || err)
    return NextResponse.json({ error: 'Failed to retrieve preparation plans' }, { status: 500 })
  }
}
