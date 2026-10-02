-- Phase 13 scheduler hardening.
-- Keep production scheduler endpoints on the canonical Supabase project.
-- The cleanup worker uses Vault only for credentials; the project URL itself
-- is non-secret and must not depend on a missing Vault entry.

do $migration$
begin
  if to_regprocedure('cron.alter_job(bigint,text,text,text,text,boolean)') is not null then
    perform cron.alter_job(
      job_id := 1,
      command := $job$
        select net.http_post(
          url := 'https://kdotmrjfecgafiommzwz.supabase.co/functions/v1/prayer-notification-worker',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
          ),
          body := jsonb_build_object('source', 'pg_cron')
        );
      $job$
    );

    perform cron.alter_job(
      job_id := 3,
      command := $job$
        select net.http_post(
          url := 'https://kdotmrjfecgafiommzwz.supabase.co/functions/v1/source-verified-content-agent',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || public.get_push_scheduler_secret()
          ),
          body := jsonb_build_object('source', 'pg_cron')
        );
      $job$
    );

    perform cron.alter_job(
      job_id := 4,
      command := $job$
        select net.http_post(
          url := 'https://kdotmrjfecgafiommzwz.supabase.co/functions/v1/cleanup-youtube-facebook-media',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_publishable_key'),
            'x-zikr-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_secret')
          ),
          body := jsonb_build_object('trigger', 'supabase-cron', 'at', now()),
          timeout_milliseconds := 30000
        ) as request_id;
      $job$
    );
  end if;
end
$migration$;
