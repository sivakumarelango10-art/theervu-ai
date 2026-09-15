# TheervuAI — Clarity For What Comes Next

<p align="center">
  <img src="public/theervu-logo.png" alt="TheervuAI Logo" width="340" />
</p>

<p align="center">
  <strong>Real-Time Civic Assistance & Institutional Visit Readiness Platform</strong><br />
  Turn confusion into clear, confident next steps for visits to government offices, hospitals, banks, RTOs, and public institutions across India.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3%20(Turbopack)-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/AI_Engine-Google_Gemini_3.8_Flash-orange?style=flat-square&logo=google" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_%2B_Supabase-3ecf8e?style=flat-square&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Real--Time-SSE_%2B_WebSockets_%2B_Broadcast-emerald?style=flat-square" alt="Real-Time" />
  <img src="https://img.shields.io/badge/Tests-181%20Passing-brightgreen?style=flat-square" alt="181 Passing Tests" />
</p>

---

## Table of Contents

1. [Overview & Mission](#overview--mission)
2. [Technology Stack](#technology-stack)
3. [Required APIs & Keys Guide (What You Need to Provide)](#required-apis--keys-guide-what-you-need-to-provide)
4. [Step-by-Step Installation & Local Setup Guide](#step-by-step-installation--local-setup-guide)
5. [Core Features & How to Use Them](#core-features--how-to-use-them)
6. [Real-Time Architecture & Performance Optimizations](#real-time-architecture--performance-optimizations)
7. [Database Schema & Migrations](#database-schema--migrations)
8. [Privacy, Security & PII Scrubbing](#privacy-security--pii-scrubbing)
9. [Running Quality Checks & Tests](#running-quality-checks--tests)
10. [Troubleshooting & FAQ](#troubleshooting--faq)

---

## Overview & Mission

Navigating public services in India — renewing a driving licence, obtaining a community certificate, registering property, applying for a passport, or visiting a government hospital — can often be overwhelming. Citizens face complex procedural documents, conflicting fee information, long counter queues, and missing paperwork.

**TheervuAI** is designed to solve this by providing:
- **Zero-Fabrication Civic Grounding**: Answers are cross-referenced with official portals (`.gov.in`, `.nic.in`) and departmental citizen charters to eliminate hallucinations in official fees, procedures, and timelines.
- **Real-Time Streaming Guidance**: Instant responses via Server-Sent Events (SSE) with token streaming under 300ms Time-To-First-Token.
- **Dynamic Visit Checklists ("Before You Go")**: Structured, interactive preparation plans with tri-state readiness (`Ready`, `Missing`, `Unclear`), custom items, and printable checklists.
- **Private Application Tracking**: Personal lifecycle management for Application Reference Numbers (ARNs), submission dates, and appointment deadlines.
- **Multimodal Document Intelligence**: In-memory analysis of forms, official letters, notices, and medical discharge summaries across 9 specialized workflows.
- **Voice Accessibility**: Real-time microphone dictation with live audio waveform visualization and text-to-speech reading in 11 Indian regional languages.
- **Offline & Fallback Independence**: Functions seamlessly with verified procedural catalogs even before external cloud or AI keys are configured.

---

## Technology Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | 16.3.3 | Turbopack engine, App Router, Route Handlers, Server Components, and Next.js 16 Proxy convention |
| **UI Library** | [React](https://react.dev/) | 19.x | Component model, hooks, and streaming rendering |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | v4.3 | High-performance CSS engine via `@tailwindcss/postcss` |
| **UI Primitives** | [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/) | Latest | Accessible modal dialogs, dropdowns, tabs, progress bars, and accessible primitives |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | 13.2 | Smooth transitions, layout shifts, accordion toggles, and state micro-animations |
| **Icons** | [Lucide React](https://lucide.dev/) | 1.16 | Cohesive, accessible SVG icon system |
| **AI Engine** | [Google Gen AI SDK](https://github.com/google/generative-ai-js) (`@google/genai`) | 2.21 | Model `gemini-3.8-flash` with structured outputs, multimodal analysis, and SSE token streaming |
| **Regional Voice / NLP** | [Sarvam AI](https://www.sarvam.ai/) (Optional) | REST | Optional Indian regional speech-to-text and translation |
| **Database & Auth** | [Supabase](https://supabase.com/) (`@supabase/ssr`, `@supabase/supabase-js`, `@supabase/server`) | 2.116 | PostgreSQL with Row-Level Security (RLS), Google OAuth, and Private Document Storage |
| **Real-Time Bus** | Supabase Realtime + HTML5 `BroadcastChannel` | Native | Live multi-tab synchronization and Postgres Change Data Capture (CDC) via WebSockets |
| **Audio Processing** | Web Audio API (`AudioContext`, `AnalyserNode`) | Native | Real-time audio waveform and volume visualizer during voice input |
| **Validation** | [Zod](https://zod.dev/) | 4.6 | Runtime input, response, and structured schema validation |
| **Testing** | [Vitest](https://vitest.dev/) | 5.0 | High-speed unit and integration testing suite (181 tests across 28 suites) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | 5.7 | Strict type safety across frontend and server |

---

## Required APIs & Keys Guide (What You Need to Provide)

TheervuAI is built with progressive enhancement: it can run **immediately in offline development mode**, but connecting real cloud APIs unlocks full capabilities.

Here is the exact breakdown of every API key required, what it does, and where to get it:

### 1. Google Gemini API (Required for Live AI Intelligence)

- **Environment Variable**: `GEMINI_API_KEY`
- **Optional Variable**: `GEMINI_MODEL=gemini-3.8-flash`
- **What it does**: Powers real-time streaming AI chat, Before-You-Go customized visit checklists, and multimodal document analysis (PDF/images).
- **Where to get it**:
  1. Visit [Google AI Studio](https://aistudio.google.com/).
  2. Sign in with your Google account.
  3. Click **"Get API key"** and create a key in a new or existing Google Cloud project.
  4. Copy the API key and paste it as `GEMINI_API_KEY` in your `.env.local` file.
- **Cost**: Generous **free tier** available (no credit card required to start).
- **Fallback Behavior**: If omitted or left empty, TheervuAI automatically switches to **Verified Procedural Offline Mode**, using curated departmental guidance catalogs for hundreds of public services.

### 2. Supabase Cloud (Required for User Auth, Database & Realtime Sync)

- **Environment Variables**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (e.g. `https://xyzproject.supabase.co`).
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous/publishable key (`sb_publishable_...` or `ey...`).
  - `SUPABASE_SERVICE_ROLE_KEY`: Secret service-role key (server-only, never exposed to client).
  - `DATABASE_URL`: Transaction connection pooler URI (`postgresql://postgres...:6543/postgres?pgbouncer=true`).
  - `DIRECT_URL`: Direct session connection URI (`postgresql://postgres...:5432/postgres`).
- **What it does**:
  - **Authentication**: One-click Google OAuth sign-in with automatic profile creation.
  - **Database**: PostgreSQL storing preparation plans, tracked applications, reminders, and user preferences with Row-Level Security (RLS).
  - **Storage**: User-isolated `documents` bucket with strict MIME-type validation.
  - **Real-Time**: WebSocket subscriptions (`postgres_changes`) syncing updates across devices.
- **Where to get it**:
  1. Create a free account at [Supabase](https://supabase.com/).
  2. Create a new project (select AWS region closest to your users, e.g., Mumbai `ap-south-1`).
  3. Go to **Project Settings > API**:
     - Copy **Project URL** into `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`.
     - Copy **anon / public key** into `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
     - Copy **service_role key** into `SUPABASE_SERVICE_ROLE_KEY`.
  4. Go to **Project Settings > Database** to copy your `DATABASE_URL` (pooler) and `DIRECT_URL` (direct).
- **Cost**: Free tier includes 500MB database, 1GB storage, and 50,000 monthly active users.
- **Fallback Behavior**: If omitted, all features remain accessible in local in-memory/browser mode, with multi-tab real-time sync powered by `BroadcastChannel`.

### 3. Sarvam AI (Optional — Indian Regional Languages)

- **Environment Variable**: `SARVAM_API_KEY`
- **What it does**: Specialized speech-to-text transcription and text-to-speech synthesis tailored specifically for Indian accents and regional languages (Tamil, Hindi, Telugu, Kannada, etc.).
- **Where to get it**: [Sarvam AI Dashboard](https://www.sarvam.ai/).
- **Fallback Behavior**: **Optional**. If not provided, Indian languages are handled natively by Google Gemini and browser Web Speech APIs.

---

## Step-by-Step Installation & Local Setup Guide

### 1. Prerequisites

Make sure you have installed on your machine:
- **Node.js**: v18.18.0 or newer (v20.x or v22.x LTS recommended). Check with `node -v`.
- **Package Manager**: `pnpm` (recommended) or `npm`.
  ```bash
  # Install pnpm globally if you don't have it
  npm install -g pnpm
  ```

### 2. Clone the Repository

```bash
git clone https://github.com/your-username/theervu-ai.git
cd theervu-ai
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Configure Environment Variables

Create your local environment file by copying `.env.example`:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and configure your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Server / Backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Connection Strings (from Supabase Database Settings)
DATABASE_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Google Gemini API (Get free from https://aistudio.google.com/)
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash

# Optional: Sarvam AI Key
SARVAM_API_KEY=

# Public Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Node Environment
NODE_ENV=development
```

### 5. Initialize Supabase Database (If using Cloud DB)

If you have a Supabase project, execute the SQL migration scripts in order inside the **Supabase SQL Editor**:
1. `supabase/migrations/001_initial_schema.sql` (Profiles, Services, Conversations, Plans, Feedback, RLS)
2. `supabase/migrations/002_reminders.sql` (Reminders schema & RLS)
3. `supabase/migrations/003_civic_intelligence.sql` (Application tracking, enhanced services schema)
4. `supabase/migrations/004_notifications.sql` (Notifications & status change triggers)

*(If you are running in offline development mode without Supabase, you can skip this step!)*

### 6. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The application will be running with hot reloading and Turbopack.

---

## Core Features & How to Use Them

### 1. Universal Civic Assistant (Real-Time Streaming Chat)
- **What it does**: Converts conversational descriptions into actionable, structured next steps with official source citations.
- **How to use it**:
  1. On the home page, type any everyday situation in the central box (e.g. *"I lost my wallet with driving licence and Aadhaar in Chennai, what should I do first?"*).
  2. Select your preferred response language (English, Tamil, Hindi, etc.) from the language dropdown.
  3. Press **Enter** or click **Continue**.
  4. Response tokens stream in real-time with an animated cursor.
  5. Click **"Listen"** to hear the response read aloud, or **"Turn into Checklist"** to convert the advice into an interactive preparation plan.

### 2. Voice Dictation & Real-Time Audio Visualizer
- **What it does**: Allows voice dictation in English and Indian regional languages without typing.
- **How to use it**:
  1. Click the **Microphone** icon in the input box.
  2. Grant microphone permissions in your browser.
  3. The indicator changes to a pulsating red badge with a **real-time 3-bar audio equalizer** reacting dynamically to your voice volume.
  4. Speak naturally; your words are transcribed live into the input box. Click the mic icon again when finished.

### 3. Before You Go — Dynamic Preparation Checklists
- **What it does**: Organizes required documents, counter procedures, fees, and appointment requirements into a structured checklist before you leave home.
- **How to use it**:
  1. Navigate to **Before You Go** from the top menu (`/before-you-go`).
  2. Enter the task (e.g., *"Tatkaal Passport"*) and optional State/City (*"Karnataka"*).
  3. Click **Generate Plan**.
  4. Review requirements split into **Documents**, **Counter Actions**, and **Verification**.
  5. Interact with each item using tri-state readiness:
     - Click **Ready** (green check) when you have the document.
     - Click **Missing** (red cross) for pending items.
     - Click **Unclear** (amber question mark) if you need to clarify instructions.
  6. Add **Personal Notes** to any item (e.g., *"Original kept in bedroom locker"*).
  7. Click **"Add Custom Item"** to append user-specific tasks.
  8. Click **"Print"** for physical paper preparation or **"Copy"** for WhatsApp/email sharing.
  9. Click **"Save Plan"** to store it in your dashboard.

### 4. Civic Services Directory
- **What it does**: Searchable catalog of official government procedures with mandatory documents, official fee structures, and direct links to canonical portals.
- **How to use it**:
  1. Go to **Services** (`/services`).
  2. Filter by Category (*Transport, Identity, Healthcare, Property, etc.*).
  3. Filter by **State** and **District** across 36 Indian States and Union Territories.
  4. Click any service card to view complete eligibility, step-by-step counter procedures, and statutory disclaimers.

### 5. Private Application Status Tracking
- **What it does**: Private, user-controlled tracker for Application Reference Numbers (ARNs), submission dates, and appointment steps.
- **How to use it**:
  1. Go to **My Dashboard** (`/saved`) and open the **"Tracked Applications"** tab.
  2. Click **"Track New Application"**.
  3. Enter the service name, authority (e.g. *RTO Bangalore West*), Application Reference Number, portal URL, and deadline.
  4. Update status across standard civic lifecycle states (*Submitted*, *Under Review*, *Action Required*, *Approved*, *Completed*).
  5. Updates synchronize in real-time across all open tabs.

### 6. Multimodal Document Intelligence
- **What it does**: Analyzes notices, forms, letters, and hospital summaries using 9 specialized workflows.
- **How to use it**:
  1. Click the **Paperclip** icon on the home assistant or open Document Analysis.
  2. Upload a PDF, PNG, JPG, or WebP document (up to 10MB).
  3. Select a workflow:
     - **Explain**: Plain-language breakdown of legal/official terminology.
     - **Summarize**: Quick 3-bullet overview.
     - **Required Actions**: Specific deadlines and tasks citizen must perform.
     - **Missing Info**: Fields or attachments missing from the document.
     - **Important Dates**: Filing deadlines, appointment slots, and validity windows.
  4. Analysis executes in-memory with zero permanent retention of private sensitive data.

### 7. In-App Reminders & Browser Alerts
- **What it does**: Keeps track of scheduled visits, fee deadlines, and renewal dates.
- **How to use it**:
  1. Open Dashboard (`/saved`) > **Active Reminders** tab.
  2. Click **"Add Reminder"**.
  3. Select category (*Appointment*, *Document Expiry*, *Checklist*, *Follow-up*) and schedule a date/time.
  4. Optionally enable browser notifications for on-device desktop alerts.

---

## Real-Time Architecture & Performance Optimizations

TheervuAI employs a dual-layer real-time and optimization architecture:

```mermaid
graph TD
    Client[Browser Client] -->|1. SSE Stream| ChatAPI[/api/ai/chat?stream=true]
    ChatAPI -->|Stream Tokens| Gemini[Google Gemini 3.8 Flash]
    ChatAPI -.->|Async Save| SupabaseDB[(PostgreSQL DB)]
    
    Client -->|2. Web Audio API| Visualizer[Real-Time Waveform Visualizer]
    
    Client -->|3. WebSockets CDC| SupabaseRealtime[Supabase Realtime Channel]
    SupabaseRealtime -->|Live Postgres Changes| Dashboard[Saved Dashboard]
    
    Client -->|4. HTML5 BroadcastChannel| Tab2[Other Browser Tabs]
```

1. **Server-Sent Events (SSE) AI Streaming**:
   - Token-by-token streaming via `@google/genai` `generateContentStream`.
   - Client consumes chunks via `ReadableStreamDefaultReader` with immediate DOM updates and an active pulsating cursor.
   - Non-blocking asynchronous conversation persistence in the background.
2. **Supabase Realtime (WebSockets)**:
   - Client subscribes to Postgres Change Data Capture (`postgres_changes`) on `application_trackers`, `reminders`, and `saved_items`.
   - Content Security Policy (CSP) includes `wss://*.supabase.co` to support WebSocket handshakes in production.
3. **Cross-Tab Real-Time Event Bus (`BroadcastChannel`)**:
   - Dispatches `APPLICATIONS_CHANGED`, `REMINDERS_CHANGED`, and `SAVED_ITEMS_CHANGED` events across browser tabs.
   - Ensures multi-window sync even in offline or local mode.
4. **Web Audio Visualizer**:
   - Captures microphone stream via `navigator.mediaDevices.getUserMedia`.
   - Analyzes frequency data with `AnalyserNode` and normalizes volume (0-100) via `requestAnimationFrame` to render dynamic equalizer bars.
5. **Bundle Splitting & Next.js 16 Optimization**:
   - Next.js 16 Proxy convention (`proxy.ts`) eliminating middleware deprecation warnings.
   - `next/dynamic` lazy loading for heavy modals (`DocumentUploadModal`, `FeedbackModal`, `AddReminderModal`, `AddApplicationModal`).
   - Package import optimization for `lucide-react` and `framer-motion`.
   - Next.js `<Image>` with explicit dimensions and `priority` on above-the-fold brand assets.

---

## Database Schema & Migrations

All tables are defined in `supabase/migrations/` and include strict Row-Level Security (RLS) policies:

| Table | Purpose | RLS Policy |
| :--- | :--- | :--- |
| `public.profiles` | User profiles with preferred language and location | `auth.uid() = id` (User-isolated) |
| `public.services` | Verified catalog of 30+ civic institutions | Public read (`true`), Admin write |
| `public.conversations` | Conversation sessions | `auth.uid() = user_id` |
| `public.messages` | Multi-turn user and assistant messages | Parent conversation ownership |
| `public.preparation_plans`| Generated Before-You-Go visit plans | `auth.uid() = user_id` |
| `public.preparation_items`| Individual checklist items & readiness states | Parent plan ownership |
| `public.application_trackers`| Personal application references & deadlines | `auth.uid() = user_id` |
| `public.reminders` | User-scheduled appointments and deadlines | `auth.uid() = user_id` |
| `public.documents` | Uploaded document metadata | `auth.uid() = user_id` |
| `public.saved_items` | Bookmarked plans and services | `auth.uid() = user_id` |
| `public.notifications` | User alerts and reminder notifications | `auth.uid() = user_id` |
| `public.feedback` | User ratings and suggestions | Authenticated insert / admin read |

---

## Privacy, Security & PII Scrubbing

TheervuAI adheres to a strict **Privacy-First Civic Architecture**:
- **Automatic PII Scrubbing**: All telemetry logs scrub Indian Aadhaar numbers (`\d{4}\s\d{4}\s\d{4}`), PAN cards (`[A-Z]{5}\d{4}[A-Z]`), 10-digit Indian mobile numbers, and email addresses before logging or transmission.
- **Zero Audio Storage**: Speech recognition runs directly on-device using the browser SpeechRecognition API or ephemeral server processing. No audio buffers are written to disk.
- **Ephemeral Document Analysis**: Uploaded document images and PDFs are processed in-memory for extraction and discarded.
- **Rate Limiting**: In-memory sliding-window rate limiters protect all AI, upload, and mutation endpoints against abuse.
- **Strict Content Security Policy (CSP)**: Enforces `default-src 'self'`, script integrity, and explicit WebSocket allowances for Supabase Realtime.

---

## Running Quality Checks & Tests

The project includes an automated test suite with **181 tests across 28 test suites**:

```bash
# 1. Type check without emitting files
pnpm lint

# 2. Run all unit & integration tests
pnpm test

# 3. Run production build
pnpm build

# 4. Start production server locally
pnpm start
```

### Test Suite Breakdown

- `tests/unit/realtime.test.ts`: SSE streaming, token generation, emergency routing, and cross-tab broadcast.
- `tests/unit/accessibility-a11y.test.ts`: Accessibility labels, ARIA attributes, keyboard navigation.
- `tests/unit/security-validation.test.ts`: Zod schema validation, payload injection prevention.
- `tests/unit/intent-classifier.test.ts`: Civic domain intent routing and entity extraction.
- `tests/unit/observability.test.ts`: PII scrubbing and structured logging.
- `tests/unit/application-tracking.test.ts`: Status lifecycle transitions and reference validation.
- `tests/unit/languages.test.ts`: 11 Indian languages, Unicode script detection, token preservation.
- `tests/unit/rate-limit.test.ts`: Sliding-window limiter enforcement.
- `tests/unit/fallback.test.ts`: Deterministic offline guidance generation.

---

## Troubleshooting & FAQ

### 1. "AI Chat says: Operating in verified guidance mode"
- **Reason**: `GEMINI_API_KEY` is not set or invalid in `.env.local`.
- **Solution**: Obtain a free key from [Google AI Studio](https://aistudio.google.com/) and paste it into `.env.local`, then restart `pnpm dev`. In the meantime, the app continues to serve verified procedural guidance.

### 2. "Authentication / Saved Items not persisting"
- **Reason**: Supabase credentials are not connected or database migrations have not been applied.
- **Solution**: Follow [Step 4 & 5](#4-configure-environment-variables) to paste your Supabase project URL and keys into `.env.local` and execute the migration files in the Supabase SQL editor.

### 3. "Microphone button says: Voice dictation not supported"
- **Reason**: The browser Speech Recognition API is supported natively in Google Chrome, Microsoft Edge, Brave, and Safari.
- **Solution**: Use Chrome or Edge for full Web Speech dictation support.

### 4. "Real-time updates not reflecting across tabs"
- **Reason**: Running in an older browser without HTML5 `BroadcastChannel` support.
- **Solution**: Modern browsers (Chrome 54+, Edge 79+, Firefox 38+, Safari 15.4+) support BroadcastChannel natively. If using Supabase Cloud, updates are also delivered via WebSockets.

---

## License

Copyright © 2026 TheervuAI. Built with clarity, trust, and civic independence.
