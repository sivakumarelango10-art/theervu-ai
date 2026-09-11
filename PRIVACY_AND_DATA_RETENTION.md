# Privacy, PII Protection & Data Retention Policy

This document details TheervuAI's privacy architecture, personally identifiable information (PII) scrubbing rules, and data retention standards.

---

## 1. Core Privacy Commitments

TheervuAI is built on privacy-by-design principles:
- **No Aadhaar or PAN Storage**: We do **not** store full Aadhaar numbers, biometric templates, or financial credentials in plaintext databases.
- **Client-Side Sensitive Tokenization**: Aadhaar, PAN, phone numbers, and official identifiers are protected from unauthorized model training or third-party exposure.
- **Manual Location Selection**: Location awareness is strictly citizen-driven with zero automatic background geolocation or IP tracking.
- **Isolated User Storage**: Every user resource (reminders, plans, documents, application trackers) is isolated by Supabase Row Level Security (`auth.uid() = user_id`).

---

## 2. Automated Telemetry PII Scrubbing

`lib/observability/metrics.ts` automatically runs all metrics and operational logs through regex scrubbing:

```typescript
export function scrubPII(text: string): string {
  return text
    // Aadhaar 12-digit patterns
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[REDACTED_AADHAAR]')
    // PAN alphanumeric format
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/gi, '[REDACTED_PAN]')
    // Indian 10-digit mobile numbers
    .replace(/(\+91[\s-]?)?[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
    // Email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
}
```

---

## 3. Data Retention Schedules

| Resource Type | Storage Location | Retention Policy | Deletion Mechanism |
| :--- | :--- | :--- | :--- |
| **User Profiles** | `public.profiles` | Maintained for duration of account | User deletion cascades all records |
| **Preparation Plans** | `public.preparation_plans` | User-managed | Deleted via `/api/preparation-plans/:id` |
| **Application Trackers** | `public.application_trackers` | User-managed | Deleted via `/api/applications/:id` |
| **Reminders** | `public.reminders` | User-managed | Deleted via `/api/reminders/:id` |
| **Uploaded Documents** | `supabase/storage` | User-managed temporary analysis | Deleted via `/api/documents/:id` |
| **Operational Metrics** | In-memory ring buffer | Max 200 events (RAM only, non-persistent) | Automatic FIFO eviction |
| **Conversations** | `public.conversations` | User-managed history | Deleted via `/api/conversations/:id` |
