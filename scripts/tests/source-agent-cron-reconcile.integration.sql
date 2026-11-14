\set ON_ERROR_STOP on

DO $contract$
DECLARE
  job_count integer;
  job_command text;
  job_schedule text;
  job_active boolean;
  expected_command constant text := $expected$
    SELECT net.http_post(
      url := 'https://zqtssvlvmkzeeyqghqfk.supabase.co/functions/v1/source-verified-content-agent',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
      ),
      body := jsonb_build_object('source', 'pg_cron')
    );
  $expected$;
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
  IF regexp_replace(btrim(job_command), '[[:space:]]+', ' ', 'g')
       <> regexp_replace(btrim(expected_command), '[[:space:]]+', ' ', 'g') THEN
    RAISE EXCEPTION 'source-agent cron command must exactly match the authenticated canonical request';
  END IF;
END;
$contract$;

SELECT 'SOURCE_AGENT_CRON_RECONCILIATION_PASSED' AS result;
