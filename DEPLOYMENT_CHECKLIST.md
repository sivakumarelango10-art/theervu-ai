# TheervuAI Production Deployment Checklist

Follow this pre-flight and post-deployment checklist to deploy **TheervuAI** to production on **Vercel** with **Supabase** and **Google Gemini**.

---

## 1. Pre-Deployment Quality Checks (Local)

Run these checks in your local environment prior to tagging or pushing code:

- [ ] **1. Run Full Test Suite**:
  ```bash
  pnpm test
  ```
  *Requirement: 60/60 tests passing across all 15 suites.*

- [ ] **2. Type-Check**:
  ```bash
  pnpm exec tsc --noEmit
  ```
  *Requirement: 0 errors.*

- [ ] **3. Production Build Validation**:
  ```bash
  pnpm build
  ```
  *Requirement: Next.js Turbopack build succeeds without compilation errors.*

- [ ] **4. Git Working Tree**:
  ```bash
  git status
  ```
  *Requirement: Working tree clean; no uncommitted `.env` files or temporary assets.*

---

## 2. Supabase Backend Setup

- [ ] **1. Execute Migrations**:
  In the Supabase SQL Editor, execute the migration scripts in sequential order:
  1. [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) (Initial 10 tables, triggers, indexes, and RLS).
  2. [`supabase/migrations/002_reminders.sql`](supabase/migrations/002_reminders.sql) (User-controlled reminders table, indexes, and RLS).
  3. [`supabase/seed.sql`](supabase/seed.sql) (Initial verified civic services and government source references).

- [ ] **2. Verify Storage Bucket**:
  - In Supabase Dashboard > Storage:
  - Create a private bucket named `documents` (Ensure Public Bucket is **OFF**).

- [ ] **3. Configure Google OAuth 2.0**:
  - In Google Cloud Console (APIs & Services > Credentials):
    - Authorized JavaScript origins: `https://your-domain.vercel.app` and `https://<your-project-ref>.supabase.co`
    - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
  - In Supabase Dashboard (Authentication > Providers > Google):
    - Enable Google provider.
    - Paste Google Client ID & Client Secret.

- [ ] **4. Supabase URL Configuration**:
  - In Supabase Dashboard (Authentication > URL Configuration):
    - Site URL: `https://your-domain.vercel.app`
    - Redirect URLs: `https://your-domain.vercel.app/**` and `https://your-domain.vercel.app/auth/callback`

---

## 3. Vercel Environment Variables

In your Vercel Project Settings > Environment Variables, configure:

| Variable Name | Environment | Value Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Secret service role key |
| `GEMINI_API_KEY` | Production, Preview | Google AI Studio API key |
| `GEMINI_MODEL` | Production, Preview | `gemini-3.8-flash` or `gemini-2.5-flash` |
| `SARVAM_API_KEY` | Production, Preview (Optional) | Sarvam Indic API key |
| `NEXT_PUBLIC_APP_URL` | Production | `https://your-production-domain.com` |
| `NODE_ENV` | Production | `production` |

---

## 4. Post-Deployment Smoke Test (Live Verification)

Immediately after deployment completes:

1. **System Health**:
   Visit `https://your-domain.vercel.app/api/health`.
   - Verify: Returns HTTP 200 with `status: "healthy"`.

2. **Landing Page & Header Logo**:
   - Check that the new TheervuAI logo is rendered clearly in the header and footer.
   - Click `#trust` in the footer: verify smooth scrolling to Trust & Safety section.

3. **Google Authentication**:
   - Click "Sign In" in the header.
   - Complete Google OAuth sign-in and confirm redirection to the user profile with avatar in header.

4. **Universal AI Chat**:
   - Submit a test inquiry in the hero search box (e.g. "What documents do I need to renew my passport?").
   - Confirm structured response with summary, steps, and verified `.gov.in` source links.

5. **Before You Go Checklist**:
   - Navigate to `/before-you-go`.
   - Toggle checklist checkboxes and click "Save Plan". Confirm plan saves to `/saved`.

6. **Reminders Tab**:
   - Navigate to `/saved` and click "Active Reminders".
   - Click "Set Reminder", enter a title, and confirm creation.

7. **Error Handling**:
   - Visit `https://your-domain.vercel.app/random-unknown-route`.
   - Verify that the custom 404 page renders cleanly with recovery buttons.
