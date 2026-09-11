# Administrative Governance & Content Management Guide

This guide details the administrative authentication model, content management endpoints, and verified service curation workflows in TheervuAI.

---

## 1. Administrative Authentication Model

Administrative access is managed through `lib/admin/auth.ts`:

1. **Profile Role Verification**: The user's account must exist in `public.profiles` with `role = 'admin'`.
2. **Environment Variable Override**: If the user's verified email address is listed in the `ADMIN_EMAILS` environment variable (comma-separated list), they are automatically granted admin authorization.
3. **Dual Verification**: Both methods require a valid, authenticated Supabase session (`auth.getUser()`).

---

## 2. Admin API Endpoints

### 2.1 Manage Services Registry
- **Endpoint**: `GET /api/admin/services`
  - Returns all services in `public.services` including archival and draft records with creator metadata.
  - Requires: Admin authentication (HTTP 401 if not logged in, HTTP 403 if not admin).

- **Endpoint**: `POST /api/admin/services`
  - Publishes or updates a verified service record.
  - Validates full payload schema against `adminServiceSchema` via Zod.
  - Automatically timestamps `last_verified_at` and records `verified_by`.

### 2.2 Review Citizen Feedback
- **Endpoint**: `GET /api/admin/feedback`
  - Returns citizen satisfaction ratings, helpfulness flags, and qualitative comments from `public.feedback`.

---

## 3. Curation Standards for Verified Services

When adding or updating services in the verified registry, curators must enforce:
1. **Official URL**: The URL must point to a legitimate `.gov.in`, `.nic.in`, or designated statutory portal.
2. **Document Segregation**: Clearly demarcate mandatory documents from optional alternatives.
3. **Fee Transparency**: State the exact statutory fee and accepted payment modes (e.g. `UPI`, `e-Challan`, `Net Banking`, `Cash at e-Sevai`).
4. **Counter Guidance**: Describe what happens at physical desks (e.g., token queue, biometric capture, document verification officer).
5. **Jurisdictional Flags**: Clearly indicate if the service is applicable pan-India or restricted to specific states/districts.
