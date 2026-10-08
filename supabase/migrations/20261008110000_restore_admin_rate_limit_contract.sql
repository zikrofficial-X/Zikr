-- Restore the canonical admin rate-limit contract used by server-side admin actions.
-- This migration is additive, idempotent, and keeps client roles fully blocked.

create table if not exists public.admin_rate_limits (
  actor_id uuid not null,
  bucket text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (actor_id, bucket, window_started_at)
);

create index if not exists admin_rate_limits_bucket_window_idx
  on public.admin_rate_limits (bucket, window_started_at);

alter table public.admin_rate_limits enable row level security;

drop policy if exists "admin_rate_limits_no_client_access" on public.admin_rate_limits;
create policy "admin_rate_limits_no_client_access"
  on public.admin_rate_limits
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on public.admin_rate_limits from anon, authenticated;
grant all on public.admin_rate_limits to service_role;

create or replace function public.consume_admin_rate_limit(
  p_actor uuid,
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if p_actor is null
     or coalesce(length(trim(p_bucket)), 0) = 0
     or p_limit < 1
     or p_window_seconds < 1 then
    return false;
  end if;

  v_window_started_at :=
    to_timestamp(
      floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
    );

  delete from public.admin_rate_limits
  where actor_id = p_actor
    and bucket = p_bucket
    and window_started_at < now() - interval '1 day';

  insert into public.admin_rate_limits (
    actor_id,
    bucket,
    window_started_at,
    request_count,
    created_at,
    updated_at
  )
  values (
    p_actor,
    p_bucket,
    v_window_started_at,
    1,
    now(),
    now()
  )
  on conflict (actor_id, bucket, window_started_at)
  do update
    set request_count = public.admin_rate_limits.request_count + 1,
        updated_at = now()
  returning request_count into v_request_count;

  return v_request_count <= p_limit;
end;
$function$;

revoke all on function public.consume_admin_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;

grant execute on function public.consume_admin_rate_limit(uuid, text, integer, integer)
  to service_role;

comment on table public.admin_rate_limits is
  'Server-only rolling-window counters for privileged admin actions.';
comment on function public.consume_admin_rate_limit(uuid, text, integer, integer) is
  'Atomically consumes one server-side admin rate-limit token for an actor and bucket.';
