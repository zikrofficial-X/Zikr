-- Repoint production pg_cron jobs to the current ZIKR Supabase project.
-- This migration is intentionally idempotent and does not create duplicate jobs.

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

-- The cleanup worker was documented as retired but is still active in the live scheduler.
-- Disable it rather than deleting its history; re-enabling remains reversible.
select cron.alter_job(
  job_id => 4,
  schedule => '*/10 * * * *',
  command => $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_project_url') || '/functions/v1/cleanup-youtube-facebook-media',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_publishable_key'),
        'x-zikr-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_secret')
      ),
      body := jsonb_build_object('trigger', 'supabase-cron', 'at', now()),
      timeout_milliseconds := 30000
    );
  $job$,
  database => 'postgres',
  username => 'postgres',
  active => false
);
