\set ON_ERROR_STOP on

DO $contract$
DECLARE
  job_count integer;
  job_command text;
  job_schedule text;
  job_active boolean;
BEGIN
  SELECT count(*) INTO job_count
  FROM cron.job
  WHERE jobname = 'zikr-source-verified-content-agent';

  IF job_count <> 1 THEN
    RAISE EXCEPTION 'expected exactly one source-agent cron job, found %', job_count;
  END IF;

  SELECT command, schedule, active
    INTO job_command, job_schedule, job_active
  FROM cron.job
  WHERE jobname = 'zikr-source-verified-content-agent';

  IF job_schedule <> '0 3 * * *' OR job_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'source-agent cron schedule must be active daily at 03:00 UTC';
  END IF;
  IF position('https://zqtssvlvmkzeeyqghqfk.supabase.co/functions/v1/source-verified-content-agent' in job_command) = 0 THEN
    RAISE EXCEPTION 'source-agent cron command points at the wrong Supabase project';
  END IF;
  IF position('net.http_post(' in job_command) = 0 THEN
    RAISE EXCEPTION 'source-agent cron command must invoke net.http_post';
  END IF;
  IF position('public.get_push_scheduler_secret()' in job_command) = 0 THEN
    RAISE EXCEPTION 'source-agent cron command must authenticate with the scheduler secret RPC';
  END IF;
  IF position('jsonb_build_object(''source'', ''pg_cron'')' in job_command) = 0 THEN
    RAISE EXCEPTION 'source-agent cron command must identify the pg_cron source';
  END IF;
END;
$contract$;

SELECT 'SOURCE_AGENT_CRON_RECONCILIATION_PASSED' AS result;
