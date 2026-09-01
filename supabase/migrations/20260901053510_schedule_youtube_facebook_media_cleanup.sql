do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'zikr-youtube-facebook-media-cleanup';
  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end $$;

select cron.schedule(
  'zikr-youtube-facebook-media-cleanup',
  '*/10 * * * *',
  $$
    select net.http_post(
      url := 'https://zikrmediaofficial.vercel.app/api/internal/youtube-facebook/cleanup-media',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-zikr-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_secret')
      ),
      body := jsonb_build_object('trigger', 'supabase-cron', 'at', now()),
      timeout_milliseconds := 30000
    ) as request_id;
  $$
);
