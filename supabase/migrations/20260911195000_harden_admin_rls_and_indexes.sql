-- Performance + RLS hardening for the admin control center.
-- Keep this migration idempotent so local/remote environments converge safely.

create index if not exists admin_role_assignments_created_by_idx
  on public.admin_role_assignments (created_by);

alter table public.admin_actions_audit enable row level security;
alter table public.admin_role_assignments enable row level security;

drop policy if exists admin_actions_audit_admin_select on public.admin_actions_audit;
create policy admin_actions_audit_admin_select
  on public.admin_actions_audit
  for select to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );

drop policy if exists admin_role_assignments_select on public.admin_role_assignments;
drop policy if exists admin_role_assignments_write on public.admin_role_assignments;
drop policy if exists admin_role_assignments_insert on public.admin_role_assignments;
drop policy if exists admin_role_assignments_update on public.admin_role_assignments;
drop policy if exists admin_role_assignments_delete on public.admin_role_assignments;

create policy admin_role_assignments_select
  on public.admin_role_assignments
  for select to authenticated
  using (
    (user_id = (select auth.uid()))
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );

create policy admin_role_assignments_insert
  on public.admin_role_assignments
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );

create policy admin_role_assignments_update
  on public.admin_role_assignments
  for update to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );

create policy admin_role_assignments_delete
  on public.admin_role_assignments
  for delete to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );
