-- Repoint pg_cron Edge Function jobs to the connected Supabase project
-- (ymxdswkaxafakugktsim). Earlier migrations are left untouched; this one
-- reconciles the job commands by name so replay ends with every job calling
-- its own project. The scheduler secret is generated per project by
-- public.get_push_scheduler_secret(), so nothing is copied between projects.
-- The social sync job stays inactive until its Edge Function is deployed and
-- publishing is explicitly authorized.

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
          url := 'https://ymxdswkaxafakugktsim.supabase.co/functions/v1/prayer-notification-worker',
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
          url := 'https://ymxdswkaxafakugktsim.supabase.co/functions/v1/source-verified-content-agent',
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
          url := 'https://ymxdswkaxafakugktsim.supabase.co/functions/v1/sync-youtube-facebook',
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
  NULL;
END
$repoint$;
