-- Reconcile the native social-sync job after the Supabase project change, and
-- remove legacy public policies that bypass the published-parent predicates.
-- Keep the existing schedule and parent-scoped read policies intact.
--
-- The target project has no deployed sync-youtube-facebook Edge Function yet.
-- The scheduled implementation can publish directly to the connected Facebook
-- Page, so preserve its configuration but leave it inactive until deployment,
-- runtime secrets, queue contents, and publishing authorization are verified.

DO $social_sync_cron$
DECLARE
  existing_job record;
BEGIN
  IF to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)') IS NOT NULL
     AND to_regclass('cron.job') IS NOT NULL THEN
    FOR existing_job IN
      SELECT jobid
      FROM cron.job
      WHERE jobname = 'zikr-youtube-facebook-sync'
    LOOP
      PERFORM cron.alter_job(
        existing_job.jobid,
        command := $cron$
          SELECT net.http_post(
            url := 'https://wvetcauyerlkqvmntajq.supabase.co/functions/v1/sync-youtube-facebook',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
            ),
            body := jsonb_build_object('source', 'pg_cron')
          );
        $cron$,
        active := false
      );
    END LOOP;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Local/replay databases may not have pg_cron enabled.
  NULL;
END
$social_sync_cron$;

-- These historical catch-all policies were permissive and ORed with the
-- intended parent-published checks, exposing unpublished child rows.
DROP POLICY IF EXISTS allow_public_read ON public.companion_stories;
DROP POLICY IF EXISTS allow_public_read ON public.battle_events;
DROP POLICY IF EXISTS allow_public_read ON public.conquest_events;
