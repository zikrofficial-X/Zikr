create table if not exists public.social_platform_profiles (
  platform text primary key check (platform in ('youtube', 'facebook')),
  external_id text,
  handle text,
  name text not null,
  description text not null default '',
  category text,
  website text,
  avatar_url text,
  cover_url text,
  page_url text not null,
  subscribers_count bigint,
  followers_count bigint,
  likes_count bigint,
  following_count bigint,
  view_count bigint,
  video_count bigint,
  synced_at timestamptz not null default now(),
  status text not null default 'ok' check (status in ('ok', 'stale', 'error')),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_platform_profiles enable row level security;

drop policy if exists "social_platform_profiles_public_read" on public.social_platform_profiles;
create policy "social_platform_profiles_public_read"
  on public.social_platform_profiles
  for select to anon, authenticated
  using (true);

drop policy if exists "social_platform_profiles_client_write_denied" on public.social_platform_profiles;
create policy "social_platform_profiles_client_write_denied"
  on public.social_platform_profiles
  as restrictive
  for all to anon, authenticated
  using (false)
  with check (false);

create index if not exists social_platform_profiles_synced_idx
  on public.social_platform_profiles (synced_at desc);

create or replace function public.set_social_platform_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists social_platform_profiles_updated_at on public.social_platform_profiles;
create trigger social_platform_profiles_updated_at
before update on public.social_platform_profiles
for each row execute function public.set_social_platform_profiles_updated_at();

create table if not exists public.social_sync_state (
  id integer primary key default 1 check (id = 1),
  source_channel_id text,
  uploads_playlist_id text,
  last_seen_video_id text,
  last_seen_published_at timestamptz,
  backfill_complete boolean not null default false,
  backfill_cursor text,
  backfill_page_token text,
  backfill_page_count integer not null default 0,
  backfill_started_at timestamptz,
  backfill_completed_at timestamptz,
  last_discovery_at timestamptz,
  batch_size integer not null default 3,
  auto_sync_enabled boolean not null default true,
  schedule_cron text not null default '*/10 * * * *',
  sync_secret_hash text,
  updated_at timestamptz not null default now()
);

insert into public.social_sync_state (id) values (1)
on conflict (id) do nothing;

alter table public.social_sync_state enable row level security;

drop policy if exists "social_sync_state_client_denied" on public.social_sync_state;
create policy "social_sync_state_client_denied"
  on public.social_sync_state
  as restrictive
  for all to anon, authenticated
  using (false)
  with check (false);

create or replace function public.set_social_sync_state_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists social_sync_state_updated_at on public.social_sync_state;
create trigger social_sync_state_updated_at
before update on public.social_sync_state
for each row execute function public.set_social_sync_state_updated_at();

create table if not exists public.social_sync_jobs (
  id bigint generated always as identity primary key,
  source_channel_id text not null,
  source_video_id text not null,
  title text not null,
  description text not null default '',
  source_published_at timestamptz,
  thumbnail_url text,
  source_url text not null,
  source_media_url text,
  source_media_path text,
  source_media_mime text,
  source_media_size bigint,
  source_media_uploaded_at timestamptz,
  source_media_deleted_at timestamptz,
  source_media_delete_error text,
  source_media_match_method text,
  source_media_match_score numeric,
  facebook_post_type text not null default 'video' check (facebook_post_type in ('video', 'reel')),
  status text not null default 'pending' check (status in ('pending', 'waiting_media', 'processing', 'failed', 'published')),
  retryable boolean not null default true,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  attempts integer not null default 0,
  locked_at timestamptz,
  publish_request_id uuid,
  facebook_post_id text,
  published_at_facebook timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_channel_id, source_video_id)
);

alter table public.social_sync_jobs enable row level security;

drop policy if exists "social_sync_jobs_client_denied" on public.social_sync_jobs;
create policy "social_sync_jobs_client_denied"
  on public.social_sync_jobs
  as restrictive
  for all to anon, authenticated
  using (false)
  with check (false);

create index if not exists social_sync_jobs_ready_idx
  on public.social_sync_jobs (source_channel_id, status, retryable, next_attempt_at);

create index if not exists social_sync_jobs_source_published_idx
  on public.social_sync_jobs (source_channel_id, source_published_at desc);

create index if not exists social_sync_jobs_media_cleanup_idx
  on public.social_sync_jobs (status, source_media_deleted_at, source_media_uploaded_at);

create or replace function public.set_social_sync_jobs_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists social_sync_jobs_updated_at on public.social_sync_jobs;
create trigger social_sync_jobs_updated_at
before update on public.social_sync_jobs
for each row execute function public.set_social_sync_jobs_updated_at();

do $$
begin
  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    if exists (select 1 from cron.job where jobname = 'zikr-youtube-facebook-sync') then
      perform cron.unschedule((select jobid from cron.job where jobname = 'zikr-youtube-facebook-sync' limit 1));
    end if;
    perform cron.schedule(
      'zikr-youtube-facebook-sync',
      '*/10 * * * *',
      $cron$
      select net.http_post(
        url := 'https://kdotmrjfecgafiommzwz.supabase.co/functions/v1/sync-youtube-facebook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
        ),
        body := jsonb_build_object('source', 'pg_cron')
      );
      $cron$
    );
  end if;
exception when undefined_table then
  null;
end;
$$;
