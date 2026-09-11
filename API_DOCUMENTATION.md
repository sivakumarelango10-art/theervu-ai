# TheervuAI API Documentation

All API endpoints are hosted under `/api/*` and return JSON responses.

---

## 1. Authentication & Headers

- **Protected Routes**: Expect session cookies established by Supabase Auth (`sb-access-token` / `@supabase/ssr`).
- **Rate Limiting**: Rate limits are enforced on AI and file upload endpoints. Responses include:
  - `X-RateLimit-Limit`: Maximum requests per window.
  - `X-RateLimit-Remaining`: Remaining requests.
  - `Retry-After`: Seconds to wait before retry when rate-limited (`429`).

---

## 2. AI Endpoints

### `POST /api/ai/chat`
Ask questions and receive structured, plain-language guidance.

- **Rate Limit**: 25 requests / min
- **Request Body**:
  ```json
  {
    "question": "What documents are required to renew my driving licence?",
    "conversationId": "optional-uuid",
    "preferredLanguage": "en"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "summary": "Clear next steps for your inquiry.",
    "answer": "To renew your driving licence, you will need...",
    "steps": [
      "Gather Form 1A medical fitness certificate.",
      "Book an online appointment on Parivahan Sewa."
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

- **Rate Limit**: 15 requests / min
- **Request Body**:
  ```json
  {
    "task": "Driving licence renewal",
    "location": "Tamil Nadu",
    "serviceSlug": "driving-licence-renewal",
    "preferredLanguage": "en"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "id": "optional-saved-plan-uuid",
    "title": "Driving Licence Renewal Preparation Plan",
    "summary": "...",
    "sections": [
      {
        "title": "Before You Visit the RTO",
        "items": [
          {
            "title": "Original Existing Driving Licence",
            "description": "Must be surrendered for physical inspection",
            "required": true,
            "completed": false,
            "priority": 1
          }
        ]
      }
    ],
    "warnings": ["Ensure fee receipt barcode is legible."],
    "sources": [...]
  }
  ```

---

### `POST /api/ai/explain-document`
Analyze and explain notices, forms, or healthcare documents.

- **Rate Limit**: 15 requests / min
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
    "plainLanguageSummary": "...",
    "keyDetails": [{"label": "Status", "value": "Review Completed"}],
    "actionItems": ["..."],
    "questionsToAsk": ["..."],
    "warnings": ["..."],
    "disclaimer": "This explanation is for informational guidance only..."
  }
  ```

---

## 3. Preparation Plans & Checklists

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

## 4. Conversations & Messages

### `GET /api/conversations`
List conversations for the authenticated user.

### `POST /api/conversations`
Create a new conversation.

### `GET /api/conversations/[id]`
Retrieve conversation and all associated messages.

### `DELETE /api/conversations/[id]`
Delete conversation and cascade messages.

---

## 5. Documents & Uploads

### `POST /api/documents/upload`
Upload document (PDF/PNG/JPG/WebP, max 10MB) to private Supabase Storage.

### `GET /api/documents/[id]`
Fetch document metadata.

### `DELETE /api/documents/[id]`
Delete document record and remove file from storage.

---

## 6. Services & Catalog

### `GET /api/services`
Search and filter civic services.
- Query parameters: `?category=transport&q=licence`

### `GET /api/services/[slug]`
Retrieve single civic service details.

---

## 7. Diagnostics

### `GET /api/health`
Development-safe diagnostic endpoint reporting connectivity status without leaking credentials.
- **Response (`200 OK`)**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-09-11T09:44:27.724Z",
    "ai": {
      "provider": "Google Gemini",
      "status": "configured",
      "model": "gemini-2.0-flash"
    },
    "database": {
      "status": "reachable",
      "servicesCount": 6
    },
    "auth": {
      "provider": "Google OAuth (Supabase)",
      "status": "configured"
    }
  }
  ```
