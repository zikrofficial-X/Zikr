-- Restore runtime tables referenced by the application but absent from the
-- canonical migration chain after the legacy schema cleanup.

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  language text not null default 'en',
  read boolean not null default false,
  notification_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text,
  read boolean not null default false,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.memorization_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  surah_number integer not null,
  surah_name text not null,
  total_ayahs integer not null,
  memorized_ayahs integer not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memorization_progress_user_surah unique (user_id, surah_number)
);

alter table public.contacts enable row level security;
alter table public.notifications enable row level security;
alter table public.memorization_progress enable row level security;

drop policy if exists contacts_public_insert on public.contacts;
create policy contacts_public_insert on public.contacts
  for insert with check (true);

drop policy if exists contacts_admin_read on public.contacts;
create policy contacts_admin_read on public.contacts
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists notifications_owner_read on public.notifications;
create policy notifications_owner_read on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists notifications_owner_update on public.notifications;
create policy notifications_owner_update on public.notifications
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists memorization_progress_owner_read on public.memorization_progress;
create policy memorization_progress_owner_read on public.memorization_progress
  for select using (auth.uid() = user_id);

drop policy if exists memorization_progress_owner_insert on public.memorization_progress;
create policy memorization_progress_owner_insert on public.memorization_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists memorization_progress_owner_update on public.memorization_progress;
create policy memorization_progress_owner_update on public.memorization_progress
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists memorization_progress_owner_delete on public.memorization_progress;
create policy memorization_progress_owner_delete on public.memorization_progress
  for delete using (auth.uid() = user_id);

create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index if not exists memorization_progress_user_idx
  on public.memorization_progress(user_id);
