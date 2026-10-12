-- Repoint pg_cron Edge Function jobs to the ZIKR Supabase project that lives in
-- the new organization (bbdpitxvfxgephaaqtqj). Historical migrations are left
-- untouched; this migration reconciles job commands by name so replay on a fresh
-- project ends with every active job calling its own project.
-- The scheduler secret is generated per project by public.get_push_scheduler_secret(),
-- so no secret has to be copied between projects.
-- The social sync and media cleanup jobs stay inactive until their Edge Functions
-- are deployed and publishing is explicitly authorized.

DO $repoint$
DECLARE
  existing_job record;
BEGIN
  IF to_regclass('cron.job') IS NULL
     OR to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)') IS NULL THEN
    RETURN;
  END IF;

  FOR existing_job IN SELECT jobid FROM cron.job WHERE jobname = 'zikr-prayer-push-dispatch' LOOP
    PERFORM cron.alter_job(
      job_id => existing_job.jobid,
      schedule => '* * * * *',
      command => $job$
        select net.http_post(
          url := 'https://bbdpitxvfxgephaaqtqj.supabase.co/functions/v1/prayer-notification-worker',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
          ),
          body := jsonb_build_object('source', 'pg_cron')
        );
      $job$,
      active => true
    );
  END LOOP;

  FOR existing_job IN SELECT jobid FROM cron.job WHERE jobname = 'zikr-source-verified-content-agent' LOOP
    PERFORM cron.alter_job(
      job_id => existing_job.jobid,
      schedule => '0 3 * * *',
      command => $job$
        select net.http_post(
          url := 'https://bbdpitxvfxgephaaqtqj.supabase.co/functions/v1/source-verified-content-agent',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
          ),
          body := jsonb_build_object('source', 'pg_cron')
        );
      $job$,
      active => true
    );
  END LOOP;

  FOR existing_job IN SELECT jobid FROM cron.job WHERE jobname = 'zikr-youtube-facebook-sync' LOOP
    PERFORM cron.alter_job(
      job_id => existing_job.jobid,
      command => $job$
        select net.http_post(
          url := 'https://bbdpitxvfxgephaaqtqj.supabase.co/functions/v1/sync-youtube-facebook',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
          ),
          body := jsonb_build_object('source', 'pg_cron')
        );
      $job$,
      active => false
    );
  END LOOP;
EXCEPTION WHEN undefined_table THEN
  -- Local/replay databases may not have pg_cron enabled.
  NULL;
END
$repoint$;
