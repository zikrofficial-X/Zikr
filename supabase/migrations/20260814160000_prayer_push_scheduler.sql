-- ZIKR prayer Web Push scheduler.
--
-- This migration is intentionally additive. It preserves the existing prayer tables,
-- adds private per-device subscriptions, and establishes a single pg_cron job that
-- calls the server-side Edge Function once per minute. Delivery rows are unique per
-- subscription/prayer/scheduled instant, so overlapping worker invocations cannot
-- send the same notification twice.

-- Preview branches may not expose Supabase's managed extensions. The schema and
-- RLS below are still useful there; only the optional dispatcher is skipped.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net') THEN
    CREATE EXTENSION IF NOT EXISTS pg_net;
  END IF;
END
$$;

create table if not exists public.push_runtime_settings (
  key text primary key,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_runtime_settings enable row level security;

-- A random, server-only token is generated in the database. It is never committed
-- to source control or exposed to browsers. The scheduled HTTP request and the
-- Edge Function use it to authenticate each other.
insert into public.push_runtime_settings (key, value)
values (
  'scheduler_secret',
  jsonb_build_object(
    'secret', md5(random()::text || clock_timestamp()::text || current_database())
  )
)
on conflict (key) do nothing;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%'),
  p256dh text not null check (char_length(p256dh) >= 16),
  auth text not null check (char_length(auth) >= 8),
  device_id text,
  user_agent text,
  platform text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists push_subscriptions_active_user_idx
  on public.push_subscriptions (user_id, updated_at desc)
  where is_active;

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (updated_at asc)
  where is_active;

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own"
  on public.push_subscriptions for select
  using ((select auth.uid()) = user_id);

create policy "push_subscriptions_insert_own"
  on public.push_subscriptions for insert
  with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_update_own"
  on public.push_subscriptions for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "push_subscriptions_delete_own"
  on public.push_subscriptions for delete
  using ((select auth.uid()) = user_id);

alter table public.prayer_preferences
  add column if not exists prayer_reminders jsonb not null
    default '{"Fajr":0,"Sunrise":null,"Dhuhr":0,"Asr":0,"Maghrib":0,"Isha":0}'::jsonb,
  add column if not exists quiet_hours_start time,
  add column if not exists quiet_hours_end time;

create unique index if not exists prayer_locations_one_default_per_user_idx
  on public.prayer_locations (user_id)
  where is_default;

-- Cache only the short planning horizon for each exact location/preference tuple.
-- This prevents the minute dispatcher from polling the external prayer-time source
-- for every active subscription while still adapting to location or method changes.
create table if not exists public.prayer_schedule_cache (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.prayer_locations(id) on delete cascade,
  prayer_date date not null,
  latitude numeric not null,
  longitude numeric not null,
  timezone text not null,
  calculation_method text not null,
  madhab text not null,
  timings jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (location_id, prayer_date, latitude, longitude, timezone, calculation_method, madhab)
);

create index if not exists prayer_schedule_cache_lookup_idx
  on public.prayer_schedule_cache (location_id, prayer_date);

alter table public.prayer_schedule_cache enable row level security;

create table if not exists public.prayer_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  push_subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  prayer_name text not null check (prayer_name in ('Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha')),
  scheduled_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  processing_at timestamptz,
  processed_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  retry_after timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (push_subscription_id, prayer_name, scheduled_at)
);

create index if not exists prayer_notification_deliveries_due_idx
  on public.prayer_notification_deliveries (scheduled_at asc, retry_after asc)
  where status in ('pending', 'failed');

create index if not exists prayer_notification_deliveries_user_idx
  on public.prayer_notification_deliveries (user_id, created_at desc);

alter table public.prayer_notification_deliveries enable row level security;

create policy "prayer_notification_deliveries_select_own"
  on public.prayer_notification_deliveries for select
  using ((select auth.uid()) = user_id);

-- Delivery state is owned exclusively by the trusted worker. Users cannot insert,
-- alter, or replay delivery records through the public API.

create or replace function public.set_push_scheduler_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_push_scheduler_updated_at() from public;

drop trigger if exists push_runtime_settings_set_updated_at on public.push_runtime_settings;
create trigger push_runtime_settings_set_updated_at
  before update on public.push_runtime_settings
  for each row execute function public.set_push_scheduler_updated_at();

drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_push_scheduler_updated_at();

drop trigger if exists prayer_notification_deliveries_set_updated_at on public.prayer_notification_deliveries;
create trigger prayer_notification_deliveries_set_updated_at
  before update on public.prayer_notification_deliveries
  for each row execute function public.set_push_scheduler_updated_at();

drop trigger if exists prayer_schedule_cache_set_updated_at on public.prayer_schedule_cache;
create trigger prayer_schedule_cache_set_updated_at
  before update on public.prayer_schedule_cache
  for each row execute function public.set_push_scheduler_updated_at();

-- The cron executor and Edge Function read the secret through security-definer
-- functions. Public, anon, and authenticated callers receive no execute grant.
create or replace function public.get_push_scheduler_secret()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select value ->> 'secret'
  from public.push_runtime_settings
  where key = 'scheduler_secret';
$$;

revoke all on function public.get_push_scheduler_secret() from public, anon, authenticated;
grant execute on function public.get_push_scheduler_secret() to service_role;

create or replace function public.ensure_push_vapid_bundle(candidate jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  stored jsonb;
begin
  if candidate is null
     or jsonb_typeof(candidate) <> 'object'
     or candidate ? 'publicKey' = false
     or candidate ? 'keys' = false then
    raise exception 'Invalid VAPID candidate';
  end if;

  insert into public.push_runtime_settings (key, value)
  values ('vapid_bundle', candidate)
  on conflict (key) do nothing;

  select value into stored
  from public.push_runtime_settings
  where key = 'vapid_bundle';

  return stored;
end;
$$;

revoke all on function public.ensure_push_vapid_bundle(jsonb) from public, anon, authenticated;
grant execute on function public.ensure_push_vapid_bundle(jsonb) to service_role;

create or replace function public.get_push_vapid_public_key()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select value ->> 'publicKey'
  from public.push_runtime_settings
  where key = 'vapid_bundle';
$$;

revoke all on function public.get_push_vapid_public_key() from public, anon, authenticated;
grant execute on function public.get_push_vapid_public_key() to service_role;

create or replace function public.get_push_vapid_bundle()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select value
  from public.push_runtime_settings
  where key = 'vapid_bundle';
$$;

revoke all on function public.get_push_vapid_bundle() from public, anon, authenticated;
grant execute on function public.get_push_vapid_bundle() to service_role;

-- Replace any prior scheduler of the same name. There is one authoritative
-- recurring dispatcher; the worker performs batched due-only queries.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
     AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    EXECUTE $sql$
      select cron.unschedule(jobid)
      from cron.job
      where jobname = 'zikr-prayer-push-dispatch'
    $sql$;
    EXECUTE $sql$
      select cron.schedule(
        'zikr-prayer-push-dispatch',
        '* * * * *',
        $cron$
          select net.http_post(
            url := 'https://eydxvcamhjhajxjrsgym.supabase.co/functions/v1/prayer-notification-worker',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
            ),
            body := jsonb_build_object('source', 'pg_cron')
          );
        $cron$
      )
    $sql$;
  END IF;
END
$$;
