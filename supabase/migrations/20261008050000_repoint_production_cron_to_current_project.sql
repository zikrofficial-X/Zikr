-- Repoint production pg_cron jobs to the current ZIKR Supabase project.
-- This migration is idempotent and safe for Preview environments where an old
-- cleanup worker row may already have been retired. Only mutable schedule,
-- command, and active state are reconciled; existing database/username ownership
-- is left untouched because Supabase Preview does not grant superuser ALTER rights.

DO $migration$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL
     AND to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 1) THEN
      PERFORM cron.alter_job(
        job_id => 1,
        schedule => '* * * * *',
        command => $job$
          select net.http_post(
            url := 'https://wvetcauyerlkqvmntajq.supabase.co/functions/v1/prayer-notification-worker',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
            ),
            body := jsonb_build_object('source', 'pg_cron')
          );
        $job$,
        active => true
      );
    END IF;

    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 3) THEN
      PERFORM cron.alter_job(
        job_id => 3,
        schedule => '0 3 * * *',
        command => $job$
          select net.http_post(
            url := 'https://wvetcauyerlkqvmntajq.supabase.co/functions/v1/source-verified-content-agent',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
            ),
            body := jsonb_build_object('source', 'pg_cron')
          );
        $job$,
        active => true
      );
    END IF;

    -- Retire obsolete cleanup job 4 when it still exists.
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 4) THEN
      PERFORM cron.alter_job(
        job_id => 4,
        active => false
      );
    END IF;
  END IF;
END
$migration$;
