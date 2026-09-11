# TheervuAI — Clarity For What Comes Next

TheervuAI is an AI-powered assistance platform that helps users understand complex real-world tasks, prepare with confidence for visits to government offices, banks, hospitals, RTOs, service centers, and other institutions, and take the correct next step.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (Turbopack, App Router) | Full-stack routing, Server Components & Route Handlers |
| **UI Library** | React 19, shadcn/ui, Radix UI | Accessible, high-fidelity UI primitives |
| **Styling** | Tailwind CSS v4 | Clean, responsive design preserving approved visual design |
| **Animations** | Framer Motion | Smooth transitions and state animations |
| **Icons** | Lucide React | Clean, consistent icon system |
| **AI Engine** | Google Gemini API (`@google/genai`) | Intelligent reasoning, preparation plan generation, document explanation |
| **Authentication** | Supabase Auth (Exclusive Google OAuth) | One-click Google Sign-In with session refresh |
| **Database** | PostgreSQL via Supabase | Normalized schema with Row-Level Security (RLS) |
| **ORM / Pooler** | Prisma ORM & Supabase Pooler | Connection pooling and type-safe database queries |
| **Validation** | Zod | Runtime request, response, and schema validation |
| **Test Runner** | Vitest | Fast unit, security, and integration test execution |

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

# Production build
pnpm build
```

---

## Core Capabilities

1. **Starting Point AI Assistant**: Everyday language converted into practical next steps, required counter actions, and official verification links.
2. **Before You Go & Dynamic Checklist**: Personalized visit preparation plans with checklist item toggling, progress tracking, print/export, and persistence.
3. **Verified Civic Services Directory**: Searchable directory of public procedures across RTO, Passports, Civil Supplies, Healthcare, and Identity.
4. **Document Explanation**: Secure upload and plain-language explanation of notices, forms, and medical discharge summaries with safety disclaimers.
5. **Saved Plans & Profile Settings**: Bookmark preparation plans and set preferred regional AI languages across 9 Indian languages.
6. **Built-in Safety Layer**: Prompt injection protection, healthcare disclaimer enforcement, and emergency escalation to 112 / 108.
7. **Development Fallback Mode**: Operates seamlessly with verified procedures even before external API keys are configured.

---

## Documentation

- [Google Gemini Setup Guide](GEMINI_SETUP.md)
- [Supabase Setup & Database Guide](SUPABASE_SETUP.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Database Health Audit](DATABASE_HEALTH.md)
- [Phase 2 Verification Report](PHASE_2_VERIFICATION.md)
