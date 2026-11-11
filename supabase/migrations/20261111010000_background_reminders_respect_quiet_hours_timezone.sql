begin;

alter table public.background_reminder_preferences
  add column if not exists timezone text not null default 'UTC';

-- Existing quiet-hour values were saved in the device's local clock. When a
-- default prayer location exists, use its IANA timezone as the best available
-- backfill; new client updates persist the browser/device timezone explicitly.
update public.background_reminder_preferences preferences
set timezone = locations.timezone,
    updated_at = now()
from public.prayer_locations locations
where locations.user_id = preferences.user_id
  and locations.is_default is true
  and locations.timezone is not null
  and btrim(locations.timezone) <> '';

create or replace function public.plan_background_reminder_deliveries(
  now_at timestamptz default now()
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  inserted_count integer := 0;
begin
  insert into public.prayer_notification_deliveries (
    user_id,
    push_subscription_id,
    prayer_name,
    notification_kind,
    notification_text,
    scheduled_at
  )
  select
    subscriptions.user_id,
    subscriptions.id,
    case when reminder.kind = 'dhikr' then 'Dhikr' else 'Salawat' end,
    reminder.kind,
    case
      when reminder.kind = 'dhikr'
        then 'سبحان الله وبحمده، سبحان الله العظيم'
      else 'اللهم صل وسلم على نبينا محمد'
    end,
    next_slot.scheduled_at
  from public.push_subscriptions subscriptions
  join public.background_reminder_preferences preferences
    on preferences.user_id = subscriptions.user_id
  cross join lateral (
    values
      ('dhikr'::text, preferences.dhikr_enabled, preferences.dhikr_interval_minutes),
      ('salawat'::text, preferences.salawat_enabled, preferences.salawat_interval_minutes)
  ) as reminder(kind, enabled, interval_minutes)
  cross join lateral (
    select
      date_trunc('minute', now_at)
      + (
        reminder.interval_minutes
        * floor(
          extract(epoch from (now_at - date_trunc('day', now_at)))
          / 60
          / reminder.interval_minutes
          + 1
        )
      ) * interval '1 minute' as scheduled_at
  ) as next_slot
  left join pg_catalog.pg_timezone_names timezone
    on timezone.name = preferences.timezone
  cross join lateral (
    select
      (next_slot.scheduled_at at time zone coalesce(timezone.name, 'UTC'))::time
        as local_time
  ) as local_clock
  where subscriptions.is_active is true
    and reminder.enabled is true
    and reminder.interval_minutes > 0
    and (
      preferences.quiet_hours_start is null
      or preferences.quiet_hours_end is null
      or preferences.quiet_hours_start = preferences.quiet_hours_end
      or case
        when preferences.quiet_hours_start < preferences.quiet_hours_end then
          local_clock.local_time < preferences.quiet_hours_start
          or local_clock.local_time >= preferences.quiet_hours_end
        else
          local_clock.local_time < preferences.quiet_hours_start
          and local_clock.local_time >= preferences.quiet_hours_end
      end
    )
  on conflict (push_subscription_id, notification_kind, scheduled_at) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$function$;

revoke all on function public.plan_background_reminder_deliveries(timestamptz)
  from public, anon, authenticated;
grant execute on function public.plan_background_reminder_deliveries(timestamptz)
  to service_role;

commit;
