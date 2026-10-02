-- Phase 13 scheduler cleanup.
-- The historical media-cleanup cron targeted an Edge Function that is no longer
-- deployed. Retire the dead scheduler instead of generating permanent failures.

do $migration$
begin
  if to_regprocedure('cron.unschedule(bigint)') is not null
     and exists (select 1 from cron.job where jobid = 4) then
    perform cron.unschedule(4);
  end if;
end
$migration$;
