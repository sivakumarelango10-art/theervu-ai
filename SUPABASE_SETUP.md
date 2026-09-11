# Supabase & Database Setup Guide

TheervuAI uses Supabase for **Exclusive Google OAuth Authentication**, **PostgreSQL Database Storage**, **Row-Level Security (RLS)**, and **Private Document Storage**.

---

## 1. Supabase Project Configuration

1. Create a project at [supabase.com](https://supabase.com).
2. Note your **Project URL** and **API Keys** from **Settings > API**:
   - `Project URL`
   - `anon / public key` (or new format `sb_publishable_...`)
   - `service_role key` (secret, server-only)

---

## 2. Setting Up Google OAuth (Exclusive Sign-In)

TheervuAI is intentionally configured for **Google OAuth only** (no password forms or user registrations):

1. In the Supabase Dashboard, navigate to **Authentication > Providers > Google**.
2. Toggle **Enable Google provider**.
3. In [Google Cloud Console](https://console.cloud.google.com/):
   - Create an OAuth 2.0 Client ID (Web application).
   - Under **Authorized redirect URIs**, add:
     ```
     https://<your-supabase-project-id>.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret** into the Supabase Google provider settings.
4. Under **Authentication > URL Configuration**:
   - Set **Site URL** to `http://localhost:3000` (or your production URL).
   - Add redirect URL: `http://localhost:3000/auth/callback` (and `https://your-domain.com/auth/callback`).

---

## 3. Applying Database Schema & Migrations

Open the **SQL Editor** in the Supabase Dashboard:

1. Copy and execute [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql).
   - Creates 10 normalized tables: `profiles`, `services`, `source_references`, `conversations`, `messages`, `preparation_plans`, `preparation_items`, `documents`, `saved_items`, `feedback`.
   - Creates `handle_new_user()` trigger for automated Google profile synchronization.
   - Enables Row-Level Security (RLS) on all 10 tables.
2. Copy and execute [`supabase/seed.sql`](supabase/seed.sql).
   - Seeds verified Indian civic services (RTO, Passports, Ayushman Bharat, etc.).

---

## 4. Configuring Private Document Storage

1. Navigate to **Storage** in the Supabase Dashboard.
2. Click **Create a new bucket**:
   - Bucket Name: `documents`
   - Privacy: **Private** (do NOT enable public bucket).
3. The storage RLS policies in `supabase/migrations/001_initial_schema.sql` automatically restrict access so users can only access files in their own folder (`users/{user_id}/*`).

---

## 5. Local Environment Setup (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xtlwtihbtwxksahadfrq.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...

SUPABASE_URL=https://xtlwtihbtwxksahadfrq.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_JWKS_URL=https://xtlwtihbtwxksahadfrq.supabase.co/auth/v1/.well-known/jwks.json
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

DATABASE_URL="postgresql://postgres.xtlwtihbtwxksahadfrq:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xtlwtihbtwxksahadfrq:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

---

## 6. Verifying Database Connectivity

You can verify database status at any time by requesting:
```bash
curl http://localhost:3000/api/health
```
Which returns:
```json
{
  "status": "healthy",
  "database": {
    "status": "reachable",
    "servicesCount": 6
  }
}
```
