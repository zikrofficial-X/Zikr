-- ZIKR social/video reliability hardening.
-- 1) Allow the social sync pipeline to explicitly record Facebook Reels.
-- 2) Prevent client roles from reading/writing the internal admin rate-limit table.
-- 3) Move media cleanup scheduling from Vercel to a Supabase Edge Function so
--    pg_cron never depends on a Vercel gateway timeout.

do $migration$
begin
  if to_regclass('public.social_sync_jobs') is not null then
    execute 'alter table public.social_sync_jobs drop constraint if exists social_sync_jobs_facebook_post_type_check';
    execute 'alter table public.social_sync_jobs add constraint social_sync_jobs_facebook_post_type_check check (facebook_post_type in (''video'', ''reel''))';
  end if;

  if to_regclass('public.admin_rate_limits') is not null
     and not exists (
       select 1
       from pg_policies
       where schemaname = 'public'
         and tablename = 'admin_rate_limits'
         and policyname = 'admin_rate_limits_no_client_access'
     ) then
    execute 'create policy "admin_rate_limits_no_client_access" on public.admin_rate_limits as restrictive for all to anon, authenticated using (false) with check (false)';
  end if;
end $migration$;

-- Remove the Vercel cleanup cron job if present (job id/name may differ across environments).
do $$
declare
  existing_job_id bigint;
begin
  if to_regclass('cron.job') is not null then
    execute $query$
      select jobid
      from cron.job
      where jobname = 'zikr-youtube-facebook-media-cleanup'
      limit 1
    $query$ into existing_job_id;

    if existing_job_id is not null and to_regprocedure('cron.unschedule(bigint)') is not null then
      perform cron.unschedule(existing_job_id);
    end if;
  end if;
end $$;

-- Keep the cleanup workload inside Supabase and reuse the existing Vault secrets.
do $schedule$
begin
  if to_regprocedure('cron.schedule(text,text,text)') is not null then
    perform cron.schedule(
      'zikr-youtube-facebook-media-cleanup-edge',
      '*/10 * * * *',
      $cron$
        select net.http_post(
          url := (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_project_url') || '/functions/v1/cleanup-youtube-facebook-media',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_publishable_key'),
            'x-zikr-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'social_sync_secret')
          ),
          body := jsonb_build_object('trigger', 'supabase-cron', 'at', now()),
          timeout_milliseconds := 30000
        ) as request_id;
      $cron$
    );
  end if;
end $schedule$;
