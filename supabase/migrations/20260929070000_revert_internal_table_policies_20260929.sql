-- Revert accidental client-facing policies on legacy internal tables.
-- These tables are intentionally server-only; application writes use service role.
drop policy if exists "admin_audit_log_admin_read" on public.admin_audit_log;
drop policy if exists "admin_audit_log_admin_insert" on public.admin_audit_log;
drop policy if exists "admin_settings_admin_all" on public.admin_settings;
drop policy if exists "content_revisions_admin_read" on public.content_revisions;
drop policy if exists "content_revisions_admin_insert" on public.content_revisions;
comment on table public.admin_audit_log is
  'Legacy internal admin audit table. Keep server-only; application access uses the server-side service role.';
comment on table public.admin_settings is
  'Sensitive operational settings. Keep server-only; application access uses the server-side service role.';
comment on table public.content_revisions is
  'Internal content revision history. Keep server-only; application access uses the server-side service role.';
