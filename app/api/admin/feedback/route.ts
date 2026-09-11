import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminUser } from '@/lib/admin/auth'

export async function GET() {
  const auth = await verifyAdminUser()
  if (!auth.isAdmin) {
    return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: auth.user ? 403 : 401 })
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      feedback: data || [],
      count: data?.length || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
