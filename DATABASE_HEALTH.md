# TheervuAI Database Health Audit & Architecture

This document contains the structural audit of the PostgreSQL schema managed via Supabase and Prisma ORM.

---

## 1. Schema Overview

The database contains **11 normalized tables** defined in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) and [`supabase/migrations/002_reminders.sql`](supabase/migrations/002_reminders.sql):

| Table | Purpose | Primary Key | Foreign Keys | RLS Enabled |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | User profiles synced from Google OAuth | `id` (UUID) | `auth.users(id)` ON DELETE CASCADE | Yes |
| `services` | Verified civic & institutional services | `id` (UUID) | None | Yes (Public Read) |
| `source_references` | Official verification sources | `id` (UUID) | None | Yes (Public Read) |
| `conversations` | AI chat session threads | `id` (UUID) | `profiles(id)` ON DELETE CASCADE | Yes |
| `messages` | Chat messages per conversation | `id` (UUID) | `conversations(id)` ON DELETE CASCADE | Yes |
| `preparation_plans` | Before You Go visit preparation plans | `id` (UUID) | `profiles(id)`, `services(id)` | Yes |
| `preparation_items` | Checklist items per plan | `id` (UUID) | `preparation_plans(id)` ON DELETE CASCADE | Yes |
| `documents` | Uploaded document metadata | `id` (UUID) | `profiles(id)` ON DELETE CASCADE | Yes |
| `saved_items` | Bookmarked plans & services | `id` (UUID) | `profiles(id)` ON DELETE CASCADE | Yes |
| `feedback` | User ratings & suggestions | `id` (UUID) | `profiles(id)` ON DELETE SET NULL | Yes |
| `reminders` | User-controlled deadlines & visit dates | `id` (UUID) | `profiles(id)`, `preparation_plans(id)` | Yes |

---

## 2. Relationships & Cascades

1. **User Deletion**: If a user deletes their account in `auth.users`, cascade deletes automatically remove their record in `profiles`, all `conversations`, `messages`, `preparation_plans`, `preparation_items`, `documents`, `saved_items`, and `reminders`.
2. **Plan Deletion**: Deleting a `preparation_plan` cascades automatically to delete all child `preparation_items`, while setting `reminders.target_plan_id` to `NULL` (preserving the user's scheduled calendar event).
3. **Conversation Deletion**: Deleting a `conversation` cascades automatically to delete all child `messages`.
4. **Service Deletion**: If a civic service is deprecated or removed, `preparation_plans.service_id` is set to `NULL` (ON DELETE SET NULL), preserving the user's customized checklist intact.

---

## 3. Database Indexes

To ensure high performance under load, targeted B-tree indexes are configured:
- `idx_profiles_email` ON `profiles(email)`
- `idx_services_category` ON `services(category)`
- `idx_services_slug` ON `services(slug)`
- `idx_conversations_user_id` ON `conversations(user_id)`
- `idx_conversations_created_at` ON `conversations(created_at desc)`
- `idx_messages_conversation_id` ON `messages(conversation_id)`
- `idx_messages_created_at` ON `messages(created_at asc)`
- `idx_preparation_plans_user_id` ON `preparation_plans(user_id)`
- `idx_preparation_items_plan_id` ON `preparation_items(preparation_plan_id)`
- `idx_documents_user_id` ON `documents(user_id)`
- `idx_saved_items_user` ON `saved_items(user_id, item_type)`
- `idx_reminders_user_id` ON `reminders(user_id)`
- `idx_reminders_scheduled_for` ON `reminders(scheduled_for asc)`

---

## 4. Automated Triggers

- **`handle_new_user()`**:
  Trigger `on_auth_user_created` fires `AFTER INSERT OR UPDATE ON auth.users`.
  Automatically provisions a record in `public.profiles` using Google profile metadata (`full_name`, `email`, `avatar_url`).
  Includes `ON CONFLICT (id) DO UPDATE` to gracefully handle re-authentication and profile syncs.

---

## 5. Row-Level Security (RLS) Verification

- **Services & Sources**: Publicly readable (`using (true)`) by anonymous and authenticated visitors alike.
- **Profiles**: Restricted to `auth.uid() = id`.
- **Conversations & Messages**: Only the creator can view, insert, update, or delete. Messages enforce existence checks against `conversations.user_id = auth.uid()`.
- **Preparation Plans & Items**: Users can only read, write, or toggle items belonging to their own plans.
- **Documents & Storage**: Uploaded files and metadata are private to `auth.uid() = user_id`.
- **Reminders**: Strictly user-isolated (`auth.uid() = user_id`). Users cannot read, edit, or delete reminders belonging to another user.
- **IDOR Protection**: All server routes (`/api/preparation-plans/[id]`, `/api/conversations/[id]`, `/api/documents/[id]`, `/api/reminders/[id]`) enforce `user_id = user.id` in addition to RLS policies.

---

## 6. Audit & Health Check Results

- **Schema Syntax**: Valid PostgreSQL 14+ syntax verified across migration 001 and 002.
- **Seed Data**: Valid UUIDs, valid foreign-key defaults, verified government URLs.
- **Connection Health**: Verified via `/api/health` responding with `status: "reachable"`.
- **Phase 4 Additions**: `002_reminders.sql` added with enum checks on `reminder_type` (`appointment`, `deadline`, `renewal`, `follow_up`) and `priority` (`low`, `medium`, `high`, `urgent`).

