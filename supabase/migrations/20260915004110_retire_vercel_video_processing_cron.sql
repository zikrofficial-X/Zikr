-- Reconcile the production migration that retired the legacy Vercel video-processing cron.
-- The command is guarded so clean/preview databases without pg_cron remain replayable.
do $$
begin
  if exists (
    select 1
    from pg_available_extensions
    where name = 'pg_cron'
  ) then
    begin
      perform cron.unschedule('zikr-video-processing');
    exception when others then
      -- The job may already be absent; migration remains idempotent.
      null;
    end;
  end if;
end
$$;
