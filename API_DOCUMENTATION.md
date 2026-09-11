# TheervuAI REST API Documentation

All API endpoints are hosted under `/api/*` and return JSON responses.

---

## 1. Standard Response & Error Status Codes

| Status Code | Description | Typical Scenario |
|---|---|---|
| `200 OK` | Success | Request succeeded with payload |
| `201 Created` | Created | Resource successfully created |
| `400 Bad Request` | Validation Error | Missing parameters, invalid types, or unsupported file extensions |
| `401 Unauthorized` | Unauthenticated | User session missing or expired |
| `403 Forbidden` | Access Denied | Accessing records owned by another user (IDOR prevention) |
| `413 Payload Too Large` | Size Exceeded | File upload exceeds 10MB limit |
| `422 Unprocessable` | Unprocessable Content | Malformed input or safety violation |
| `429 Too Many Requests` | Rate Limit Exceeded | Client exceeded sliding-window limit (`Retry-After` header sent) |
| `500 Server Error` | Internal Server Error | Unexpected failure (sanitized; no secrets or stack traces leaked) |
| `502 / 503 Provider Error` | Upstream Failure | External AI provider or storage failure (handled with safe fallback) |

---

## 2. Rate Limiting & Abuse Protection

Rate limits are enforced on all public AI and document upload endpoints:
- `X-RateLimit-Limit`: Maximum requests allowed per 60-second sliding window.
- `X-RateLimit-Remaining`: Remaining request quota.
- `Retry-After`: Seconds to wait before making the next request if rate-limited (`429`).

---

## 3. AI Endpoints

### `POST /api/ai/chat`
Ask questions and receive structured, plain-language guidance.

- **Rate Limit**: 20 requests / min
- **Request Body**:
  ```json
  {
    "question": "What documents are required to renew my driving licence in Chennai?",
    "conversationId": "optional-uuid",
    "preferredLanguage": "en"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "summary": "Clear next steps for your inquiry.",
    "answer": "To renew your driving licence at the RTO, you will need...",
    "steps": [
      "Gather Form 1A medical certificate.",
      "Submit application on Parivahan portal.",
      "Book biometric slot at your local RTO."
    ],
    "sources": [
      {
        "title": "Parivahan Sewa",
        "url": "https://parivahan.gov.in/",
        "authority": "MoRTH"
      }
    ],
    "isEmergency": false,
    "conversationId": "uuid"
  }
  ```

---

### `POST /api/ai/prepare`
Generate a structured "Before You Go" preparation plan with dynamic checklists.

- **Rate Limit**: 10 requests / min
- **Request Body**:
  ```json
  {
    "task": "Passport Re-issue for adult",
    "location": "Tamil Nadu",
    "serviceSlug": "passport-reissue",
    "preferredLanguage": "en"
  }
  ```
- **Response (`200 OK`) — Section 6 Structured Schema**:
  ```json
  {
    "id": "optional-saved-plan-uuid",
    "title": "Passport Re-issue Preparation Plan",
    "summary": "Step-by-step guidance for renewing your passport at Passport Seva Kendra.",
    "steps": [
      {
        "title": "Fill Form 1 on Passport Seva Portal",
        "description": "Complete application and pay fee online.",
        "required": true
      },
      {
        "title": "Arrive 15 minutes prior to appointment slot",
        "description": "Carry printed ARN receipt.",
        "required": true
      }
    ],
    "documents": [
      {
        "name": "Original Old Passport",
        "description": "Self-attested copies of first and last 2 pages.",
        "mandatory": true
      },
      {
        "name": "Current Address Proof",
        "description": "Aadhaar, utility bill, or bank passbook.",
        "mandatory": true
      }
    ],
    "fees": [
      {
        "name": "Standard Renewal (36 pages)",
        "amount": "Rs. 1,500",
        "notes": "Payable online during appointment booking"
      }
    ],
    "timing": {
      "estimatedDuration": "2 to 3 hours",
      "bestTimeToVisit": "Morning slots (9:00 AM - 11:30 AM)"
    },
    "sections": [
      {
        "title": "Required Documents & Identification",
        "items": [...]
      }
    ],
    "warnings": [
      "Fees and quotas are subject to Ministry of External Affairs updates."
    ],
    "sources": [...]
  }
  ```

---

### `POST /api/ai/explain-document`
Analyze and explain notices, forms, or healthcare documents.

