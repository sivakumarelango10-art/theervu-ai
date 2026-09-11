# TheervuAI Feedback & Quality Reporting System

This document outlines the user feedback, reporting, and quality assurance framework implemented in **TheervuAI** during Phase 4.

---

## 1. Overview & Purpose

TheervuAI assists citizens with high-stakes, time-sensitive visits to government offices, hospitals, banks, and public counters. Information regarding counter procedures, required documents, and fees can evolve or vary across jurisdictions.

The Feedback & Reporting System provides a transparent, structured mechanism for users to:
- Report outdated or inaccurate office hours, fees, or procedural steps.
- Highlight missing checklist documents or local counter variations.
- Provide rating and qualitative feedback on AI-generated guidance.
- Help refine prompt templates, source catalogs, and verification rules.

---

## 2. Feedback Categories & Target Entities

### 2.1 Feedback Categories (`feedbackType`)
| Category | Code | Description |
|---|---|---|
| **Accuracy Issue** | `accuracy` | An instruction or requirement provided was factually incorrect. |
| **Missing Step / Document** | `missing_step` | An essential document, attested copy, or counter step was omitted. |
| **Outdated Information** | `outdated_info` | A fee structure, government portal link, or office timing has changed. |
| **Helpful / Positive** | `helpful` | The guidance successfully resolved the user's task or visit. |
| **Other / General** | `other` | General suggestions, usability feedback, or bug reports. |

### 2.2 Target Entities (`targetType`)
Feedback can be anchored to specific domain items or submitted generally:
- `plan`: Associated with a specific preparation plan ID (`targetId`).
- `service`: Associated with a civic catalog service slug/ID.
- `chat`: Associated with an AI guidance conversation or message.
- `document`: Associated with an explained document or extraction report.
- `general`: General platform feedback.

---

## 3. Database Schema & Persistence

Feedback records are persisted in the `public.feedback` table with PostgreSQL Row-Level Security (RLS) enabled:

```sql
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('accuracy', 'missing_step', 'outdated_info', 'helpful', 'other')),
  target_type TEXT NOT NULL CHECK (target_type IN ('plan', 'service', 'chat', 'document', 'general')),
  target_id TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS Policies
- **INSERT**: Any visitor (anonymous or authenticated) can submit feedback.
- **SELECT**: Authenticated users can view their own submitted feedback (`auth.uid() = user_id`).
- **Administrative Review**: Service role can inspect and query aggregate reports.

---

## 4. API Specification: `POST /api/feedback`

- **Endpoint**: `/api/feedback`
- **Method**: `POST`
- **Authentication**: Optional (supports anonymous user submissions; attaches `user_id` if authenticated).
- **Rate Limit**: 10 submissions per 60-second sliding window per client IP.

### Request Body Schema (Zod Validated)
```json
{
  "feedbackType": "missing_step",
  "targetType": "plan",
  "targetId": "7b7e21a2-8c1e-450f-90e8-0b8d5a23e120",
  "rating": 4,
  "comments": "The Passport Seva Kendra in Chennai required 2 self-attested photocopies of the electricity bill, not just 1.",
  "metadata": {
    "district": "Chennai",
    "service": "passport-reissue"
  }
}
```

### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Thank you for your feedback. Our verification team will review this report."
}
```

### Error Responses
- `400 Bad Request`: Missing required fields (`feedbackType`, `targetType`), invalid rating (not 1-5), or invalid category enum.
- `429 Too Many Requests`: Client exceeded sliding-window limit (`Retry-After` header returned).
- `500 Server Error`: Sanitized error response if database write fails.

---

## 5. Abuse Prevention & Security

1. **Sliding-Window Rate Limiting**: Maximum 10 requests per minute per IP to prevent spam or bot flooding.
2. **Input Length Constraints**: Comments are capped at 2,000 characters to prevent database bloat and buffer attacks.
3. **Payload Sanitization**: HTML tags and script injections in comments are stripped or neutralized.
4. **Zero Confidential Data**: Users are cautioned not to include Aadhaar numbers, PAN numbers, or medical records in feedback comments.
5. **Safe Logging**: Feedback submissions do not log authorization tokens or PII to application logs.

---

## 6. Feedback Triage & Quality Loop

Submitted feedback feeds into quality improvements:
1. **Verification Queue**: Submissions tagged `accuracy` or `outdated_info` trigger automated alerts for domain verifiers.
2. **Catalog Updates**: Procedural steps in `lib/catalog/services.ts` and `source_references` are audited against verified user reports.
3. **Uncertainty Calibration**: Recurring missing-step reports for specific districts inform uncertainty labeling ("Location-dependent" badges) in `lib/sources/verifier.ts`.
