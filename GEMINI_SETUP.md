# Google Gemini Setup Guide

TheervuAI integrates with Google's official Gemini SDK (`@google/genai`) to generate structured guidance, preparation plans, and document explanations.

---

## 1. Obtaining a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** and select **Create API key in new project** (or select an existing Google Cloud project).
4. Copy the generated API key.

---

## 2. Configuring Environment Variables

In your `.env.local` file, add your API key and preferred model:

```env
# Google Gemini API Key (Server-side only)
GEMINI_API_KEY=AIzaSy...

# Optional: Gemini Model (defaults to gemini-2.0-flash)
GEMINI_MODEL=gemini-2.0-flash
```

Supported Gemini Models:
- `gemini-2.0-flash` (Recommended: fastest, highly cost-effective, structured output support)
- `gemini-2.5-flash` (Latest reasoning and multimodal performance)
- `gemini-1.5-pro` (Complex document reasoning)

---

## 3. Server-Side Key Security

- `GEMINI_API_KEY` is loaded strictly on the server (`lib/config/env.ts` and `lib/ai/providers.ts`).
- It is **never** prefixed with `NEXT_PUBLIC_`, ensuring it is never bundled into client-side JavaScript.
- All AI API calls (`/api/ai/chat`, `/api/ai/prepare`, `/api/ai/explain-document`) execute exclusively on the Next.js server runtime.

---

## 4. Development Fallback Mode

If `GEMINI_API_KEY` is absent, blank, or placeholder:
- TheervuAI **does not crash or throw unhandled exceptions**.
- It seamlessly engages `lib/ai/fallback.ts`, which returns verified real-world Indian procedures (RTO, Passports, Ayushman Bharat, Outpatient visits).
- Health status (`/api/health`) reports:
  ```json
  "ai": {
    "provider": "Google Gemini",
    "status": "fallback_mode",
    "model": "gemini-2.0-flash"
  }
  ```
- When a valid key is added to `.env.local`, the system automatically activates live Gemini generation.

---

## 5. Error Normalization & Rate Limiting

The provider layer (`lib/ai/providers.ts`) normalizes Google Gemini errors into user-friendly responses:
- **Rate Limits (`429` / `RESOURCE_EXHAUSTED`)**: User receives *"Service is currently busy. Please try again in a few moments."*
- **Authentication (`403` / `API_KEY_INVALID`)**: System falls back to verified procedural guidance without leaking credentials.
- **Timeouts**: User receives *"The request took too long to complete. Please try again."*
- **Abuse Protection**: Built-in sliding-window rate limiter prevents excessive prompt hammering on `/api/ai/*`.
