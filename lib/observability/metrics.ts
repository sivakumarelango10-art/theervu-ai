/**
 * Privacy-First Observability & Telemetry Logger
 * 
 * Records application metrics and operational performance while strictly
 * stripping PII (Aadhaar, PAN, phone numbers, personal identifiers).
 */

export interface MetricEvent {
  id: string
  name:
    | 'service_search'
    | 'service_view'
    | 'plan_generate'
    | 'document_analysis'
    | 'application_track'
    | 'reminder_set'
    | 'gemini_call'
    | 'fallback_invoked'
    | 'api_error'
    // Phase 7 additions
    | 'auth_failure'
    | 'rate_limit_hit'
    | 'upload_failure'
    | 'intent_classified'
    | 'action_requested'
    | 'notification_sent'
    | 'source_verified'
    | 'admin_action'
  status: 'success' | 'failure' | 'warning'
  durationMs?: number
  endpoint?: string
  correlationId?: string
  metadata?: Record<string, string | number | boolean | null>
  timestamp: string
}

// In-memory bounded ring buffer for recent metrics (keeps last 200 events)
const METRIC_BUFFER_MAX = 200
const metricBuffer: MetricEvent[] = []

/**
 * Scrubs any sensitive PII (Aadhaar, PAN, phone numbers, emails) from strings or objects.
 */
export function scrubPII(text: string): string {
  if (!text || typeof text !== 'string') return text

  return (
    text
      // Aadhaar: 12 digits (with or without spaces/hyphens)
      .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_AADHAAR]')
      // PAN: 5 uppercase letters + 4 digits + 1 uppercase letter
      .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, '[REDACTED_PAN]')
      // Indian mobile numbers (10 digits starting with 6,7,8,9, optional +91)
      .replace(/(\+91[\s-]?)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
      // Email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
  )
}

/**
 * Records a sanitized operational metric.
 */
export function recordMetric(event: Omit<MetricEvent, 'id' | 'timestamp'>): MetricEvent {
  const sanitizedMetadata: Record<string, string | number | boolean | null> = {}

  if (event.metadata) {
    for (const [key, value] of Object.entries(event.metadata)) {
      if (typeof value === 'string') {
        sanitizedMetadata[key] = scrubPII(value)
      } else {
        sanitizedMetadata[key] = value
      }
    }
  }

  const metric: MetricEvent = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: event.name,
    status: event.status,
    durationMs: event.durationMs,
    endpoint: event.endpoint,
    metadata: sanitizedMetadata,
    timestamp: new Date().toISOString(),
  }

  metricBuffer.push(metric)
  if (metricBuffer.length > METRIC_BUFFER_MAX) {
    metricBuffer.shift()
  }

  // Structured operational log in development or on failures
  if (process.env.NODE_ENV !== 'production' || event.status === 'failure') {
    const prefix = event.status === 'failure' ? '🔴 [METRIC:ERR]' : '📊 [METRIC]'
    // Silent console output formatted cleanly
    if (event.status === 'failure') {
      console.warn(`${prefix} ${metric.name} on ${metric.endpoint || 'app'} (${metric.durationMs || 0}ms)`, sanitizedMetadata)
    }
  }

  return metric
}

/**
 * Returns recent sanitized operational metrics.
 */
export function getRecentMetrics(): MetricEvent[] {
  return [...metricBuffer]
}

/**
 * Clears metrics buffer (useful for test isolation).
 */
export function clearMetricsBuffer(): void {
  metricBuffer.length = 0
}
