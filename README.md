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
| **Database** | PostgreSQL via Supabase | Normalized schema with Row-Level Security (RLS) on all 11 tables |
| **Storage** | Supabase Storage (`documents` bucket) | Private user-isolated document storage with MIME-type validation |
| **Security** | In-Memory Sliding-Window Rate Limiter | Abuse prevention on all AI and upload endpoints |
| **Validation** | Zod | Runtime request, response, and Section 6 structured schema validation |
| **Test Runner** | Vitest | Fast unit, security, and integration test execution (60 passing tests) |

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

1. **Hybrid AI Civic Intelligence & Zero-Fabrication Grounding**: Grounds Gemini responses directly in verified `.gov.in`/`.nic.in` catalogs to eliminate hallucinations in official fees, procedures, and timelines.
2. **Verified Civic Services Directory**: Multi-axis searchable directory across RTO, Passports, Civil Supplies, Healthcare, Certificates, Property, Pensions, and Rights.
3. **Location-Aware Guidance**: 100% user-controlled state and district filtering across 36 Indian States and Union Territories with zero automatic geolocation tracking.
4. **Before You Go & Dynamic Readiness Checklist**: Structured preparation plans with tri-state readiness (`Ready`, `Missing`, `Unclear`), custom items, item notes, print/export, and persistence.
5. **Private Application Status Tracking**: Private, user-managed tracking for Application Reference Numbers (ARNs), submission dates, and appointment deadlines with zero fake claims of live government APIs.
6. **Multimodal Document Intelligence**: High-accuracy document intelligence across 9 specialized workflows (`explain`, `summarize`, `extract_info`, `required_actions`, `missing_info`, `important_dates`, `qa`, `difficult_terms`, `next_steps`) supporting PDF, PNG, JPG, WebP.
7. **Indian Regional Languages**: Full support for 11 regional languages (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, English) with Unicode script detection and sensitive token preservation.
8. **Voice Input & Accessibility**: Microphone dictation (`useVoiceInput`) and text-to-speech reading (`useVoiceOutput`) with privacy safeguards.
9. **User-Controlled Reminders**: Integrated calendar reminders and deadlines linked to preparation plans with priority levels and PostgreSQL persistence.
10. **Administrative Governance & Curation**: Role-based access control (RBAC), service registry management endpoints, and citizen feedback auditing.
11. **Privacy-Preserving Observability**: Telemetry logger with automated regex scrubbing of Aadhaar, PAN, phone numbers, and email addresses.
12. **Development Fallback Mode**: Operates seamlessly with verified procedures even before external API keys are configured.

---

## Complete Project Documentation

### Phase Verification & Architecture
1. [Phase 6 Verification Report](PHASE_6_VERIFICATION.md) — Comprehensive verification audit, test logs, and production certification.
2. [Phase 5 Verification Report](PHASE_5_VERIFICATION.md) — Phase 5 stabilization, test logs, and hardening.
3. [Civic Data Architecture](CIVIC_DATA_ARCHITECTURE.md) — Relational schema, indexes, and JSONB structures.
4. [Service Directory Setup](SERVICE_DIRECTORY_SETUP.md) — Multi-axis filtering, seed catalogs, and fallback mechanics.
5. [Verified Sources Policy](VERIFIED_SOURCES.md) — Trust tiers, domain verification, and statutory disclaimers.
6. [Location Features & Privacy](LOCATION_FEATURES.md) — 36 States/UTs, user-controlled filtering, and zero-geolocation rules.
7. [Application Status Tracking](APPLICATION_TRACKING.md) — Manual lifecycle management and private reference tracking.
8. [Administrative Content Guide](ADMIN_CONTENT_GUIDE.md) — Role-based access, curation guidelines, and feedback audit.
9. [Privacy & Data Retention Policy](PRIVACY_AND_DATA_RETENTION.md) — PII scrubbing, sensitive tokenization, and data lifecycle.

### Core Architecture & Technical Guides
10. [Production Readiness Architecture](PRODUCTION_READINESS.md) — Operational architecture, SLAs, fallback policies, and monitoring.
11. [Security Hardening Guide](SECURITY_HARDENING.md) — Defense-in-depth, token security, rate limiting, and IDOR protection.
12. [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) — Step-by-step pre-flight checklist for Vercel and Supabase.
13. [Automated Testing Report](TESTING_REPORT.md) — Complete breakdown of 19 test suites and 75 passing tests.
14. [Known Limitations & Scope](KNOWN_LIMITATIONS.md) — Transparent inventory of technical boundaries and browser dependencies.
15. [API Documentation](API_DOCUMENTATION.md) — Complete reference for all 30 REST endpoints with Zod schemas.
16. [Database Health Audit](DATABASE_HEALTH.md) — Schema verification, foreign keys, triggers, and query consistency.
17. [Google Gemini Setup Guide](GEMINI_SETUP.md) — Model verification, configuration, and SDK usage.
18. [Supabase Setup & Database Guide](SUPABASE_SETUP.md) — PostgreSQL connection, pooler, Google OAuth, and RLS policies.
19. [Multimodal Document Intelligence Setup](MULTIMODAL_SETUP.md) — 9 workflows, file formats, and extraction schemas.
20. [Regional Language Support Guide](LANGUAGE_SUPPORT.md) — 11 Indian languages, Unicode script detection, and Sarvam AI integration.
21. [Voice System Setup & Architecture](VOICE_SETUP.md) — Speech-to-text, text-to-speech, browser APIs, and privacy safeguards.
22. [Reminders & Deadline System](REMINDERS_SETUP.md) — Reminder schema, RLS policies, and dashboard integration.
23. [Feedback & Quality Reporting](FEEDBACK_SYSTEM.md) — Feedback categories, abuse prevention, and verification triage.
24. [Deployment Guide](DEPLOYMENT_GUIDE.md) — Production deployment procedures to Vercel with Supabase and Gemini.
25. [Troubleshooting Guide](TROUBLESHOOTING.md) — Common diagnostic patterns, OAuth setup, and error recovery.
