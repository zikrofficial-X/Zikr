-- Admin platform foundation applied to production as 20260905195702.
-- Indexes and initial admin operational settings are intentionally tracked
-- in source control so local migration history remains aligned with Supabase.
create index if not exists idx_admin_audit_events_created_at on public.admin_audit_events (created_at desc);
create index if not exists idx_admin_audit_events_action on public.admin_audit_events (action, created_at desc);
create index if not exists idx_admin_audit_events_resource on public.admin_audit_events (resource_type, resource_id, created_at desc);
insert into public.admin_settings(key,value) values
  ('require_mfa_for_destructive','false'::jsonb),
  ('maintenance_mode','false'::jsonb),
  ('admin_alerts_enabled','true'::jsonb),
  ('search_result_limit','25'::jsonb)
on conflict (key) do nothing;
