import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!env.supabase.isConfigured) {
    return NextResponse.json({ success: true, mode: 'local' })
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
      .from('saved_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Saved item delete error:', error.message)
      return NextResponse.json({ error: 'Failed to delete saved item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Saved item DELETE exception:', err?.message || err)
    return NextResponse.json({ error: 'Failed to delete saved item' }, { status: 500 })
  }
}
