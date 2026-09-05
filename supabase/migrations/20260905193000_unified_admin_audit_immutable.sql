-- ZIKR unified administrative audit stream.
-- Append-only by design: authenticated users can only read through an admin-only
-- RLS policy; application writes use the server service role.

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  action text not null check (length(trim(action)) between 1 and 120),
  resource_type text,
  resource_id text,
  permission text,
  outcome text not null default 'success' check (outcome in ('success','denied','failed')),
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_at_idx
  on public.admin_audit_events (created_at desc);
create index if not exists admin_audit_events_actor_idx
  on public.admin_audit_events (actor_user_id, created_at desc);
create index if not exists admin_audit_events_action_idx
  on public.admin_audit_events (action, created_at desc);
create index if not exists admin_audit_events_resource_idx
  on public.admin_audit_events (resource_type, resource_id, created_at desc);

alter table public.admin_audit_events enable row level security;
revoke all on public.admin_audit_events from anon, authenticated;
revoke update, delete on public.admin_audit_events from service_role;
grant select on public.admin_audit_events to authenticated;
grant insert on public.admin_audit_events to service_role;

drop policy if exists admin_audit_events_admin_select on public.admin_audit_events;
create policy admin_audit_events_admin_select
on public.admin_audit_events
for select to authenticated
using (exists (
  select 1
  from public.profiles p
  where p.id = auth.uid()
    and p.role = 'admin'
));

create or replace function public.prevent_admin_audit_events_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'admin_audit_events is append-only';
end;
$$;

drop trigger if exists trg_prevent_admin_audit_events_update on public.admin_audit_events;
create trigger trg_prevent_admin_audit_events_update
before update on public.admin_audit_events
for each row execute function public.prevent_admin_audit_events_mutation();

drop trigger if exists trg_prevent_admin_audit_events_delete on public.admin_audit_events;
create trigger trg_prevent_admin_audit_events_delete
before delete on public.admin_audit_events
for each row execute function public.prevent_admin_audit_events_mutation();
