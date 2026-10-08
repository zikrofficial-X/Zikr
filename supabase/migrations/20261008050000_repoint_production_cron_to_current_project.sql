-- Repoint production pg_cron jobs to the current ZIKR Supabase project.
-- This migration is intentionally idempotent and only reconciles active production jobs.

select cron.alter_job(
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
  database => 'postgres',
  username => 'postgres',
  active => true
);

select cron.alter_job(
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
  database => 'postgres',
  username => 'postgres',
  active => true
);

select cron.alter_job(
  job_id => 4,
  active => false
);
