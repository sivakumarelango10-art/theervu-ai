# TheervuAI Production Deployment Guide

This guide describes how to deploy **TheervuAI** to production on **Vercel** (or any Node.js hosting platform) with full Supabase and Google Gemini integration.

---

## 1. Prerequisites

Before deploying, ensure you have:
1. A **GitHub Repository** with the code (e.g. `https://github.com/sivakumarelango10-art/theervu-ai.git`).
2. A **Supabase Project** with executed migrations (`supabase/migrations/001_initial_schema.sql`).
3. A **Google Gemini API Key** from [Google AI Studio](https://aistudio.google.com/).
4. A **Vercel Account** connected to your GitHub repository.

---

## 2. Environment Variables Checklist

Configure these variables in your Vercel Project Settings (**Settings > Environment Variables**):

| Variable Name | Environment | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production & Preview | Yes | Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production & Preview | Yes | Public publishable / anon key (`sb_publishable_...`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production & Preview | Yes | Equivalent to publishable key for backwards compatibility |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Yes | Server-only admin key for background operations |
| `GEMINI_API_KEY` | Production | Yes | Google Gemini API key from AI Studio |
| `GEMINI_MODEL` | Production | Optional | Target model (defaults to `gemini-3.8-flash`) |
| `SARVAM_API_KEY` | Production | Optional | Sarvam AI key for Indian language models |
| `NEXT_PUBLIC_APP_URL` | Production | Yes | Production URL (e.g. `https://theervu-ai.vercel.app`) |
| `NODE_ENV` | Production | Auto | Set automatically to `production` by Vercel |

> [!CAUTION]
> Never expose `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` with a `NEXT_PUBLIC_` prefix. They must remain strictly server-side.

---

## 3. Supabase Production Configuration

### 3.1 Run Database Migration
In your Supabase Dashboard:
1. Navigate to **SQL Editor**.
2. Paste and run the contents of [`supabase/migrations/001_initial_schema.sql`](file:///e:/theervu-ai/supabase/migrations/001_initial_schema.sql).
3. Verify that all 10 tables (`profiles`, `services`, `source_references`, `conversations`, `messages`, `preparation_plans`, `preparation_items`, `documents`, `saved_items`, `feedback`) appear with RLS enabled.

### 3.2 Create Storage Bucket
1. Navigate to **Storage** in your Supabase Dashboard.
2. Click **New Bucket**.
3. Name: `documents`.
4. **Public bucket**: Disabled (leave toggle OFF for private storage).
5. Save the bucket.

### 3.3 Configure Google OAuth Redirect URLs
1. Navigate to **Authentication > URL Configuration**.
2. Set **Site URL** to your production URL: `https://your-domain.vercel.app`.
3. In **Redirect URLs**, add:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://your-domain.vercel.app/auth/callback` (for production)
4. Navigate to **Authentication > Providers > Google**:
   - Ensure Google provider is **Enabled**.
   - Fill in your Google Cloud OAuth Client ID and Client Secret.

---

## 4. Vercel Deployment Steps

1. Import the repository in Vercel:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `pnpm build` (or `next build`)
   - Output Directory: `.next`
   - Install Command: `pnpm install`
2. Add the environment variables listed in Section 2.
3. Click **Deploy**.
4. The build should complete in ~3-5 seconds across all 20 static and dynamic routes.

---

## 5. Post-Deployment Verification Checklist

Once deployed, verify the following endpoints:

- [ ] **Health Endpoint**: Visit `https://your-domain.vercel.app/api/health`
  - Should return HTTP 200 with database and AI status.
- [ ] **Homepage**: Verify hero chat box, quick chips, and navigation load cleanly.
- [ ] **Google OAuth**: Click "Sign In with Google" and verify redirect to Google and callback to `/auth/callback`.
- [ ] **Before You Go**: Submit a preparation request on `/before-you-go` and verify structured checklist generation.
- [ ] **Universal Assistant**: Ask a question on `/` or `/assistant` and verify response generation.
- [ ] **Services Catalog**: Browse `/services` and filter by category.
- [ ] **Rate Limiter**: Send rapid requests to verify HTTP 429 response without application crash.
