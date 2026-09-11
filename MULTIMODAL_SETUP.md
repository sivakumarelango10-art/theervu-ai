# TheervuAI Multimodal Intelligence & Document Extraction Setup

This document describes the multimodal AI architecture, supported file formats, processing pipelines, and structured extraction schemas implemented in **TheervuAI** during Phase 4.

---

## 1. Supported File Formats & Constraints

| File Type | Extension | MIME Type | Maximum Size |
|---|---|---|---|
| Portable Document Format | `.pdf` | `application/pdf` | 10MB |
| Portable Network Graphics | `.png` | `image/png` | 10MB |
| JPEG Image | `.jpg`, `.jpeg` | `image/jpeg` | 10MB |
| WebP Image | `.webp` | `image/webp` | 10MB |

> [!NOTE]
> Executable binaries, scripts, or untrusted vector graphics (`.exe`, `.sh`, `.bat`, `.svg`, `.html`) are strictly rejected with HTTP `400 Bad Request` prior to AI ingestion or storage.

---

## 2. Supported Document Workflows

TheervuAI supports 9 specialized document workflows via [`lib/ai/multimodal.ts`](lib/ai/multimodal.ts) and `/api/ai/document-analyze`:

1. **Explain Document (`explain`)**: Comprehensive plain-language translation of official notices, court summons, certificates, and medical discharge summaries.
2. **Summarize Document (`summarize`)**: Crisp 2-3 sentence overview of immediate obligations and official purpose.
3. **Extract Important Details (`extract_info`)**: Extracts reference IDs, certificate numbers, applicant names, and department details with confidence ratings (`high`, `medium`, `low`, `unknown`).
4. **Identify Required Actions (`required_actions`)**: Action checklist prioritized by urgency (`high`, `medium`, `low`).
5. **Check Missing Information (`missing_info`)**: Identifies absent signatures, missing stamps, unattached proofs, or unverified fields.
6. **Important Dates & Deadlines (`important_dates`)**: Pinpoints issue dates, hearing dates, fee due dates, and validity periods.
7. **Ask Questions (`qa`)**: Answers specific user questions based strictly on the visible content.
8. **Explain Difficult Terms (`difficult_terms`)**: Clarifies administrative, legal, and medical jargon into everyday terms.
9. **Next-Step Guidance (`next_steps`)**: Generates an actionable sequence for counter visits.

---

## 3. Structured Extraction Schema (Step 4)

All multimodal workflows strictly validate responses against the Zod schema [`advancedDocumentExtractionSchema`](lib/ai/schemas.ts):

```json
{
  "documentType": "Property Tax Demand Notice",
  "summary": "Official municipal tax demand notice issued by Greater Chennai Corporation.",
  "keyInformation": [
    {
      "label": "Assessment Number",
      "value": "09-112-04561",
      "confidence": "high"
    }
  ],
  "importantDates": [
    {
      "label": "Payment Due Date",
      "date": "30-Sep-2026",
      "notes": "Pay before this date to avoid 1% monthly interest penalty"
    }
  ],
  "requiredActions": [
    {
      "title": "Pay property tax online or at e-Seva counter",
      "description": "Visit chennaicorporation.gov.in or zonal office with assessment number.",
      "priority": "high"
    }
  ],
  "missingInformation": [
    "Previous year clearance receipt not attached"
  ],
  "warnings": [
    "Failure to pay by the due date incurs statutory interest."
  ],
  "verificationNotes": [
    "Verify online at chennaicorporation.gov.in before visiting the counter."
  ]
}
```

---

## 4. Multimodal Privacy & Responsible AI Safeguards

1. **No Hallucination of Unknown Details**: The AI is instructed that if an item is absent or obscured, it must return `"Unable to determine"` or `"Not visible in the document"` rather than guessing.
2. **No Legal or Medical Certification**: Document analyses are explicitly labeled as informational assistance. The system never certifies authenticity or validity.
3. **Private In-Memory Processing**: File buffers and base64 strings are processed in memory and never logged to stdout or persistent server logs.
4. **User-Controlled Storage**: Uploaded files stored in the private `'documents'` Supabase bucket are isolated to `users/{user_id}/` paths with RLS.
