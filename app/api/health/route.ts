import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { env } from '@/lib/config/env'

export async function GET() {
  const health: {
    status: 'healthy' | 'degraded' | 'unconfigured'
    timestamp: string
    ai: {
      provider: string
      status: 'configured' | 'fallback_mode'
      model?: string
    }
    database: {
      status: 'reachable' | 'unavailable' | 'not_configured'
      servicesCount?: number
    }
    auth: {
      provider: string
      status: 'configured' | 'pending_credentials'
    }
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ai: {
      provider: 'Google Gemini',
      status: env.ai.isGeminiConfigured ? 'configured' : 'fallback_mode',
      model: env.ai.geminiModel,
    },
    database: {
      status: 'not_configured',
    },
    auth: {
      provider: 'Google OAuth (Supabase)',
      status: env.supabase.isConfigured ? 'configured' : 'pending_credentials',
    },
  }

  // Probe database connectivity if configured
  if (env.supabase.isConfigured) {
    try {
      const supabase = await createClient()
      const { count, error } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true })

      if (error) {
        health.database.status = 'unavailable'
        health.status = 'degraded'
      } else {
        health.database.status = 'reachable'
        health.database.servicesCount = count || 0
      }
    } catch {
      health.database.status = 'unavailable'
      health.status = 'degraded'
    }
  } else {
    health.status = 'degraded'
  }

  return NextResponse.json(health, {
    status: health.status === 'healthy' ? 200 : 200, // Return 200 for health reporting without throwing errors
  })
}
