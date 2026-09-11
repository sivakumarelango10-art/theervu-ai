# Application Status Tracking Specification

This document details TheervuAI's private application status tracking feature, lifecycle management, and clear boundaries regarding government APIs.

---

## 1. Ground Truth on Government Status Tracking

Citizens frequently apply for passports, licences, ration cards, and welfare schemes on diverse departmental portals. However:
- **No Public Live APIs**: Indian government portals (Parivahan, Passport Seva, e-District, UIDAI) do not offer public, unauthenticated APIs for third-party automated status polling.
- **Truth In Advertising**: TheervuAI does **not** simulate or claim fake automated status feeds from government servers.
- **Purpose of Tracking**: TheervuAI provides a **personal, private application management tracker** to help citizens store their Application Reference Number (ARN), record submission dates, track next action deadlines (e.g. biometric appointments), and update lifecycle statuses as they progress.

---

## 2. Supported Lifecycle States

The tracker supports 8 standard lifecycle states:

| Status Code | Display Label | Description |
| :--- | :--- | :--- |
| `draft` | Draft | Citizen is gathering documents and preparing submission. |
| `submitted` | Submitted | Form submitted on official portal or at counter; ARN received. |
| `under_review` | Under Review | Application under scrutiny or field verification (e.g. VAO/Police inquiry). |
| `info_requested` | Action Required | Department requires additional documents, clarification, or re-upload. |
| `approved` | Approved | Request approved by sanctioning authority (e.g. Tahsildar/RTO). |
| `completed` | Completed / Issued | Physical or digital card/certificate issued and received. |
| `rejected` | Rejected | Application rejected with grounds for appeal or resubmission. |
| `unknown` | Status Unclear | Awaiting update from department. |

---

## 3. Privacy & Security Safeguards

1. **Row Level Security (RLS)**: Enforced via Supabase PostgreSQL policy (`auth.uid() = user_id`). No user can view, edit, or delete another user's tracked applications.
2. **Confidential Reference Numbers**: Reference numbers are never shared publicly, included in public URLs, or sent to third-party tracking services.
3. **Telemetry Redaction**: `lib/observability/metrics.ts` automatically strips reference numbers, Aadhaar patterns, and emails before telemetry storage.

---

## 4. API Endpoints

- `GET /api/applications`: Lists all tracked applications belonging to the authenticated user.
- `POST /api/applications`: Creates a new application tracker record.
- `PATCH /api/applications/:id`: Updates status, next action deadline, or notes.
- `DELETE /api/applications/:id`: Removes the tracker from the user's account.
