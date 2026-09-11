# TheervuAI Security & Authorization Audit

This document details the comprehensive security posture, defense-in-depth architecture, and authorization verification implemented in **TheervuAI** during Phase 3.

---

## 1. Executive Security Overview

TheervuAI adheres to strict security standards for civic and healthcare assistance:
- **Zero Secret Exposure**: Secret API keys (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SARVAM_API_KEY`) are exclusively accessed in server-side modules (`lib/config/env.ts`, `lib/ai/`, `lib/supabase/admin.ts`). They are never bundled into client components, exposed in client JavaScript bundles, or returned in API responses.
- **Strict User Data Isolation**: PostgreSQL Row-Level Security (RLS) is enabled and enforced on all user-owned tables. Users cannot view, update, or delete records belonging to other users (IDOR prevention).
- **Abuse Prevention & Rate Limiting**: All public AI generation routes (`/api/ai/chat`, `/api/ai/prepare`, `/api/ai/explain-document`) and document upload routes (`/api/documents/upload`) are shielded by sliding-window rate limiters.
- **Input Sanitization & Injection Defense**: User queries, OCR text, and uploaded documents are screened against prompt-injection patterns and delimited strictly as user content, preventing overrides of system instructions.
- **Healthcare & Emergency Safety Guardrails**: Hardcoded safety filters detect emergencies (chest pain, breathing difficulty, severe bleeding, trauma) and instantly route users to national emergency numbers (`112` / `108`) with prominent disclaimers, without waiting for external API calls.

---

## 2. Authentication & Session Security

### 2.1 Google OAuth Single Sign-On
- **Configuration**: Exclusively uses Google OAuth 2.0 via Supabase Auth (`supabase.auth.signInWithOAuth`).
- **OAuth Callback**: Handled server-side in [`app/auth/callback/route.ts`](file:///e:/theervu-ai/app/auth/callback/route.ts) with authorization code exchange (`exchangeCodeForSession`).
- **Session Refresh**: [`middleware.ts`](file:///e:/theervu-ai/middleware.ts) refreshes auth tokens on every request using `@supabase/ssr` cookies.
- **Email/Password Auth**: Intentionally disabled from user-facing screens to eliminate credential stuffing, brute-force attacks, and password storage vulnerabilities.

### 2.2 Token Storage & Cookie Policy
- Session tokens are stored in secure, `httpOnly`, `SameSite=Lax` cookies managed by `@supabase/ssr`.
- Browser JavaScript cannot directly inspect or exfiltrate session tokens.

---

## 3. Database Security & Row-Level Security (RLS)

All 11 database tables have RLS enabled (`alter table ... enable row level security;`):

| Table Name | RLS Status | Policies Enforced | Ownership Rule |
|---|---|---|---|
| `profiles` | **ENABLED** | SELECT, UPDATE | `auth.uid() = id` |
| `services` | **ENABLED** | SELECT | Public read (`true`) |
| `source_references` | **ENABLED** | SELECT | Public read (`true`) |
| `conversations` | **ENABLED** | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id` |
| `messages` | **ENABLED** | SELECT, INSERT, DELETE | Exists in conversation where `user_id = auth.uid()` |
| `preparation_plans` | **ENABLED** | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id` |
| `preparation_items` | **ENABLED** | SELECT, INSERT, UPDATE, DELETE | Exists in plan where `user_id = auth.uid()` |
| `documents` | **ENABLED** | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id` |
| `saved_items` | **ENABLED** | SELECT, INSERT, DELETE | `auth.uid() = user_id` |
| `feedback` | **ENABLED** | INSERT, SELECT | Anyone can submit; users view own (`auth.uid() = user_id`) |
| `reminders` | **ENABLED** | SELECT, INSERT, UPDATE, DELETE | `auth.uid() = user_id` |

### 3.1 IDOR Prevention Verification
- Every single-record API endpoint (`/api/conversations/[id]`, `/api/preparation-plans/[id]`, `/api/documents/[id]`, `/api/saved-items/[id]`, `/api/reminders/[id]`) checks `auth.uid() = user_id` at both the application route level and database RLS policy level.
- Attempting to access another user's UUID returns `404 Not Found` or `401 Unauthorized`, never revealing the existence or metadata of other users' records.

---

## 4. Storage & Document Upload Security

### 4.1 Private Storage Bucket
- Documents are uploaded to a private Supabase Storage bucket named `'documents'`.
- Permanent public URLs are **never generated**. Access is restricted to authenticated users or signed short-lived URLs.

### 4.2 User Path Isolation
- Storage object keys are isolated by user ID: `users/{user_id}/{timestamp}_{random_hash}.{ext}`.
- Path traversal characters (`..`, `/`, `\`) are stripped or rejected.

### 4.3 Upload Constraints
- **Allowed MIME Types**: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`, `image/webp`.
- **Allowed File Extensions**: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`.
- **Maximum File Size**: 10MB (`10 * 1024 * 1024` bytes).
- **Executable & Script Blocking**: Disallowed files (`.exe`, `.sh`, `.bat`, `.js`, `.html`, `.svg`) are rejected with `400 Bad Request`.

---

## 5. Rate Limiting & Abuse Prevention

Implemented in [`lib/security/rate-limit.ts`](file:///e:/theervu-ai/lib/security/rate-limit.ts) using a sliding-window memory algorithm tracking client IP and user tokens:

| Route / Action | Rate Limit Window | Max Requests | Response on Breach |
|---|---|---|---|
| `/api/ai/chat` | 60 seconds | 20 requests | HTTP 429 (`Retry-After` header) |
| `/api/ai/prepare` | 60 seconds | 10 requests | HTTP 429 (`Retry-After` header) |
| `/api/ai/explain-document` | 60 seconds | 10 requests | HTTP 429 (`Retry-After` header) |
| `/api/ai/document-analyze` | 60 seconds | 10 requests | HTTP 429 (`Retry-After` header) |
| `/api/translate` | 60 seconds | 20 requests | HTTP 429 (`Retry-After` header) |
| `/api/voice/transcribe` | 60 seconds | 15 requests | HTTP 429 (`Retry-After` header) |
| `/api/voice/synthesize` | 60 seconds | 15 requests | HTTP 429 (`Retry-After` header) |
| `/api/documents/upload` | 60 seconds | 10 uploads | HTTP 429 (`Retry-After` header) |
| `/api/feedback` | 60 seconds | 10 submissions | HTTP 429 (`Retry-After` header) |

---

## 6. AI Prompt Safety & Content Filtering

- **System Instruction Isolation**: Gemini is configured with explicit `systemInstruction` parameters in `@google/genai`. User prompts cannot override system rules.
- **Safety Screening (`lib/ai/safety.ts`)**:
  - Medical diagnoses: Intercepted with advisory to consult certified medical professionals.
  - Emergency situations: Immediate routing to 112 / 108 emergency dispatchers.
  - Illegal requests: Intercepted and rejected.
- **Uncertainty Guardrails**:
  - When fees, office hours, or local municipal rules are not definitively known, the AI is instructed to return `"Not specified"` or `"Please verify with the official office"` rather than hallucinating facts.
  - Official government domains (`.gov.in`, `.nic.in`) are categorized with highest confidence; private third-party links are tagged as needing verification.

---

## 7. Error Sanitization & Observability

- **No Secret Leakage**: `console.error` logs error codes and sanitized messages. Provider API keys, JWTs, and full database connection strings are never logged.
- **Client Error Responses**:
  - Generic 500 errors ("An unexpected error occurred") without PostgreSQL stack traces, table definitions, or internal file paths.
  - Rate limit errors return clean HTTP 429 with seconds to reset.

---

## 8. Voice & Audio Privacy Safeguards (Phase 4)

- **Zero Audio Storage**: Audio recordings or voice streams are never permanently stored on disk, in databases, or in object buckets.
- **Ephemeral Processing**: Dictated audio is processed exclusively in-memory for speech recognition and immediately discarded.
- **No Background Listening**: Microphone recording is strictly user-triggered (explicit push-to-record). The recording state is prominently visualized with a pulsating badge and instant cancel button.
- **Client-Side Speech Priority**: When supported by the user's browser, speech recognition and synthesis run 100% locally via the Web Speech API (`window.SpeechRecognition`, `window.speechSynthesis`), transmitting zero audio bytes across external networks.
- **Zero Audio Autoplay**: Audio synthesis requires explicit user click on the Read Aloud button.

---

## 9. Regional Language & Sensitive Identifier Protection (Phase 4)

- **Preservation of Official Identifiers**: Translation algorithms in `lib/i18n/translation.ts` detect and isolate sensitive civic identifiers (Aadhaar 12-digit patterns, PAN alphanumeric IDs, phone numbers, application reference tokens, and URLs) before translation, guaranteeing they are preserved verbatim and cannot be altered or corrupted during localization.
- **Server-Side Translation Credentials**: Third-party Indic translation keys (`SARVAM_API_KEY`) are managed exclusively in server-side route handlers and are never exposed in client JavaScript bundles.

