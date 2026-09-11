# TheervuAI Security Hardening & Defense-in-Depth Specification

This document details the security posture, authentication protocols, authorization policies, and privacy defenses enforced across **TheervuAI**.

---

## 1. Threat Model & Guiding Principles

TheervuAI processes civic guidance, official notices, and user preparation plans. The primary threats mitigated by design are:
1. **Insecure Direct Object References (IDOR)**: Preventing malicious users from accessing or modifying another user's checklists, documents, or reminders.
2. **Secret Credential Exfiltration**: Ensuring server-side API keys (`GEMINI_API_KEY`, `SARVAM_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) can never be extracted by inspecting client JavaScript bundles or HTTP responses.
3. **Abuse & Denial of Service (DoS)**: Preventing automated bot flooding on AI and OCR endpoints via sliding-window rate limiters.
4. **Prompt Injection & Overrides**: Delimiting user inputs and isolating system instructions to prevent prompt hacking.
5. **Private Data Corruption**: Preserving sensitive civic numbers (Aadhaar, PAN, phone numbers) verbatim during regional language translation.

---

## 2. Server-Side Key Isolation

- All private keys are loaded strictly in server-side modules (`lib/config/env.ts`, `lib/ai/providers.ts`, `lib/ai/sarvam.ts`, `lib/supabase/admin.ts`).
- None of these variables are prefixed with `NEXT_PUBLIC_`.
- Next.js build compilation verifies that these variables are never bundled into client-side chunks.
- Automated tests in `tests/unit/security-hardening.test.ts` continuously verify that no private key names are present in public environment schemas.

---

## 3. Row-Level Security (RLS) Matrix (11 Tables)

Every database table in PostgreSQL has Row-Level Security explicitly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`):

| Table Name | RLS Status | Public Access | User Ownership Check |
| :--- | :--- | :--- | :--- |
| `profiles` | **ENABLED** | None | `auth.uid() = id` |
| `services` | **ENABLED** | Read-Only (`using (true)`) | None (Admin managed) |
| `source_references` | **ENABLED** | Read-Only (`using (true)`) | None (Admin managed) |
| `conversations` | **ENABLED** | None | `auth.uid() = user_id` |
| `messages` | **ENABLED** | None | Belongs to conversation where `user_id = auth.uid()` |
| `preparation_plans` | **ENABLED** | None | `auth.uid() = user_id` |
| `preparation_items` | **ENABLED** | None | Belongs to plan where `user_id = auth.uid()` |
| `documents` | **ENABLED** | None | `auth.uid() = user_id` |
| `saved_items` | **ENABLED** | None | `auth.uid() = user_id` |
| `feedback` | **ENABLED** | Insert Allowed | User can only read their own (`auth.uid() = user_id`) |
| `reminders` | **ENABLED** | None | `auth.uid() = user_id` |

### IDOR Dual-Verification Layer
In addition to database RLS, all Next.js API routes (`/api/documents/[id]`, `/api/reminders/[id]`, `/api/preparation-plans/[id]`, `/api/saved-items/[id]`) execute explicit application-level checks:
```ts
const { data: user } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const { data, error } = await supabase
  .from('resource')
  .select('*')
  .eq('id', resourceId)
  .eq('user_id', user.id) // Enforces ownership
  .single()
```
Attempting to query a resource belonging to another user returns `404 Not Found`, giving zero indication of whether the foreign ID exists.

---

## 4. Rate Limiting & Sliding-Window Quotas

Implemented in `lib/security/rate-limit.ts` tracking client IP (`x-forwarded-for` / `x-real-ip`):

| Route | Quota | Sliding Window | Breach Action |
| :--- | :--- | :--- | :--- |
| `/api/ai/chat` | 20 requests | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/ai/prepare` | 10 requests | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/ai/explain-document` | 10 requests | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/ai/document-analyze` | 10 requests | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/translate` | 20 requests | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/voice/transcribe` | 15 requests | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/voice/synthesize` | 15 requests | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/documents/upload` | 10 uploads | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |
| `/api/feedback` | 10 submissions | 60 seconds | `429 Too Many Requests` (`Retry-After` header) |

---

## 5. Privacy Safeguards: Documents & Voice

1. **Ephemeral Processing**: Uploaded documents are read into server memory for OCR and analysis, and immediately cleared. Permanent storage only occurs when the user explicitly triggers "Save Plan".
2. **Zero Audio Persistence**: Speech recognition and synthesis run on-device via the standard browser Web Speech API. Voice streams are never captured, saved, or uploaded to remote databases.
3. **Sensitive Token Isolation**: The translation engine in `lib/i18n/translation.ts` substitutes 12-digit Aadhaar patterns, PAN IDs, phone numbers, and URLs with token placeholders prior to localization, restoring them verbatim afterwards.
