do $$
declare
  cron_exists boolean;
  existing_job bigint;
begin
  select to_regnamespace('cron') is not null into cron_exists;
  if not cron_exists then
    return;
  end if;

  execute format($sql$
    select jobid
    from cron.job
    where jobname = %L
  $sql$, 'zikr-youtube-facebook-media-cleanup')
  into existing_job;

  if existing_job is not null then
    execute format('select cron.unschedule(%s)', existing_job);
  end if;

  execute $sql$
    select cron.schedule(
      'zikr-youtube-facebook-media-cleanup',
      '*/10 * * * *',
      $cmd$
        select net.http_post(
          url := 'https://zikrmediaofficial.vercel.app/api/internal/youtube-facebook/cleanup-media',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-zikr-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_secret')
          ),
          body := jsonb_build_object('trigger', 'supabase-cron', 'at', now()),
          timeout_milliseconds := 30000
        ) as request_id;
      $cmd$
    )
  $sql$;
end $$;
