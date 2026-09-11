# TheervuAI User-Controlled Reminders Architecture

This document describes the data model, security rules, and user interaction design for the user-controlled reminder system implemented in **TheervuAI** during Phase 4.

---

## 1. Principles of User Control

1. **Explicit User Action Only**: Reminders are never created automatically from AI outputs, chat conversations, or uploaded documents without explicit user confirmation.
2. **User Ownership & Isolation**: Reminders are strictly confidential to the authenticated user. PostgreSQL Row-Level Security (RLS) ensures no other user can inspect, modify, or delete a reminder.
3. **Full Lifecycle Management**: Users can create, view, reschedule, mark completed, or permanently delete reminders at any time.

---

## 2. Database Schema: `public.reminders`

Defined in [`supabase/migrations/002_reminders.sql`](supabase/migrations/002_reminders.sql):

```sql
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
```

### Supported Reminder Types:
- `appointment`: RTO biometric appointments, Passport Kendra slots, hospital visits.
- `document_expiry`: Driving licence grace period, passport renewal window, fitness certificate deadlines.
- `checklist`: Preparation plan reviews before departing for counter visits.
- `follow_up`: Acknowledgment slip tracking, police verification follow-ups.

---

## 3. REST API Endpoints

| Method | Endpoint | Description | Authorization |
|---|---|---|---|
| `GET` | `/api/reminders` | List all reminders for the authenticated user | Authenticated (`auth.uid()`) |
| `POST` | `/api/reminders` | Create a new user-confirmed reminder | Authenticated (`auth.uid()`) |
| `PATCH` | `/api/reminders/[id]` | Update reminder status (`completed`, `dismissed`) | Owner only (`user_id = user.id`) |
| `DELETE` | `/api/reminders/[id]` | Permanently delete a reminder | Owner only (`user_id = user.id`) |

---

## 4. Dashboard Integration

Accessible under the dashboard tab in `/saved`:
- Lists pending and completed reminders.
- Highlights overdue reminders with an amber warning badge.
- Provides one-click completion toggle (`CheckCircle2`).
- Modal to set a new reminder with scheduled date/time, type selector, and optional notes.
