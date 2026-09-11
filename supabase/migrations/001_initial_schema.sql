-- ==============================================================================
-- TheervuAI Initial Schema Migration
-- ==============================================================================

-- 1. PROFILES TABLE (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  preferred_language text default 'en',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for profile queries
create index if not exists idx_profiles_email on public.profiles(email);

-- Trigger for new user signup (Google OAuth & Auth)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    email = coalesce(excluded.email, profiles.email),
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_new_user();

-- 2. SERVICES CATALOG (Civic & Institutional services)
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category text not null,
  description text not null,
  authority text not null,
  state text default 'All India',
  official_url text not null,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_services_category on public.services(category);
create index if not exists idx_services_slug on public.services(slug);

-- 3. SOURCE REFERENCES (Official verification sources)
create table if not exists public.source_references (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  authority text not null,
  category text not null,
  verification_status text default 'verified' check (verification_status in ('verified', 'needs_confirmation', 'reference')),
  last_verified_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text default 'general',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_conversations_user_id on public.conversations(user_id);
create index if not exists idx_conversations_created_at on public.conversations(created_at desc);

-- 5. MESSAGES TABLE
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);

-- 6. PREPARATION PLANS (Before You Go)
create table if not exists public.preparation_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  title text not null,
  purpose text,
  location text,
  summary text,
  status text default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_preparation_plans_user_id on public.preparation_plans(user_id);

-- 7. PREPARATION CHECKLIST ITEMS
create table if not exists public.preparation_items (
  id uuid primary key default gen_random_uuid(),
  preparation_plan_id uuid not null references public.preparation_plans(id) on delete cascade,
  item_type text default 'document' check (item_type in ('document', 'action', 'verification')),
  title text not null,
  description text,
  is_required boolean default true,
  is_completed boolean default false,
  priority integer default 1,
  source_url text,
  created_at timestamptz default now()
);

create index if not exists idx_preparation_items_plan_id on public.preparation_items(preparation_plan_id);

-- 8. DOCUMENTS TABLE (User-uploaded files for explanation)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  file_type text not null,
  file_size integer not null,
  processing_status text default 'pending' check (processing_status in ('pending', 'uploading', 'processing', 'completed', 'failed')),
  extracted_text text,
  analysis_result jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_documents_user_id on public.documents(user_id);

-- 9. SAVED ITEMS (Bookmarks & Pins)
create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('plan', 'document', 'service', 'conversation')),
  item_reference_id text not null,
  title text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_saved_items_user on public.saved_items(user_id, item_type);

-- 10. FEEDBACK TABLE
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  category text not null,
  rating integer check (rating >= 1 and rating <= 5),
  message text not null,
  page_context text,
  created_at timestamptz default now()
);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.source_references enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.preparation_plans enable row level security;
alter table public.preparation_items enable row level security;
alter table public.documents enable row level security;
alter table public.saved_items enable row level security;
alter table public.feedback enable row level security;

-- Profiles: user can read/update their own profile
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Services: public read
create policy "Services are viewable by everyone"
  on public.services for select
  using (true);

-- Source references: public read
create policy "Source references are viewable by everyone"
  on public.source_references for select
  using (true);

-- Conversations: user can CRUD their own
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages: user can access messages of their own conversations
create policy "Users can view messages from own conversations"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

create policy "Users can insert messages to own conversations"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.conversations
      where conversations.id = messages.conversation_id
      and conversations.user_id = auth.uid()
    )
  );

-- Preparation Plans: user can CRUD their own
create policy "Users can view own preparation plans"
  on public.preparation_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own preparation plans"
  on public.preparation_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own preparation plans"
  on public.preparation_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete own preparation plans"
  on public.preparation_plans for delete
  using (auth.uid() = user_id);

-- Preparation Items: user can CRUD items belonging to their plans
create policy "Users can view own preparation items"
  on public.preparation_items for select
  using (
    exists (
      select 1 from public.preparation_plans
      where preparation_plans.id = preparation_items.preparation_plan_id
      and preparation_plans.user_id = auth.uid()
    )
  );

create policy "Users can insert own preparation items"
  on public.preparation_items for insert
  with check (
    exists (
      select 1 from public.preparation_plans
      where preparation_plans.id = preparation_items.preparation_plan_id
      and preparation_plans.user_id = auth.uid()
    )
  );

create policy "Users can update own preparation items"
  on public.preparation_items for update
  using (
    exists (
      select 1 from public.preparation_plans
      where preparation_plans.id = preparation_items.preparation_plan_id
      and preparation_plans.user_id = auth.uid()
    )
  );

create policy "Users can delete own preparation items"
  on public.preparation_items for delete
  using (
    exists (
      select 1 from public.preparation_plans
      where preparation_plans.id = preparation_items.preparation_plan_id
      and preparation_plans.user_id = auth.uid()
    )
  );

-- Documents: user can CRUD their own documents
create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Saved Items: user can CRUD their own
create policy "Users can view own saved items"
  on public.saved_items for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved items"
  on public.saved_items for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved items"
  on public.saved_items for delete
  using (auth.uid() = user_id);

-- Feedback: anyone can submit feedback; users see only their own
create policy "Anyone can submit feedback"
  on public.feedback for insert
  with check (true);

create policy "Users can view own feedback"
  on public.feedback for select
  using (auth.uid() = user_id);

-- ==============================================================================
-- STORAGE BUCKET POLICIES (documents bucket)
-- ==============================================================================
-- In Supabase dashboard or migrations:
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false) on conflict do nothing;
