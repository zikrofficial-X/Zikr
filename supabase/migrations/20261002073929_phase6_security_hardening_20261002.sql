-- Phase 6 security hardening.
-- Keep browser/public reads governed by existing RLS policies.
-- Anonymous clients only need INSERT on the public contact form.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public
  FROM anon;

GRANT INSERT ON public.contacts TO anon;

-- Internal/server-only operational tables must not be exposed through the
-- Data API even if future policy mistakes occur.
REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
REVOKE ALL ON public.admin_settings FROM anon, authenticated;
REVOKE ALL ON public.content_revisions FROM anon, authenticated;
REVOKE ALL ON public.video_automation_runs FROM anon, authenticated;
REVOKE ALL ON public.youtube_sync_state FROM anon, authenticated;
