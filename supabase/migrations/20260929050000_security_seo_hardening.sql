-- Security and SEO hardening for the current production schema.
-- Keep admin/internal tables closed by default while allowing the server-side
-- admin surface to inspect/write only through an authenticated admin context.

drop policy if exists "admin_audit_log_admin_read" on public.admin_audit_log;
create policy "admin_audit_log_admin_read"
  on public.admin_audit_log
  for select
  to authenticated
  using ((select public.is_admin_user()));

drop policy if exists "admin_audit_log_admin_insert" on public.admin_audit_log;
create policy "admin_audit_log_admin_insert"
  on public.admin_audit_log
  for insert
  to authenticated
  with check ((select public.is_admin_user()));

drop policy if exists "admin_settings_admin_all" on public.admin_settings;
create policy "admin_settings_admin_all"
  on public.admin_settings
  for all
  to authenticated
  using ((select public.is_admin_user()))
  with check ((select public.is_admin_user()));

drop policy if exists "content_revisions_admin_read" on public.content_revisions;
create policy "content_revisions_admin_read"
  on public.content_revisions
  for select
  to authenticated
  using ((select public.is_admin_user()));

drop policy if exists "content_revisions_admin_insert" on public.content_revisions;
create policy "content_revisions_admin_insert"
  on public.content_revisions
  for insert
  to authenticated
  with check ((select public.is_admin_user()));

drop policy if exists "social_publish_queue_admin_read" on public.social_publish_queue;
create policy "social_publish_queue_admin_read"
  on public.social_publish_queue
  for select
  to authenticated
  using (
    (exists (
      select 1
      from public.admin_role_assignments a
      where a.user_id = (select auth.uid())
    ))
    or
    (exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    ))
  );

drop policy if exists "social_publish_queue_admin_write" on public.social_publish_queue;
create policy "social_publish_queue_admin_write"
  on public.social_publish_queue
  for all
  to authenticated
  using (
    (exists (
      select 1
      from public.admin_role_assignments a
      where a.user_id = (select auth.uid())
    ))
    or
    (exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    ))
  )
  with check (
    (exists (
      select 1
      from public.admin_role_assignments a
      where a.user_id = (select auth.uid())
    ))
    or
    (exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    ))
  );

comment on table public.admin_audit_log is
  'Admin audit history. Client writes are restricted to authenticated admins; server-side service-role writes remain supported.';
comment on table public.admin_settings is
  'Sensitive operational settings. Access is restricted to authenticated admins and server-side service-role operations.';
comment on table public.content_revisions is
  'Internal content revision history. Access is restricted to authenticated admins and server-side service-role operations.';
