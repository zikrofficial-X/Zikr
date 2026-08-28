create extension if not exists "pgcrypto";

DO $$ BEGIN
  CREATE TYPE role AS ENUM ('user','admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE favorite_item_type AS ENUM ('quran','hadith','story','scholar','dua');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE progress_scope AS ENUM ('quran','hadith','stories');
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  CREATE TYPE reminder_type AS ENUM ('prayer','quran','adhkar','fasting','zakat');
EXCEPTION WHEN duplicate_object THEN null; END $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'ar',
  role role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_type favorite_item_type not null,
  item_ref text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists favorites_user_item_unique on favorites(user_id,item_type,item_ref);

create table if not exists reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  scope progress_scope not null,
  ref text not null,
  progress_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create unique index if not exists reading_progress_user_scope_ref_unique on reading_progress(user_id,scope,ref);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type reminder_type not null,
  schedule_json jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table favorites enable row level security;
alter table reading_progress enable row level security;
alter table reminders enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

drop policy if exists "favorites_owner_all" on favorites;
drop policy if exists "reading_progress_owner_all" on reading_progress;
drop policy if exists "reminders_owner_all" on reminders;
create policy "favorites_owner_all" on favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reading_progress_owner_all" on reading_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_owner_all" on reminders for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)), 'ar')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

drop policy if exists "public_assets_read" on storage.objects;
drop policy if exists "public_assets_admin_write" on storage.objects;
create policy "public_assets_read" on storage.objects for select using (bucket_id = 'public-assets');
create policy "public_assets_admin_write" on storage.objects for all
using (bucket_id = 'public-assets' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (bucket_id = 'public-assets' and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
