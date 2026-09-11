import { NextResponse } from 'next/server'
import { verifyAdminUser } from '@/lib/admin/auth'
import { getRecentMetrics } from '@/lib/observability/metrics'
import { getProviderStatus } from '@/lib/notifications/provider'
import { validateEnvironment } from '@/lib/config/env'

/**
 * Admin Metrics Endpoint
 *
 * Returns sanitized platform metrics for the admin dashboard.
 * Requires admin authentication. Never exposes PII or secrets.
 *
 * GET /api/admin/metrics
 */
export async function GET() {
  const auth = await verifyAdminUser()
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.user ? 403 : 401 }
    )
  }

  try {
    const metrics = getRecentMetrics()
    const envStatus = validateEnvironment()
    const providerStatus = getProviderStatus()

    // Aggregate summary from metrics buffer
    const summary = {
      totalEvents: metrics.length,
      successCount: metrics.filter((m) => m.status === 'success').length,
      failureCount: metrics.filter((m) => m.status === 'failure').length,
      warningCount: metrics.filter((m) => m.status === 'warning').length,
      byType: metrics.reduce<Record<string, number>>((acc, m) => {
        acc[m.name] = (acc[m.name] || 0) + 1
        return acc
      }, {}),
      avgLatencyMs: metrics.length > 0
        ? Math.round(
            metrics.reduce((sum, m) => sum + (m.durationMs || 0), 0) / metrics.length
          )
        : 0,
      recentFailures: metrics
        .filter((m) => m.status === 'failure')
        .slice(-10)
        .map((m) => ({
          id: m.id,
          name: m.name,
          endpoint: m.endpoint,
          timestamp: m.timestamp,
          durationMs: m.durationMs,
        })),
    }

    return NextResponse.json({
      metrics: {
        summary,
        recentEvents: metrics.slice(-50), // Last 50 sanitized events
      },
      infrastructure: {
        supabase: envStatus.isSupabaseConfigured,
        gemini: envStatus.isGeminiConfigured,
        sarvam: envStatus.isSarvamConfigured,
        isProduction: envStatus.isProduction,
        notificationProviders: providerStatus,
      },
      warnings: envStatus.warnings,
      generatedAt: new Date().toISOString(),
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 })
  }
}
