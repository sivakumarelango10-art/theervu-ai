# Phase 7 Launch Audit — TheervuAI

**Audit Date**: 2026-09-11  
**Auditor**: AI Engineering Team  
**Baseline**: Phase 6 complete — 75/75 tests, TypeScript clean, production build passing  
**Phase 7 Result**: 143/143 tests, 25 suites, production build passing

---

## Authentication & Authorization

| Item | Status | Details |
|---|---|---|
| Google OAuth only | ✅ PASS | No password auth. Supabase handles OAuth tokens. |
| Session refresh in middleware | ✅ PASS | `updateSession()` runs on every request |
| Protected route enforcement | ✅ PASS | `/settings`, `/saved`, `/documents` redirect unauthenticated users |
| API routes check `auth.getUser()` | ✅ PASS | All user-specific API routes verify user before DB operations |
| Admin routes verify admin role | ✅ PASS | `verifyAdminUser()` checks `profiles.role` + `ADMIN_EMAILS` env |
| JWT leakage | ✅ PASS | Tokens are in HTTP-only cookies via `@supabase/ssr` |

---

## Supabase Row Level Security

| Table | RLS | Policies |
|---|---|---|
| `profiles` | ✅ Enabled | Users can read/update own profile only |
| `services` | ✅ Enabled | Public read; admin write |
| `conversations` | ✅ Enabled | User-isolated CRUD |
| `messages` | ✅ Enabled | Accessible only through own conversations |
| `preparation_plans` | ✅ Enabled | User-isolated CRUD |
| `preparation_items` | ✅ Enabled | Accessible through own plans |
| `documents` | ✅ Enabled | User-isolated CRUD |
| `saved_items` | ✅ Enabled | User-isolated CRUD |
| `feedback` | ✅ Enabled | Public insert; user reads own |
| `application_trackers` | ✅ Enabled | User-isolated CRUD |
| `reminders` | ✅ Enabled | User-isolated CRUD |
| `notifications` | ✅ Enabled (Phase 7) | User-isolated read/update; system insert |
| `notification_preferences` | ✅ Enabled (Phase 7) | User-isolated |

---

## Security Headers

Added in Phase 7 middleware:

| Header | Value |
|---|---|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restricts camera (none), microphone (self), geolocation (none) |
| `Strict-Transport-Security` | 2-year max-age with preload |
| `Content-Security-Policy` | Strict per-page CSP (non-API routes) |
| `X-Correlation-Id` | Random per-request correlation ID |

---

## Input Validation

| Route | Validation |
|---|---|
| `/api/ai/chat` | Zod schema: min 3 / max 1500 chars, UUID conversation ID |
| `/api/ai/prepare` | Zod schema: task, location, state, language |
| `/api/applications` | Zod schema: service name, status enum, URL format |
| `/api/feedback` | Zod schema: category, rating 1–5, max 2000 char message |
| `/api/profile` | Zod schema: name min 2 / max 100 |
| `/api/reminders` | Zod schema: title, date validation |
| `/api/admin/services` | Zod schema: strict admin service record |
| File uploads | MIME type + size validation in `lib/security/validation.ts` |

---

## AI Safety

| Check | Status |
|---|---|
| Prompt injection detection | ✅ 6 injection patterns blocked |
| Emergency routing | ✅ 12 emergency keywords → redirect to emergency handler |
| Healthcare disclaimer | ✅ Appended to medical queries |
| Zero-fabrication enforcement | ✅ Hybrid context injection with strict Gemini instructions |
| Intent classification | ✅ Phase 7: 16 intent types with routing |
| Unsupported content detection | ✅ Crypto, adult, hack, entertainment queries blocked |
| Action confirmation gates | ✅ Complaint drafts and action plans require user confirmation |

---

## Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| `/api/ai/chat` | 25 req/IP | 60 seconds |
| `/api/ai/prepare` | 10 req/IP | 60 seconds |
| `/api/documents/explain` | 10 req/IP | 60 seconds |
| `/api/notifications` | 60 req/IP | 60 seconds |

---

## PII Handling

- **Aadhaar**: Regex scrubbed from all log lines and metric metadata
- **PAN**: Regex scrubbed from all log lines
- **Phone**: Regex scrubbed from all log lines
- **Email**: Regex scrubbed from all log lines
- **Documents**: Extracted text not stored in structured columns; stored only in `extracted_text` column of `public.documents` (user-owned, RLS-protected)
- **Sensitive logger keys**: `password`, `token`, `api_key`, `authorization`, etc. are replaced with `[REDACTED]`

---

## Performance

| Item | Status |
|---|---|
| Image optimization | ✅ AVIF/WebP format negotiation enabled |
| Static asset caching | ✅ 1-year immutable cache for `_next/static` |
| Public asset caching | ✅ 24-hour cache for images/fonts |
| Response compression | ✅ `compress: true` in next.config |
| Service listing cache | ✅ `Cache-Control: public, max-age=3600` on `/api/services` |
| Private data cache | ✅ `Cache-Control: no-store` on user-specific routes |
| Bundle size | ℹ️ Next.js 16 automatic code splitting — no manual optimization needed |

---

## Known Limitations

See `docs/KNOWN_LIMITATIONS.md` for the full list.

---

## Production Deployment Checklist

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` (Supabase project URL)
- [ ] Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (anon/publishable key)
- [ ] Set `GEMINI_API_KEY` (Google AI Studio API key)
- [ ] Set `ADMIN_EMAILS` (comma-separated admin email list)
- [ ] Run all Supabase migrations (001–004)
- [ ] Enable RLS on all tables (already in migrations)
- [ ] Configure Google OAuth provider in Supabase dashboard
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Verify `X-Frame-Options: DENY` in response headers
- [ ] Verify Supabase Storage bucket `documents` is private (not public)
- [ ] Rotate any development API keys before go-live
