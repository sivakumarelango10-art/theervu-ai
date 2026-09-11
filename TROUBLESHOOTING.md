# TheervuAI Troubleshooting & Common Diagnostics

This document outlines common diagnostic patterns, error scenarios, and recovery solutions for developers and administrators of **TheervuAI**.

---

## 1. Google OAuth Issues

### Symptom: `redirect_uri_mismatch` or error during Google sign-in
- **Root Cause**: The redirect URI registered in Google Cloud Console does not match your Supabase project callback or local environment.
- **Solution**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/) > **APIs & Services** > **Credentials**.
  2. Select your OAuth 2.0 Client ID.
  3. In **Authorized redirect URIs**, add:
     - `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
  4. In your Supabase Dashboard under **Authentication > URL Configuration > Redirect URLs**, ensure:
     - `http://localhost:3000/auth/callback`
     - `https://<your-domain>.vercel.app/auth/callback`

### Symptom: User redirected back but profile is empty or not created
- **Root Cause**: The `on_auth_user_created` PostgreSQL trigger was not installed or failed during user signup.
- **Solution**:
  - Re-run Section 1 of `supabase/migrations/001_initial_schema.sql` to re-create the `public.handle_new_user()` function and trigger.

---

## 2. Gemini AI Issues

### Symptom: `RESOURCE_EXHAUSTED` or HTTP 429 from Google AI
- **Root Cause**: Google AI Studio free tier limits (typically 15 requests per minute or 1,500 requests per day) reached.
- **Behavior**: TheervuAI catches this in `normalizeGeminiError` and automatically engages `lib/ai/fallback.ts` so users receive verified procedural steps rather than an unhandled application error.
- **Solution**:
  - Wait 60 seconds for quota replenishment.
  - Or switch to a pay-as-you-go Google Cloud project linked in Google AI Studio.
  - Set `GEMINI_MODEL=gemini-2.0-flash` if smaller model quota is preferred.

### Symptom: AI responses take more than 30 seconds
- **Root Cause**: External network latency or heavy model reasoning.
- **Behavior**: `executeGeminiWithRetry` in `lib/ai/gemini.ts` terminates the hanging request at 30 seconds and falls back gracefully.

---

## 3. Supabase Database & Row-Level Security (RLS)

### Symptom: `new row violates row-level security policy for table "..."`
- **Root Cause**: An API route attempted to insert a row where `user_id` does not match `auth.uid()`, or an unauthenticated request reached a user-owned table.
- **Solution**:
  - Ensure the user is authenticated via `supabase.auth.getUser()`.
  - Ensure the inserted object has `user_id: user.id`.
  - Check `SUPABASE_SETUP.md` for proper policy definitions.

### Symptom: Database connection timeout during peak load
- **Root Cause**: Direct PostgreSQL connections exhausted.
- **Solution**:
  - Use the Supabase Transaction Pooler URL (port 6543) with `?pgbouncer=true` instead of the direct database port (5432).

---

## 4. Document Upload & Storage

### Symptom: HTTP 502: "Failed to upload document to secure storage"
- **Root Cause**: The Supabase Storage bucket `'documents'` does not exist in your Supabase project.
- **Solution**:
  1. Open Supabase Dashboard > **Storage**.
  2. Click **New Bucket**.
  3. Enter Name: `documents`.
  4. Ensure "Public bucket" is toggled **OFF**.
  5. Click **Save**.

### Symptom: HTTP 400: "Unsupported file type"
- **Root Cause**: The user attempted to upload a file other than PDF, PNG, JPG, JPEG, or WebP.
- **Solution**:
  - Ensure document is in one of the allowed standard document/image formats.

---

## 5. Rate Limiting During Development

### Symptom: HTTP 429: "Too many requests. Please wait a minute before asking another question."
- **Root Cause**: Sliding-window rate limiter triggered by rapid testing.
- **Limits**:
  - Chat: 20 req / 60 sec
  - Plan preparation: 10 req / 60 sec
  - Document upload: 10 req / 60 sec
- **Solution**:
  - Wait the number of seconds returned in the `Retry-After` header.
  - Restart the local dev server to clear the in-memory window during rapid manual debugging.

---

## 6. Diagnostic Endpoint

To quickly inspect system health without exposing any credentials:
- Open `http://localhost:3000/api/health` or `https://your-domain.vercel.app/api/health`.
- Verify the returned JSON:
  ```json
  {
    "status": "healthy",
    "timestamp": "...",
    "database": { "status": "connected" },
    "auth": { "status": "configured" },
    "ai": { "provider": "Google Gemini", "status": "live", "model": "gemini-3.8-flash" }
  }
  ```
