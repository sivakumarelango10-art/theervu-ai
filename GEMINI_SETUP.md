# Google Gemini Setup & Configuration Guide

TheervuAI integrates with Google's official Gemini SDK (`@google/genai`) to generate structured guidance, preparation plans, and document explanations.

---

## 1. Verified Target Model: Gemini 3.8 Flash

The platform targets **Gemini 3.8 Flash** (`gemini-3.8-flash`), officially released on September 2, 2026:
- **Exact API Model ID**: `gemini-3.8-flash`
- **Capabilities**:
  - 1M token context window
  - Native multimodal inputs (text, PDF, JPG, PNG, WebP, audio)
  - Structured JSON output validation (`responseSchema` & Zod validation)
  - Configurable thinking levels and sub-second latency
- **Supported Fallbacks**:
  - `gemini-2.5-flash`
  - `gemini-2.0-flash`
  - `gemini-1.5-pro`

---

## 2. Obtaining a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** and select **Create API key in new project** (or select an existing Google Cloud project).
4. Copy the generated API key.

---

## 3. Configuring Environment Variables

In your `.env.local` file (and Vercel Project Settings for production), add:

```env
# Google Gemini API Key (Server-side only)
GEMINI_API_KEY=your_gemini_api_key_here

# Configurable Gemini Model (defaults to gemini-3.8-flash)
GEMINI_MODEL=gemini-3.8-flash
```

---

## 4. Centralized Architecture

All Gemini interactions are consolidated under `lib/ai/`:

- **[`lib/ai/config.ts`](file:///e:/theervu-ai/lib/ai/config.ts)**: Single source of truth for model identifier, temperature (`0.3`), max tokens (`4096`), timeout (`30000ms`), and exponential backoff retry policy (`2 retries`).
- **[`lib/ai/gemini.ts`](file:///e:/theervu-ai/lib/ai/gemini.ts)**: Central client wrapper with timeout promise races, retry management, and error normalization.
- **[`lib/ai/schemas.ts`](file:///e:/theervu-ai/lib/ai/schemas.ts)**: Zod validation schemas for Section 6 structured preparation plans, chat outputs, and document analysis.
- **[`lib/ai/types.ts`](file:///e:/theervu-ai/lib/ai/types.ts)**: Strong TypeScript interfaces.
- **[`lib/ai/explain-document.ts`](file:///e:/theervu-ai/lib/ai/explain-document.ts)**: Multimodal document processing supporting both text and inline image/PDF parts.

---

## 5. Server-Side Key Security

- `GEMINI_API_KEY` is loaded strictly on the server (`lib/config/env.ts` and `lib/ai/providers.ts`).
- It is **never** prefixed with `NEXT_PUBLIC_`, ensuring it is never bundled into client-side JavaScript.
- All AI API calls (`/api/ai/chat`, `/api/ai/prepare`, `/api/ai/explain-document`) execute exclusively on the Next.js server runtime.

---

## 6. Development Fallback Mode

If `GEMINI_API_KEY` is absent, blank, or experiencing network limits:
- TheervuAI **does not crash or throw unhandled exceptions**.
- It seamlessly engages [`lib/ai/fallback.ts`](file:///e:/theervu-ai/lib/ai/fallback.ts), which returns verified real-world Indian procedures (RTO, Passports, Ayushman Bharat, Outpatient visits).
- Health status (`/api/health`) reports:
  ```json
  "ai": {
    "provider": "Google Gemini",
    "status": "fallback_mode",
    "model": "gemini-3.8-flash"
  }
  ```
- When a valid key is configured, the system automatically activates live Gemini generation.

---

## 7. Error Normalization & Rate Limiting

The provider layer (`lib/ai/providers.ts`) normalizes Google Gemini errors into user-friendly responses:
- **Rate Limits (`429` / `RESOURCE_EXHAUSTED`)**: User receives *"Service is currently busy. Please try again in a few moments."*
- **Authentication (`403` / `API_KEY_INVALID`)**: System falls back to verified procedural guidance without leaking credentials.
- **Timeouts**: Requests exceeding 30 seconds gracefully abort and trigger retry or fallback.
- **Abuse Protection**: Built-in sliding-window rate limiter prevents excessive prompt hammering on `/api/ai/*`.
