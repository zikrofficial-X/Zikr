create table if not exists public.admin_rate_limits (
  bucket text not null,
  actor_user_id uuid not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (bucket, actor_user_id, window_start)
);

alter table public.admin_rate_limits enable row level security;
revoke all on public.admin_rate_limits from anon, authenticated;
grant all on public.admin_rate_limits to service_role;

create or replace function public.consume_admin_rate_limit(
  p_bucket text,
  p_actor uuid,
  p_limit integer default 20,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit';
  end if;

  v_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.admin_rate_limits(
    bucket, actor_user_id, window_start, request_count
  )
  values(p_bucket, p_actor, v_start, 1)
  on conflict (bucket, actor_user_id, window_start)
  do update set
    request_count = public.admin_rate_limits.request_count + 1,
    updated_at = now()
  returning request_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke all on function public.consume_admin_rate_limit(text,uuid,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_admin_rate_limit(text,uuid,integer,integer) to service_role;

create index if not exists idx_admin_rate_limits_updated_at
  on public.admin_rate_limits(updated_at);
