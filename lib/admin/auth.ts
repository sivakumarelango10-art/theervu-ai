import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'
import type { User } from '@supabase/supabase-js'

export interface AdminAuthResult {
  isAdmin: boolean
  user: User | null
  error?: string
}

/**
 * Checks whether the incoming request belongs to an authenticated administrator.
 * Verifies profile role in public.profiles and/or ADMIN_EMAILS environment variable.
 */
export async function verifyAdminUser(): Promise<AdminAuthResult> {
  if (!env.supabase.isConfigured) {
    return {
      isAdmin: false,
      user: null,
      error: 'Supabase database is not configured',
    }
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        isAdmin: false,
        user: null,
        error: 'Unauthorized: User is not logged in',
      }
    }

    // 1. Check environment ADMIN_EMAILS override
    const adminEmailsEnv = process.env.ADMIN_EMAILS || ''
    const adminEmails = adminEmailsEnv
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)

    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return { isAdmin: true, user }
    }

    // 2. Check public.profiles role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return {
        isAdmin: false,
        user,
        error: 'Forbidden: User profile not found or role unassigned',
      }
    }

    if (profile.role === 'admin') {
      return { isAdmin: true, user }
    }

    return {
      isAdmin: false,
      user,
      error: 'Forbidden: Administrative privileges required',
    }
  } catch (err: unknown) {
    return {
      isAdmin: false,
      user: null,
      error: err instanceof Error ? err.message : 'Internal admin authentication error',
    }
  }
}
