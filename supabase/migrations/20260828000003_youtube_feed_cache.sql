-- YouTube feed cache schema. Version 00000 conflicted with the already-applied site audio migration; 00003 is the canonical new version.
create table if not exists public.youtube_feed_cache (
  video_id text primary key,
  channel_id text not null,
  title text not null,
  description text not null default '',
  thumbnail_url text,
  published_at timestamptz,
  video_url text not null,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists youtube_feed_cache_channel_published_idx
  on public.youtube_feed_cache (channel_id, published_at desc);

create index if not exists youtube_feed_cache_synced_at_idx
  on public.youtube_feed_cache (synced_at desc);

alter table public.youtube_feed_cache enable row level security;

drop policy if exists "youtube_feed_cache_public_read" on public.youtube_feed_cache;
create policy "youtube_feed_cache_public_read"
  on public.youtube_feed_cache
  for select
  using (true);

create or replace function public.set_youtube_feed_cache_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists youtube_feed_cache_updated_at on public.youtube_feed_cache;
create trigger youtube_feed_cache_updated_at
before update on public.youtube_feed_cache
for each row execute function public.set_youtube_feed_cache_updated_at();

create table if not exists public.youtube_sync_state (
  id integer primary key default 1 check (id = 1),
  channel_id text,
  status text not null default 'never_synced' check (status in ('never_synced','ok','quota_exceeded','error')),
  last_attempted_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  next_allowed_sync_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.youtube_sync_state (id)
values (1)
on conflict (id) do nothing;

alter table public.youtube_sync_state enable row level security;

drop policy if exists "youtube_sync_state_public_read" on public.youtube_sync_state;
create policy "youtube_sync_state_public_read"
  on public.youtube_sync_state
  for select
  using (true);

create or replace function public.set_youtube_sync_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists youtube_sync_state_updated_at on public.youtube_sync_state;
create trigger youtube_sync_state_updated_at
before update on public.youtube_sync_state
for each row execute function public.set_youtube_sync_state_updated_at();
