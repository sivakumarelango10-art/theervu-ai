-- ==============================================================================
-- TheervuAI Migration 004: Notifications + Application Status History
-- ==============================================================================

-- 1. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in (
    'application_reminder', 'document_expiry', 'service_update',
    'preparation_reminder', 'system_info', 'feedback_response'
  )),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  title text not null,
  body text not null,
  action_url text,
  action_label text,
  related_record_id text,
  related_record_type text,
  is_read boolean not null default false,
  delivery_status text not null default 'delivered' check (delivery_status in (
    'pending', 'delivered', 'read', 'failed', 'provider_unavailable'
  )),
  delivered_at timestamptz,
  read_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read) where is_read = false;
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);

-- 2. NOTIFICATION PREFERENCES TABLE
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  in_app boolean not null default true,
  email boolean not null default false,
  sms boolean not null default false,
  push_enabled boolean not null default false,
  application_reminders boolean not null default true,
  document_expiry boolean not null default true,
  service_updates boolean not null default false,
  preparation_reminders boolean not null default true,
  system_info boolean not null default true,
  reminder_lead_time_days integer not null default 3 check (reminder_lead_time_days between 1 and 30),
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. APPLICATION STATUS HISTORY — add column to existing table
alter table public.application_trackers
  add column if not exists status_history jsonb not null default '[]'::jsonb;

-- Update trigger to auto-append status history on status change
create or replace function public.track_application_status_history()
returns trigger as $$
declare
  history_entry jsonb;
begin
  -- Only append to history when status changes
  if OLD.status IS DISTINCT FROM NEW.status then
    history_entry := jsonb_build_object(
      'from', OLD.status,
      'to', NEW.status,
      'changed_at', now()::text,
      'note', coalesce(NEW.notes, '')
    );
    NEW.status_history := OLD.status_history || history_entry;
    NEW.last_status_date := now();
  end if;
  NEW.updated_at := now();
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_application_status_change on public.application_trackers;
create trigger on_application_status_change
  before update on public.application_trackers
  for each row execute function public.track_application_status_history();

-- ==============================================================================
-- RLS POLICIES
-- ==============================================================================

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- Notifications: users can only see and manage their own
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- System can insert notifications (service role or backend only)
create policy "System can insert notifications"
  on public.notifications for insert
  with check (true);

-- Notification preferences: user-isolated
create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can upsert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id);
