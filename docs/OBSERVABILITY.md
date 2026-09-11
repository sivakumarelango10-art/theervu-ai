# Observability — TheervuAI

## Overview

TheervuAI uses a lightweight, privacy-first observability system with no external telemetry dependencies.

## Components

### 1. Structured Logger (`lib/observability/logger.ts`)

```typescript
logger.info('Message', { endpoint, statusCode, durationMs, correlationId })
logger.warn('Message', { ... })
logger.error('Message', { ... })
logger.apiRequest('POST', '/api/ai/chat', 200, 1234, correlationId)
logger.authFailure('Session expired')
logger.aiCall('gemini', 'gemini-2.0-flash', 'success', 1200)
```

Features:
- **Correlation IDs**: Every request gets `req_<timestamp>_<random>` for tracing
- **PII scrubbing**: Aadhaar, PAN, phone, email removed from all messages
- **Sensitive key blocklist**: `password`, `token`, `api_key`, etc. replaced with `[REDACTED]`
- **Log level**: `debug` (dev only), `info`, `warn`, `error`
- **No external service**: All logs to stdout (collected by Vercel/hosting platform)

### 2. Metrics Buffer (`lib/observability/metrics.ts`)

In-memory ring buffer of last 200 events. Never persisted to disk.

**Event types**: `service_search`, `plan_generate`, `gemini_call`, `fallback_invoked`, `api_error`, `auth_failure`, `rate_limit_hit`, `upload_failure`, `intent_classified`, `action_requested`, `notification_sent`, `source_verified`, `admin_action`

### 3. Admin Metrics Endpoint (`/api/admin/metrics`)

Returns:
- Summary (total, success, failure, warning counts)
- By-event-type breakdown
- Average latency
- Last 10 failures
- Infrastructure status (Supabase, Gemini, Sarvam configured)
- Notification provider availability

### 4. Admin Audit Log (`/api/admin/audit-log`)

Returns recent PII-scrubbed operational events. Filterable by status.

## Correlation IDs

Every middleware-processed request receives `X-Correlation-Id` response header.
The correlation ID flows through:
- Middleware → Response header
- API route logging
- Metrics events
- AI provider calls

## What Is NOT Logged

- Raw user questions or documents
- AI response content
- Application reference numbers
- User email or profile data
- Authentication tokens or API keys
- Aadhaar, PAN, or financial information

## Production Monitoring

For production, logs are collected by:
- **Vercel**: All stdout/stderr captured in Function Logs
- **Supabase**: Database query logs in Supabase Dashboard
- Custom integration: Forward to Datadog, Sentry, or CloudWatch by piping stdout

## Alerting (Manual for Now)

Check `/api/admin/metrics` for:
- High `failureCount` (> 5% of total)
- High average latency (> 10,000ms)
- Repeated `auth_failure` events (potential brute-force)
- `rate_limit_hit` spikes (potential abuse)
