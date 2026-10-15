-- Free-plan efficiency for pg_cron.
-- 1. The prayer worker runs every minute. Without an active push subscription it has nothing to do,
--    so the Edge Function is only invoked while at least one active subscription exists
--    (~43,000 avoidable invocations per month while nobody has subscribed).
-- 2. cron.job_run_details grows by ~1,440 rows per day for that job alone; keep three days of history.
DO $efficiency$
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
        )
        where exists (select 1 from public.push_subscriptions where is_active);
      $job$,
      active => true
    );
  END LOOP;

  PERFORM cron.schedule(
    'zikr-cron-history-cleanup',
    '30 3 * * *',
    $job$ delete from cron.job_run_details where end_time < now() - interval '3 days'; $job$
  );
EXCEPTION WHEN undefined_table THEN
  NULL;
END
$efficiency$;
