-- The settings UI and reminder hooks use interval 0 as an explicit disabled value.
-- The background planner already filters interval_minutes > 0, so zero is never scheduled.
begin;

alter table public.background_reminder_preferences
  drop constraint if exists background_reminder_preferences_dhikr_interval_minutes_check;

alter table public.background_reminder_preferences
  drop constraint if exists background_reminder_preferences_salawat_interval_minutes_check;

alter table public.background_reminder_preferences
  add constraint background_reminder_preferences_dhikr_interval_minutes_check
    check (dhikr_interval_minutes in (0, 15, 30, 60, 120));

alter table public.background_reminder_preferences
  add constraint background_reminder_preferences_salawat_interval_minutes_check
    check (salawat_interval_minutes in (0, 15, 30, 60, 120));

commit;
