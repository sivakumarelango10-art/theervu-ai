import { NextResponse } from 'next/server'
import { verifyAdminUser } from '@/lib/admin/auth'
import { getRecentMetrics } from '@/lib/observability/metrics'
import { scrubPII } from '@/lib/observability/metrics'

/**
 * Admin Audit Log Endpoint
 *
 * Returns recent sanitized platform audit events for admin review.
 * All entries are PII-scrubbed before returning.
 *
 * GET /api/admin/audit-log?limit=50
 */
export async function GET(request: Request) {
  const auth = await verifyAdminUser()
  if (!auth.isAdmin) {
    return NextResponse.json(
      { error: auth.error || 'Unauthorized' },
      { status: auth.user ? 403 : 401 }
    )
  }

  try {
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
    const statusFilter = url.searchParams.get('status') as 'success' | 'failure' | 'warning' | null

    let events = getRecentMetrics()

    if (statusFilter) {
      events = events.filter((e) => e.status === statusFilter)
    }

    // Return most recent events first
    const sliced = events
      .slice(-limit)
      .reverse()
      .map((e) => ({
        id: e.id,
        name: e.name,
        status: e.status,
        endpoint: e.endpoint ? scrubPII(e.endpoint) : undefined,
        durationMs: e.durationMs,
        timestamp: e.timestamp,
        // Metadata is already PII-scrubbed by recordMetric()
        metadata: e.metadata,
      }))

    return NextResponse.json({
      events: sliced,
      total: sliced.length,
      filter: statusFilter || 'all',
      generatedAt: new Date().toISOString(),
      disclaimer: 'All entries are PII-scrubbed. No personal data is stored in audit logs.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to retrieve audit log' }, { status: 500 })
  }
}
