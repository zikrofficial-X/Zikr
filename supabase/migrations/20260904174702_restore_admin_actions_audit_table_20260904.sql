-- Reconcile the migration history with the already-applied production repair.
-- The statements are idempotent so local replay remains safe.
create table if not exists public.admin_actions_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_actions_audit_created_at_idx
  on public.admin_actions_audit (created_at desc);

alter table public.admin_actions_audit enable row level security;
revoke all on public.admin_actions_audit from anon, authenticated;
drop policy if exists admin_actions_audit_admin_select on public.admin_actions_audit;
create policy admin_actions_audit_admin_select on public.admin_actions_audit
for select to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.role = 'admin'
));