- **Rate Limit**: 10 requests / min
- **Request Body**:
  ```json
  {
    "extractedText": "Discharge summary text...",
    "documentType": "medical",
    "preferredLanguage": "en"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "documentType": "medical",
    "plainLanguageSummary": "Plain language breakdown of the document.",
    "keyDetails": [
      { "label": "Document Status", "value": "Ready for Review" }
    ],
    "actionItems": [
      "Keep the original physical document safe.",
      "Verify any appointment or validity dates."
    ],
    "questionsToAsk": [
      "What is the standard processing time and acknowledgment receipt protocol?"
    ],
    "warnings": [
      "Do not laminate or write over original official certificates."
    ],
    "disclaimer": "This explanation is for informational guidance only..."
  }
  ```

---

## 4. Document Storage & Upload

### `POST /api/documents/upload`
Upload a document (PDF, PNG, JPG, WebP) to the private `documents` bucket.

- **Rate Limit**: 10 uploads / min
- **Headers**: `Content-Type: multipart/form-data`
- **Body**:
  - `file`: File binary (max 10MB)
  - `documentType`: string (e.g. `medical`, `legal`, `government`)
- **Response (`200 OK`)**:
  ```json
  {
    "id": "uuid",
    "fileName": "passport_notice.pdf",
    "fileSize": 245120,
    "fileType": "application/pdf",
    "status": "completed",
    "extractedText": "..."
  }
  ```

### `GET /api/documents/[id]`
Fetch document metadata verifying user ownership.

### `DELETE /api/documents/[id]`
Delete document record and associated storage file.

---

## 5. Preparation Plans & Dynamic Checklists

### `GET /api/preparation-plans`
Fetch all plans created by the authenticated user.

### `GET /api/preparation-plans/[id]`
Fetch a specific plan with its checklist items (verifies user ownership).

### `DELETE /api/preparation-plans/[id]`
Delete a plan and cascade delete its checklist items.

### `PATCH /api/preparation-plans/[id]/items`
Toggle or update the completion status of a checklist item.
- **Request Body**:
  ```json
  {
    "itemId": "uuid",
    "isCompleted": true
  }
  ```

---

## 6. Conversations & History

- `GET /api/conversations`: List user's conversations ordered by `created_at desc`.
- `POST /api/conversations`: Create a new conversation session.
- `GET /api/conversations/[id]`: Fetch conversation and messages with ownership check.
- `DELETE /api/conversations/[id]`: Delete conversation and messages.
- `POST /api/conversations/[id]/messages`: Append message to conversation.

---

## 7. Civic Services Catalog

- `GET /api/services`: List services with optional `?category=` and `?search=` filters.
- `GET /api/services/[slug]`: Fetch detailed service guide by unique slug.

---

## 8. Saved Items & Bookmarks

- `GET /api/saved-items`: List saved items for authenticated user.
- `POST /api/saved-items`: Save/bookmark a plan, service, or document.
- `DELETE /api/saved-items/[id]`: Remove a saved item (ownership verified).

---

## 9. System Diagnostics

### `GET /api/health`
System status endpoint returning connectivity health without exposing secrets:
```json
{
  "status": "healthy",
  "timestamp": "2026-09-11T15:30:00.000Z",
  "database": { "status": "connected" },
  "auth": { "status": "configured" },
  "ai": {
    "provider": "Google Gemini",
    "status": "live",
    "model": "gemini-3.8-flash"
  }
}
```

---

## 10. Phase 4: Multimodal Document Intelligence

### `POST /api/ai/document-analyze`
Analyze uploaded documents (PDF, PNG, JPG, WebP) across 9 specialized workflows with Step 4 structured extraction.

- **Rate Limit**: 10 requests / min
- **Request Body**:
  ```json
  {
    "fileBase64": "JVBERi0xLjQKJ...",
    "mimeType": "application/pdf",
    "workflow": "extract_info",
    "language": "en",
    "userQuery": "What is the expiration date on this certificate?"
  }
  ```
