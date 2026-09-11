-- ==============================================================================
-- TheervuAI Phase 4 Migration: User-Controlled Reminders
-- ==============================================================================

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  reminder_type text default 'appointment' check (reminder_type in ('appointment', 'document_expiry', 'checklist', 'follow_up')),
  scheduled_for timestamptz not null,
  status text default 'pending' check (status in ('pending', 'completed', 'dismissed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for efficient querying by user and schedule
create index if not exists idx_reminders_user_id on public.reminders(user_id);
create index if not exists idx_reminders_scheduled_for on public.reminders(scheduled_for asc);

-- Enable Row-Level Security
alter table public.reminders enable row level security;

-- RLS Policies: Users can strictly access, insert, update, and delete their own reminders
create policy "Users can view own reminders"
  on public.reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert own reminders"
  on public.reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reminders"
  on public.reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete own reminders"
  on public.reminders for delete
  using (auth.uid() = user_id);
