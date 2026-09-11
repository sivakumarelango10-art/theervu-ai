import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { env } from '@/lib/config/env'

export function createAdminClient() {
  if (!env.supabase.serviceRoleKey || !env.supabase.url) {
    throw new Error('Supabase Service Role Key is required for admin operations.')
  }

  return createSupabaseClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
