# Civic Services Directory Setup & Management Guide

This guide details how the TheervuAI Civic Services Directory operates, how records are seeded into Supabase, and how the deterministic fallback functions.

---

## 1. Directory Structure & Architecture

The civic service directory operates on a 3-layer architecture:

```
[User Interface]
  app/(dashboard)/services/page.tsx
  components/services/ServiceDetailModal.tsx
  components/location/LocationSelector.tsx
         │
         ▼
[API Gateway]
  app/api/services/route.ts
  app/api/services/[slug]/route.ts
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
[Database Mode]             [Fallback Mode]
Supabase PostgreSQL         SEED_SERVICES Catalog
public.services             lib/data/services.ts
```

---

## 2. Multi-Axis Filtering Capabilities

The `/api/services` endpoint and frontend interface support 4 simultaneous query dimensions:

1. **Category**:
   - `Transport & RTO`
   - `Identity & Passports`
   - `Civil Supplies & Welfare`
   - `Healthcare & Welfare`
   - `Revenue & Certificates`
   - `Municipal & Property`
   - `Pensions & Social Security`
   - `Employment & Rights`
2. **State**:
   - Matches national (`All India`) services plus state-specific services (e.g. `Tamil Nadu`, `Karnataka`).
3. **District**:
   - Selectable when a state is active; filters municipal/district services.
4. **Keyword Search**:
   - Matches across service name, description, department, authority, eligibility conditions, and required document names.

---

## 3. Seeding Database Services from Catalog

To populate `public.services` in your Supabase project:
1. Ensure migration `003_civic_intelligence.sql` has executed in Supabase SQL editor.
2. Authenticate as an admin user (role `admin` in `public.profiles` or email in `ADMIN_EMAILS`).
3. You can execute bulk ingestion via `POST /api/admin/services` or directly query `SEED_SERVICES` from `lib/data/services.ts`.

---

## 4. Grounded UI Components

- **`LocationSelector`**: Allows citizens to specify their state and district manually. Does NOT prompt for device GPS or IP location.
- **`ServiceDetailModal`**: Displays comprehensive verified facts, including mandatory vs optional documents, accepted document alternatives, fee breakdowns, counter procedures, and official source links.
- **`Prepare Action`**: Directly passes the verified service slug and title to `/before-you-go`, ensuring the wizard is grounded with verified context.
