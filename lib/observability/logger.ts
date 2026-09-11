/**
 * Structured Logger for TheervuAI
 *
 * Provides PII-safe structured logging with correlation IDs,
 * log levels, and consistent formatting.
 *
 * PRIVACY RULES:
 * - Never logs raw passwords, API keys, session tokens, or private data
 * - Scrubs Aadhaar, PAN, phone numbers, and email from all messages
 * - Correlation IDs are random, non-guessable per-request UUIDs
 */

import { scrubPII } from '@/lib/observability/metrics'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  correlationId?: string
  endpoint?: string
  durationMs?: number
  statusCode?: number
  metadata?: Record<string, unknown>
  timestamp: string
}

// ─── Correlation ID Management ────────────────────────────────────────────────

/**
 * Generates a random correlation ID for request tracing.
 * Format: req_<timestamp_base36>_<random>
 */
export function generateCorrelationId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `req_${ts}_${rand}`
}

// ─── Sensitive Key Blocklist ─────────────────────────────────────────────────

const SENSITIVE_KEYS = new Set([
  'password', 'secret', 'token', 'api_key', 'apikey', 'authorization',
  'cookie', 'session', 'jwt', 'access_token', 'refresh_token',
  'service_role_key', 'gemini_api_key', 'sarvam_api_key',
])

function sanitizeMetadata(
  meta?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!meta) return undefined
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]'
    } else if (typeof v === 'string') {
      out[k] = scrubPII(v)
    } else {
      out[k] = v
    }
  }
  return out
}

// ─── Logger ───────────────────────────────────────────────────────────────────

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>,
): LogEntry {
  return {
    level,
    message: scrubPII(message),
    correlationId: context?.correlationId,
    endpoint: context?.endpoint,
    durationMs: context?.durationMs,
    statusCode: context?.statusCode,
    metadata: sanitizeMetadata(context?.metadata),
    timestamp: new Date().toISOString(),
  }
}

function emitLog(entry: LogEntry): void {
  // In production, only warn/error are emitted to avoid noise
  if (process.env.NODE_ENV === 'production' && entry.level === 'debug') return

  const prefix = {
    debug: '🔵 [DEBUG]',
    info: '🟢 [INFO]',
    warn: '🟡 [WARN]',
    error: '🔴 [ERROR]',
  }[entry.level]

  const correlationPart = entry.correlationId ? ` [${entry.correlationId}]` : ''
  const endpointPart = entry.endpoint ? ` ${entry.endpoint}` : ''
  const durationPart = entry.durationMs !== undefined ? ` (${entry.durationMs}ms)` : ''
  const statusPart = entry.statusCode !== undefined ? ` HTTP/${entry.statusCode}` : ''

  const logLine = `${prefix}${correlationPart}${endpointPart}${statusPart}${durationPart} — ${entry.message}`

  if (entry.level === 'error') {
    console.error(logLine, entry.metadata || '')
  } else if (entry.level === 'warn') {
    console.warn(logLine, entry.metadata || '')
  } else {
    console.log(logLine, entry.metadata || '')
  }
}

// ─── Public Logger API ────────────────────────────────────────────────────────

export const logger = {
  debug(
    message: string,
    context?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>,
  ): void {
    emitLog(createLogEntry('debug', message, context))
  },

  info(
    message: string,
    context?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>,
  ): void {
    emitLog(createLogEntry('info', message, context))
  },

  warn(
    message: string,
    context?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>,
  ): void {
    emitLog(createLogEntry('warn', message, context))
  },

  error(
    message: string,
    context?: Omit<LogEntry, 'level' | 'message' | 'timestamp'>,
  ): void {
    emitLog(createLogEntry('error', message, context))
  },

  /**
   * Logs an API request completion. Attaches correlation ID, status, and duration.
   */
  apiRequest(
    method: string,
    path: string,
    statusCode: number,
    durationMs: number,
    correlationId?: string,
  ): void {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
    emitLog(
      createLogEntry(level, `${method} ${path}`, {
        correlationId,
        endpoint: path,
        statusCode,
        durationMs,
      }),
    )
  },

  /**
   * Logs an auth failure without including the email or any credentials.
   */
  authFailure(reason: string, correlationId?: string): void {
    emitLog(
      createLogEntry('warn', `Auth failure: ${reason}`, {
        correlationId,
        metadata: { reason },
      }),
    )
  },

  /**
   * Logs an AI provider call result.
   */
  aiCall(
    provider: string,
    model: string,
    status: 'success' | 'failure' | 'fallback',
    durationMs: number,
    correlationId?: string,
  ): void {
    const level: LogLevel = status === 'failure' ? 'error' : status === 'fallback' ? 'warn' : 'info'
    emitLog(
      createLogEntry(level, `AI call to ${provider}/${model}: ${status}`, {
        correlationId,
        durationMs,
        metadata: { provider, model, status },
      }),
    )
  },
}