- **Supported Workflows**: `explain`, `summarize`, `extract_info`, `required_actions`, `missing_info`, `important_dates`, `qa`, `difficult_terms`, `next_steps`.
- **Response (`200 OK`)**:
  ```json
  {
    "workflow": "extract_info",
    "language": "en",
    "analysis": "Structured plain-language analysis of document...",
    "keyInformation": [
      { "label": "Application ID", "value": "TN-2026-89412", "confidence": "high" }
    ],
    "importantDates": [
      { "event": "Document Expiry", "date": "2027-03-31", "significance": "Renew before date" }
    ],
    "requiredActions": [
      { "step": "Submit signed copy to Taluk office", "deadline": "Within 30 days" }
    ],
    "missingInformation": [
      "Notary seal was not detected on page 2."
    ],
    "warnings": [
      "Do not laminate official document before endorsement."
    ],
    "verificationNotes": [
      "Certificate matches Government of Tamil Nadu digital signature format."
    ],
    "executionTimeMs": 1420
  }
  ```

---

## 11. Phase 4: Regional Languages & Translation

### `POST /api/translate`
Translate civic guidance and preparation plans across 11 Indian regional languages, preserving dates, URLs, and IDs.

- **Rate Limit**: 20 requests / min
- **Request Body**:
  ```json
  {
    "text": "Please bring your original Aadhaar card and 2 photocopies to the RTO.",
    "targetLanguage": "ta",
    "sourceLanguage": "en"
  }
  ```
- **Supported Languages**: `en` (English), `ta` (Tamil), `hi` (Hindi), `te` (Telugu), `kn` (Kannada), `ml` (Malayalam), `bn` (Bengali), `mr` (Marathi), `gu` (Gujarati), `pa` (Punjabi), `or` (Odia).
- **Response (`200 OK`)**:
  ```json
  {
    "translatedText": "தயவுசெய்து உங்கள் அசல் ஆதார் அட்டை மற்றும் 2 நகல்களை RTO-விற்கு கொண்டு வாருங்கள்.",
    "detectedLanguage": "en",
    "targetLanguage": "ta",
    "cached": false
  }
  ```

---

## 12. Phase 4: Modular Voice System

### `POST /api/voice/transcribe`
Transcribe spoken audio input from users into text.

- **Rate Limit**: 15 requests / min
- **Request Body**:
  ```json
  {
    "audioBase64": "UklGRi...",
    "mimeType": "audio/webm",
    "language": "ta"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "transcript": "எனக்கு புதிய ஓட்டுநர் உரிமம் தேவை",
    "confidence": 0.94,
    "language": "ta"
  }
  ```

### `POST /api/voice/synthesize`
Synthesize text into clear speech audio for users with reading difficulties.

- **Rate Limit**: 15 requests / min
- **Request Body**:
  ```json
  {
    "text": "உங்கள் பாஸ்போர்ட் விண்ணப்பம் சமர்ப்பிக்கப்பட்டது.",
    "language": "ta",
    "gender": "female"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "audioBase64": "UklGRi...",
    "mimeType": "audio/mp3",
    "sampleRate": 24000
  }
  ```

---

## 13. Phase 4: Reminders & Deadlines

### `GET /api/reminders`
List all active reminders for the authenticated user (sorted by `due_date asc`).

### `POST /api/reminders`
Create a user-controlled reminder linked to a visit plan or document deadline.

- **Request Body**:
  ```json
  {
    "title": "Visit RTO Anna Nagar for driving test",
    "description": "Slot booked for 10:30 AM. Carry Form 1A and fee receipt.",
    "dueDate": "2026-09-18T10:30:00Z",
    "reminderType": "appointment",
    "priority": "high",
    "targetPlanId": "optional-uuid"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "id": "uuid",
    "title": "Visit RTO Anna Nagar for driving test",
    "dueDate": "2026-09-18T10:30:00Z",
    "isCompleted": false,
    "priority": "high",
    "createdAt": "2026-09-11T16:00:00Z"
  }
  ```

### `PATCH /api/reminders/[id]`
Toggle completion status or edit due date/title of a reminder (user ownership verified).

### `DELETE /api/reminders/[id]`
Delete a reminder (user ownership verified).

---

## 14. Phase 4: Feedback & Quality Reporting

### `POST /api/feedback`
Submit corrections, missing counter steps, outdated fees, or satisfaction ratings.

- **Rate Limit**: 10 submissions / min
- **Request Body**:
  ```json
  {
    "feedbackType": "missing_step",
    "targetType": "plan",
    "targetId": "optional-plan-uuid",
    "rating": 5,
    "comments": "Ensure you bring 2 passport photos in blue background.",
    "metadata": { "district": "Madurai" }
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Thank you for your feedback. Our verification team will review this report."
  }
  ```

