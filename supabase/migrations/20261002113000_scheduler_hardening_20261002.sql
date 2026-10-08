-- Phase 13 scheduler hardening.
-- Keep production scheduler endpoints on the canonical Supabase project.
-- This historical migration may replay against a clean Preview database where
-- the old cron job IDs have already been retired. Only touch jobs that exist.

DO $migration$
BEGIN
  IF to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)') IS NOT NULL
     AND to_regclass('cron.job') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 1) THEN
      PERFORM cron.alter_job(
        job_id := 1,
        command := $job$
          select net.http_post(
            url := 'https://nmdeazfmtncelykzxkhs.supabase.co/functions/v1/prayer-notification-worker',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
            ),
            body := jsonb_build_object('source', 'pg_cron')
          );
        $job$
      );
    END IF;

    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 3) THEN
      PERFORM cron.alter_job(
        job_id := 3,
        command := $job$
          select net.http_post(
            url := 'https://nmdeazfmtncelykzxkhs.supabase.co/functions/v1/source-verified-content-agent',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
            ),
            body := jsonb_build_object('source', 'pg_cron')
          );
        $job$
      );
    END IF;

    -- Job 4 is obsolete in current production. Preserve this historical
    -- command only for environments where the job still exists.
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 4) THEN
      PERFORM cron.alter_job(
        job_id := 4,
        command := $job$
          select net.http_post(
            url := 'https://nmdeazfmtncelykzxkhs.supabase.co/functions/v1/cleanup-youtube-facebook-media',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_publishable_key'),
              'x-zikr-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_secret')
            ),
            body := jsonb_build_object('trigger', 'supabase-cron', 'at', now()),
            timeout_milliseconds := 30000
          ) as request_id;
        $job$
      );
    END IF;
  END IF;
END
$migration$;
