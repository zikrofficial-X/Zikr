-- Retire the obsolete YouTube/Facebook cleanup cron job.
-- Clean Preview databases may not have legacy job 4, so the retirement is
-- conditional on the scheduler row existing.
DO $migration$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL
     AND to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)') IS NOT NULL
     AND EXISTS (SELECT 1 FROM cron.job WHERE jobid = 3) THEN
    PERFORM cron.alter_job(job_id => 3, active => true);
  END IF;

  IF to_regclass('cron.job') IS NOT NULL
     AND to_regprocedure('cron.unschedule(bigint)') IS NOT NULL
     AND EXISTS (SELECT 1 FROM cron.job WHERE jobid = 4) THEN
    PERFORM cron.unschedule(job_id => 4);
  END IF;
END
$migration$;
