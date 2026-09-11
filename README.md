# TheervuAI — Clarity For What Comes Next

TheervuAI is an AI-powered civic assistance platform designed to help users prepare with confidence for visits to government offices, banks, hospitals, RTOs, service centers, and other public-facing institutions.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (Turbopack, App Router) | Full-stack routing, Server Components & Route Handlers |
| **UI Library** | React 19, shadcn/ui, Radix UI | Accessible, high-fidelity UI primitives |
| **Styling** | Tailwind CSS v4 | Clean, responsive design preserving approved visual design |
| **Animations** | Framer Motion | Smooth transitions and state animations |
| **Icons** | Lucide React | Clean, consistent icon system |
| **AI Engine** | Google Gemini API (`@google/genai`) | Model: `gemini-3.8-flash` with structured outputs and multimodal analysis |
| **Authentication** | Supabase Auth (Exclusive Google OAuth) | One-click Google Sign-In with server session refresh |
| **Database** | PostgreSQL via Supabase | Normalized schema with Row-Level Security (RLS) on all 10 tables |
| **Storage** | Supabase Storage (`documents` bucket) | Private user-isolated document storage with MIME-type validation |
| **Security** | In-Memory Sliding-Window Rate Limiter | Abuse prevention on all AI and upload endpoints |
| **Validation** | Zod | Runtime request, response, and Section 6 structured schema validation |
| **Test Runner** | Vitest | Fast unit, security, and integration test execution (29 passing tests) |

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18.18.0 or newer (v20+ recommended)
- **Package Manager**: `pnpm` (v9 or v11)

### 2. Installation
```bash
pnpm install
```

### 3. Environment Setup
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

### 4. Running the Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Quality Checks
```bash
# Type checking
pnpm exec tsc --noEmit

# Unit & integration tests
pnpm test

# Linting
pnpm lint

# Production build
pnpm build
```

---

## Core Capabilities

1. **Universal AI Assistant**: Plain-language civic advice, required counter actions, and official verification links with voice dictation and read-aloud capabilities.
2. **Before You Go & Dynamic Checklist**: Section 6 structured preparation plans (`steps`, `documents`, `fees`, `timing`, `warnings`, `sourceNotes`) with interactive toggling, uncertainty labeling, and persistence.
3. **Verified Civic Services Directory**: Searchable directory of public procedures across RTO, Passports, Civil Supplies, Healthcare, and Identity.
4. **Multimodal Document Intelligence**: High-accuracy document intelligence across 9 specialized workflows (`explain`, `summarize`, `extract_info`, `required_actions`, `missing_info`, `important_dates`, `qa`, `difficult_terms`, `next_steps`) supporting PDF, PNG, JPG, WebP.
5. **Indian Regional Languages**: Full support for 11 regional languages (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, English) with Unicode script detection, preservation of sensitive IDs, and Sarvam AI integration.
6. **Voice Input & Accessibility**: Microphone dictation (`useVoiceInput`) and text-to-speech reading (`useVoiceOutput`) with privacy safeguards (zero audio storage, zero autoplay).
7. **User-Controlled Reminders**: Integrated calendar reminders and deadlines linked to preparation plans with priority levels and PostgreSQL persistence.
8. **Feedback & Verification**: Community quality reporting system for outdated fees, missing counter steps, and procedural accuracy.
9. **Built-in Safety Layer**: Prompt injection protection, healthcare disclaimer enforcement, and emergency escalation to 112 / 108.
10. **Development Fallback Mode**: Operates seamlessly with verified procedures even before external API keys are configured.

---

## Complete Project Documentation

1. [Google Gemini Setup Guide](GEMINI_SETUP.md) — Model verification (`gemini-3.8-flash`), configuration, and SDK usage.
2. [Supabase Setup & Database Guide](SUPABASE_SETUP.md) — PostgreSQL connection, pooler, Google OAuth, and RLS policies.
3. [API Documentation](API_DOCUMENTATION.md) — Reference for all 25 REST endpoints with Zod schemas.
4. [Database Health Audit](DATABASE_HEALTH.md) — 11-table schema verification, foreign keys, triggers, and query consistency.
5. [Security & Authorization Audit](SECURITY_AUDIT.md) — Defense-in-depth, token security, rate limiting, audio privacy, and IDOR protection.
6. [Multimodal Document Intelligence Setup](MULTIMODAL_SETUP.md) — 9 workflows, file formats, and extraction schemas.
7. [Regional Language Support Guide](LANGUAGE_SUPPORT.md) — 11 Indian languages, Unicode script detection, and Sarvam AI integration.
8. [Voice System Setup & Architecture](VOICE_SETUP.md) — Speech-to-text, text-to-speech, browser APIs, and privacy safeguards.
9. [Reminders & Deadline System](REMINDERS_SETUP.md) — Reminder schema, RLS policies, and dashboard integration.
10. [Feedback & Quality Reporting](FEEDBACK_SYSTEM.md) — Feedback categories, abuse prevention, and verification triage.
11. [Deployment Guide](DEPLOYMENT_GUIDE.md) — Step-by-step production deployment to Vercel with Supabase and Gemini.
12. [Troubleshooting Guide](TROUBLESHOOTING.md) — Common diagnostic patterns, OAuth setup, and error recovery.
13. [Phase 3 Verification Report](PHASE_3_VERIFICATION.md) — Phase 3 audit results, test logs, and stabilization certification.
14. [Phase 4 Verification Report](PHASE_4_VERIFICATION.md) — Phase 4 multimodal, multilingual, voice, and personalization verification.

