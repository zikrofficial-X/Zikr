-- Move the two active ZIKR background jobs to the current production
-- Supabase project. Preserve schedules, request headers, and private bearer
-- values; only replace the stale project host. The retired social sync job is
-- deliberately excluded and remains inactive.
DO $migration$
DECLARE
  v_job record;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'cron'
         AND table_name = 'job'
         AND column_name = 'command'
     )
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'cron'
         AND table_name = 'job'
         AND column_name = 'active'
     ) THEN
    FOR v_job IN
      SELECT jobid, command
      FROM cron.job
      WHERE jobname IN (
        'zikr-prayer-push-dispatch',
        'zikr-source-verified-content-agent'
      )
        AND active IS TRUE
        AND command LIKE '%https://ymxdswkaxafakugktsim.supabase.co%'
    LOOP
      PERFORM cron.alter_job(
        job_id := v_job.jobid,
        command := replace(
          v_job.command,
          'https://ymxdswkaxafakugktsim.supabase.co',
          'https://zqtssvlvmkzeeyqghqfk.supabase.co'
        )
      );
    END LOOP;
  END IF;
END;
$migration$;
