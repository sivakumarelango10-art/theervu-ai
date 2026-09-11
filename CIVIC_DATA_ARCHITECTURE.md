# Civic Data Architecture & Schema Specification

This document details the schema design, normalization rules, and data structures powering TheervuAI's verified civic intelligence catalog.

---

## 1. Design Principles

1. **Relational Over Monolithic JSON**: Key administrative and query attributes (`state`, `district`, `department`, `authority`, `office_type`, `appointment_required`, `status`) are indexed top-level relational columns.
2. **Structured Nested Collections**: Complex multi-item attributes (`required_documents`, `application_steps`, `fees`, `eligibility`) use typed JSONB arrays with strict TypeScript interfaces.
3. **Auditability & Provenance**: Every record contains verification metadata: `official_source_url`, `source_name`, `source_type`, `last_verified_at`, and `verification_status`.
4. **Zero-Fabrication Fallback**: In the absence of a live Supabase connection, the application deterministically falls back to `SEED_SERVICES` (`lib/data/services.ts`), guaranteeing high-fidelity operation offline and in development.

---

## 2. Table: `public.services`

```sql
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  department TEXT NOT NULL,
  authority TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'All India',
  district TEXT,
  office_type TEXT NOT NULL,
  official_url TEXT NOT NULL,
  official_source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'central_gov' CHECK (source_type IN (
    'central_gov', 'state_gov', 'municipal', 'statutory'
  )),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN (
    'verified', 'needs_confirmation', 'location_dependent'
  )),
  eligibility JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  application_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  appointment_required BOOLEAN NOT NULL DEFAULT false,
  fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  expected_timeline TEXT NOT NULL DEFAULT 'Varies',
  important_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  location_dependency TEXT NOT NULL DEFAULT 'none' CHECK (location_dependency IN (
    'none', 'state', 'district', 'municipal'
  )),
  disclaimer TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Key Column Definitions

| Field | Type | Description |
| :--- | :--- | :--- |
| `slug` | `TEXT` | URL-friendly identifier for direct routing (`/services?slug=...`). |
| `state` | `TEXT` | Applicable state name (e.g. `Tamil Nadu`, `Karnataka`) or `All India`. |
| `office_type` | `TEXT` | Physical facility where citizen must report (e.g. `Passport Seva Kendra`, `Taluk Office`). |
| `official_source_url` | `TEXT` | Canonical `.gov.in`/`.nic.in` portal URL where rules are maintained. |
| `verification_status` | `TEXT` | Status indicator: `verified`, `needs_confirmation`, or `location_dependent`. |
| `required_documents` | `JSONB` | Array of `{ name, description, mandatory: boolean, alternatives?: string[] }`. |
| `application_steps` | `JSONB` | Ordered array of `{ stepNumber, title, description, isOnline: boolean }`. |
| `fees` | `JSONB` | Array of `{ name, amount, paymentMode }`. |
| `appointment_required` | `BOOLEAN` | Whether prior slot booking is mandatory before visiting. |

---

## 3. Table: `public.application_trackers`

```sql
CREATE TABLE IF NOT EXISTS public.application_trackers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  authority TEXT,
  reference_number TEXT,
  portal_url TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'draft', 'submitted', 'under_review', 'info_requested', 'approved', 'rejected', 'completed', 'unknown'
  )),
  submission_date DATE,
  last_status_date TIMESTAMPTZ DEFAULT now(),
  next_action TEXT,
  next_action_deadline DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Security & Access Control
- Row Level Security (RLS) is strictly enforced: `auth.uid() = user_id`.
- Reference numbers and personal notes are inaccessible across user boundaries.

---

## 4. Query & Search Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_services_category_state ON public.services(category, state);
CREATE INDEX IF NOT EXISTS idx_services_slug ON public.services(slug);
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_app_trackers_user_status ON public.application_trackers(user_id, status);
```
