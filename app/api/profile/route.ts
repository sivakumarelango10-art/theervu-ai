import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { profileUpdateSchema } from '@/lib/validation/schemas'
import { env } from '@/lib/config/env'

export async function GET() {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({
      profile: {
        id: 'guest',
        full_name: 'Guest User',
        email: 'guest@theervu.ai',
        preferred_language: 'en',
      },
    })
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ profile: profile || { id: user.id, email: user.email } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, message: 'Settings saved (local mode)' })
  }

  try {
    const json = await request.json()
    const result = profileUpdateSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.format() },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { full_name, preferred_language } = result.data

    const { data: updated, error } = await supabase
      .from('profiles')
      .update({
        full_name,
        preferred_language,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, profile: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 })
  }
}
