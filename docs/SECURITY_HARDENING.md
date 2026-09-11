# Security Hardening — TheervuAI

## Overview

Security hardening applied across all phases, with Phase 7 additions documented here.

## HTTP Security Headers (Phase 7)

Set in `middleware.ts` on every response:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(self), geolocation=(), payment=(), usb=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: [strict per-page policy]
X-Correlation-Id: req_<random>
```

## XSS Prevention

- All user inputs sanitized via `sanitizeText()` before storage
- HTML entities escaped: `&`, `<`, `>`, `"`, `'`
- CSP blocks inline scripts where possible
- React's built-in HTML escaping on all rendered content

## SSRF Prevention

- `validateAndSanitizeUrl()` blocks dangerous schemes (`javascript:`, `data:`, `file:`)
- URLs with embedded credentials (`user:pass@`) rejected
- External domain allowlist for clickable links to official portals

## SQL Injection

- All DB operations use Supabase parameterized queries (no raw SQL from user input)
- Zod schemas validate and coerce all input types before DB operations

## File Upload Security

- MIME type validation: only PDF, JPEG, PNG, WebP, plain text allowed
- Max size: 10MB for documents, 5MB for images
- Path traversal prevention: filenames checked for `..`, `\`, `/`, null bytes
- Files stored in private Supabase Storage bucket (not public)

## Prompt Injection

- 6 injection patterns blocked before Gemini API call
- Sanitized input length capped at 1500 characters
- System prompt separated from user content in Gemini API calls

## Rate Limiting

- In-memory sliding window per IP address
- AI endpoints: 10–25 requests/minute
- Non-AI endpoints: 60 requests/minute
- Returns `429` with `Retry-After` header

## Admin Security

- All `/api/admin/*` endpoints call `verifyAdminUser()` server-side
- Double-verification: environment `ADMIN_EMAILS` + `profiles.role = 'admin'`
- No client-side admin gating — server always re-checks
- Admin actions logged to observability metrics buffer (PII-scrubbed)

## Sensitive Data

- API keys: Server-only environment variables, never in client bundle
- Passwords: Not applicable (Google OAuth only)
- Session tokens: HTTP-only cookies via `@supabase/ssr`
- User documents: RLS-protected Supabase Storage; no public access
- Logs: PII scrubbed (Aadhaar, PAN, phone, email)
- Metrics: Sensitive metadata keys replaced with `[REDACTED]`

## Vulnerabilities Addressed

| Type | Mitigation |
|---|---|
| XSS | CSP + HTML entity escaping + React escaping |
| SSRF | URL scheme/credential validation |
| SQL Injection | Parameterized queries via Supabase SDK |
| Path Traversal | Filename validation in upload handling |
| Open Redirect | External domain allowlist |
| Insecure Upload | MIME + size validation |
| IDOR | All routes enforce `user_id = auth.uid()` |
| Broken Auth | `auth.getUser()` on every protected route |
| Admin Bypass | Server-side role verification on all admin endpoints |
| Prompt Injection | Pattern matching + input length caps |
| Info Leakage | Internal errors never exposed in client responses |
