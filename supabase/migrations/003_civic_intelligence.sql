-- ==============================================================================
-- TheervuAI Phase 6 Migration: Real-World Civic Intelligence & Platform Scalability
-- ==============================================================================

-- 1. ENHANCE SERVICES CATALOG WITH REAL-WORLD SCHEMA
alter table public.services
  add column if not exists district text,
  add column if not exists city text,
  add column if not exists department text,
  add column if not exists office_type text,
  add column if not exists official_source_url text,
  add column if not exists source_name text,
  add column if not exists source_type text default 'official',
  add column if not exists last_verified_at timestamptz default now(),
  add column if not exists verification_status text default 'verified' check (verification_status in ('verified', 'needs_confirmation', 'location_dependent', 'archived')),
  add column if not exists eligibility jsonb default '[]'::jsonb,
  add column if not exists required_documents jsonb default '[]'::jsonb,
  add column if not exists application_steps jsonb default '[]'::jsonb,
  add column if not exists appointment_required boolean default false,
  add column if not exists fees jsonb default '[]'::jsonb,
  add column if not exists expected_timeline text,
  add column if not exists contact_information jsonb default '{}'::jsonb,
  add column if not exists important_notes jsonb default '[]'::jsonb,
  add column if not exists language_availability jsonb default '["en", "ta", "hi"]'::jsonb,
  add column if not exists accessibility_information text,
  add column if not exists emergency_status boolean default false,
  add column if not exists location_dependency text default 'state',
  add column if not exists disclaimer text;

create index if not exists idx_services_state on public.services(state);
create index if not exists idx_services_department on public.services(department);
create index if not exists idx_services_verification on public.services(verification_status);

-- 2. USER-CONTROLLED APPLICATION STATUS TRACKER TABLE
create table if not exists public.application_trackers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  authority text,
  reference_number text,
  portal_url text,
  status text not null default 'submitted' check (status in ('draft', 'submitted', 'under_review', 'info_requested', 'approved', 'rejected', 'completed', 'unknown')),
  submission_date date default current_date,
  last_status_date timestamptz default now(),
  next_action text,
  next_action_deadline date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure column compatibility across migrations and environments
alter table public.application_trackers
  add column if not exists service_id uuid references public.services(id) on delete set null,
  add column if not exists service_name text,
  add column if not exists authority text,
  add column if not exists reference_number text,
  add column if not exists portal_url text,
  add column if not exists last_status_date timestamptz default now(),
  add column if not exists next_action text,
  add column if not exists next_action_deadline date;

create index if not exists idx_application_trackers_user on public.application_trackers(user_id);
create index if not exists idx_application_trackers_status on public.application_trackers(user_id, status);

-- Enable RLS for application trackers
alter table public.application_trackers enable row level security;

create policy "Users can view own application trackers"
  on public.application_trackers for select
  using (auth.uid() = user_id);

create policy "Users can insert own application trackers"
  on public.application_trackers for insert
  with check (auth.uid() = user_id);

create policy "Users can update own application trackers"
  on public.application_trackers for update
  using (auth.uid() = user_id);

create policy "Users can delete own application trackers"
  on public.application_trackers for delete
  using (auth.uid() = user_id);

-- 3. ENHANCE PROFILES WITH USER LOCATION PREFERENCES & ADMIN ROLE
alter table public.profiles
  add column if not exists preferred_state text,
  add column if not exists preferred_district text,
  add column if not exists preferred_city text,
  add column if not exists role text default 'user' check (role in ('user', 'admin'));

-- 4. ENHANCE SOURCE REFERENCES WITH DOMAIN, FRESHNESS & LINKED SERVICE
alter table public.source_references
  add column if not exists domain text,
  add column if not exists organization text,
  add column if not exists source_type text default 'official' check (source_type in ('official', 'state_gov', 'central_gov', 'municipal', 'institutional', 'secondary')),
  add column if not exists review_date timestamptz,
  add column if not exists related_service_id uuid references public.services(id) on delete set null,
  add column if not exists notes text,
  add column if not exists freshness_status text default 'fresh' check (freshness_status in ('fresh', 'recently_verified', 'requires_review', 'outdated'));

create index if not exists idx_source_references_freshness on public.source_references(freshness_status);
