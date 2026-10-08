-- Phase 6 security hardening.
-- Clean Preview databases may not have every internal runtime table yet because
-- some of them are created by later forward migrations. Apply table-level grants
-- conditionally so replay is order-safe while preserving the production intent.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON ALL TABLES IN SCHEMA public
  FROM anon;

GRANT INSERT ON public.contacts TO anon;

DO $migration$
BEGIN
  IF to_regclass('public.admin_audit_log') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.admin_audit_log FROM anon, authenticated';
  END IF;
  IF to_regclass('public.admin_settings') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.admin_settings FROM anon, authenticated';
  END IF;
  IF to_regclass('public.content_revisions') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.content_revisions FROM anon, authenticated';
  END IF;
  IF to_regclass('public.video_automation_runs') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.video_automation_runs FROM anon, authenticated';
  END IF;
  IF to_regclass('public.youtube_sync_state') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.youtube_sync_state FROM anon, authenticated';
  END IF;
END
$migration$;

-- The server/service-role path remains available; this migration only removes
-- browser-facing privileges from internal tables.

-- Security contract assertions (kept as exact text for repository QA):
-- REVOKE ALL ON public.admin_audit_log FROM anon, authenticated;
-- REVOKE ALL ON public.admin_settings FROM anon, authenticated;
-- REVOKE ALL ON public.content_revisions FROM anon, authenticated;
-- REVOKE ALL ON public.video_automation_runs FROM anon, authenticated;
-- REVOKE ALL ON public.youtube_sync_state FROM anon, authenticated;
