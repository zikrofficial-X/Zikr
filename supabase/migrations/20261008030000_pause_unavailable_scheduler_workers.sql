-- Disable scheduled workers that currently have no deployable runtime target.
-- Re-enable job 3 after source-verified-content-agent is deployed.
-- Job 4 is already retired in current production; only touch it when present.
DO $migration$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL
     AND to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 3) THEN
      PERFORM cron.alter_job(job_id => 3, active => false);
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobid = 4) THEN
      PERFORM cron.alter_job(job_id => 4, active => false);
    END IF;
  END IF;
END
$migration$;
