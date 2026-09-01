-- Move pg_net out of the public schema so Supabase security lint passes.
-- The project uses pg_net through pg_cron for the YouTube -> Facebook sync.
create schema if not exists extensions;

do $$
begin
  if exists (
    select 1
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'pg_net'
  ) then
    execute 'alter extension pg_net set schema extensions';
  end if;
end $$;

-- Re-point the scheduled native sync job to the new extension schema.
do $$
declare
  v_jobid bigint;
begin
  if to_regnamespace('cron') is null then
    return;
  end if;

  select jobid into v_jobid
  from cron.job
  where jobname = 'zikr-youtube-facebook-sync'
  order by jobid desc
  limit 1;

  if v_jobid is not null then
    update cron.job
    set command = replace(command, 'net.http_post', 'extensions.http_post')
    where jobid = v_jobid;
  end if;
exception
  when undefined_table then
    null;
end $$;
