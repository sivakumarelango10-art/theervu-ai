import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit'

// GET: List current user's notifications (unread first, then by date)
export async function GET(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
      notice: 'Notifications require database configuration.',
    })
  }

  const ip = getClientIp(request)
  const rl = checkRateLimit(`notifications_${ip}`, 60, 60)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
    const onlyUnread = url.searchParams.get('unread') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('is_read', { ascending: true }) // unread first
      .order('created_at', { ascending: false })
      .limit(limit)

    if (onlyUnread) {
      query = query.eq('is_read', false)
    }

    // Filter out expired notifications
    query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

    const { data, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const unreadCount = (data || []).filter((n) => !n.is_read).length

    return NextResponse.json({
      notifications: data || [],
      unreadCount,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const markReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
})

// PATCH: Mark notification(s) as read
export async function PATCH(request: Request) {
  if (!env.supabase.isConfigured) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = markReadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { notificationId, markAll } = parsed.data

    if (markAll) {
      // Mark all user notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 500 })
      }

      return NextResponse.json({ message: 'All notifications marked as read' })
    }

    if (notificationId) {
      // Mark single notification as read — user_id check enforces ownership
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id) // RLS + explicit ownership check
        .select()
        .single()

      if (error || !data) {
        return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 })
      }

      return NextResponse.json({ notification: data })
    }

    return NextResponse.json({ error: 'Provide notificationId or markAll: true' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
