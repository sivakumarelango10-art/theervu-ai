# Production Deployment — TheervuAI

## Prerequisites

- Node.js 20+ / pnpm 9+
- Supabase project with PostgreSQL
- Google Gemini API key (AI Studio)
- Vercel account (recommended) or any Node.js hosting

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxx

# AI
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-flash

# Admin Access
ADMIN_EMAILS=admin@yourdomain.com,admin2@yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Optional: Sarvam AI (Indian language support)
SARVAM_API_KEY=sk_...

# Optional: Email notifications
RESEND_API_KEY=re_...

# Optional: SMS notifications
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
```

## Database Setup

Run migrations in order:
```bash
# In Supabase SQL Editor or via CLI:
001_initial_schema.sql
002_reminders.sql
003_civic_intelligence.sql
004_notifications.sql
```

## Authentication Setup

In Supabase Dashboard → Authentication → Providers:
1. Enable **Google** provider
2. Add **Client ID** and **Client Secret** from Google Cloud Console
3. Set **Redirect URL**: `https://yourdomain.com/auth/callback`

In Google Cloud Console:
1. Create OAuth 2.0 credentials
2. Add authorized redirect URIs:
   - `https://yourdomain.com/auth/callback`
   - `https://your-project.supabase.co/auth/v1/callback`

## Storage Setup

In Supabase Dashboard → Storage:
1. Create bucket named `documents`
2. Set bucket to **Private** (not public)
3. Add RLS policy: Users can only access their own files

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Or connect GitHub repository in Vercel dashboard for auto-deploy
```

Set all environment variables in Vercel Dashboard → Settings → Environment Variables.

## Build Validation

```bash
pnpm install
pnpm exec tsc --noEmit   # 0 TypeScript errors required
pnpm test                # All tests must pass
pnpm build               # Production build must succeed
```

## Post-Deployment Verification

1. Visit `https://yourdomain.com/api/health` → should return `{ status: 'ok' }`
2. Test Google OAuth login flow
3. Verify chat AI response works
4. Verify Before You Go plan generation
5. Verify service directory loads
6. Test document upload (as logged-in user)
7. Check `/api/admin/metrics` with admin account
8. Verify `X-Frame-Options: DENY` header in browser DevTools

## Known Limitations

See `docs/KNOWN_LIMITATIONS.md`
