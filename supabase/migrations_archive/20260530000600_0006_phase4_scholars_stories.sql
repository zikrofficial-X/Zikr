create table if not exists scholars (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  slug text unique not null,
  bio_ar text,
  bio_en text,
  thumbnail_url text,
  website_url text,
  youtube_url text
);

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  category text not null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table scholars enable row level security;
alter table stories enable row level security;

drop policy if exists "scholars_public_read" on scholars;
drop policy if exists "stories_public_read" on stories;
drop policy if exists "content_admin_write_scholars" on scholars;
drop policy if exists "content_admin_write_stories" on stories;

create policy "scholars_public_read" on scholars for select using (true);
create policy "stories_public_read" on stories for select using (true);

create policy "content_admin_write_scholars" on scholars for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'))
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));

create policy "content_admin_write_stories" on stories for all
using (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'))
with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role='admin'));
