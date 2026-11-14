\set ON_ERROR_STOP on
SET TIME ZONE 'UTC';
DO $assert$
DECLARE
  inserted_count integer;
  cairo_slot timestamptz;
  new_york_slot timestamptz;
  cairo_timezone text;
BEGIN
  SELECT public.plan_background_reminder_deliveries('2026-11-11 07:37:35+00'::timestamptz)
  INTO inserted_count;

  IF inserted_count <> 2 THEN
    RAISE EXCEPTION 'Expected two first-run reminder slots, received %', inserted_count;
  END IF;

  SELECT public.plan_background_reminder_deliveries('2026-11-11 07:37:35+00'::timestamptz)
  INTO inserted_count;

  IF inserted_count <> 0 THEN
    RAISE EXCEPTION 'Expected the same interval window to be idempotent, received % duplicate slot(s)', inserted_count;
  END IF;

  SELECT timezone
  INTO cairo_timezone
  FROM public.background_reminder_preferences
  WHERE user_id = '10000000-0000-4000-8000-000000000001';

  IF cairo_timezone <> 'Africa/Cairo' THEN
    RAISE EXCEPTION 'Expected migration to backfill the Cairo timezone, received %', cairo_timezone;
  END IF;

  SELECT scheduled_at
  INTO cairo_slot
  FROM public.prayer_notification_deliveries
  WHERE push_subscription_id = '30000000-0000-4000-8000-000000000001'
    AND notification_kind = 'dhikr';

  IF cairo_slot <> '2026-11-11 07:45:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Expected the next 15-minute UTC slot at 07:45Z, received %', cairo_slot;
  END IF;

  SELECT scheduled_at
  INTO new_york_slot
  FROM public.prayer_notification_deliveries
  WHERE push_subscription_id = '30000000-0000-4000-8000-000000000002'
    AND notification_kind = 'salawat';

  IF new_york_slot <> '2026-11-11 08:00:00+00'::timestamptz THEN
    RAISE EXCEPTION 'Expected the next 60-minute UTC slot at 08:00Z, received %', new_york_slot;
  END IF;

  SELECT public.plan_background_reminder_deliveries('2026-11-11 20:37:35+00'::timestamptz)
  INTO inserted_count;

  IF inserted_count <> 1 THEN
    RAISE EXCEPTION 'Expected only the non-quiet-hours account to receive a second slot, received %', inserted_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.prayer_notification_deliveries
    WHERE push_subscription_id = '30000000-0000-4000-8000-000000000001'
      AND scheduled_at = '2026-11-11 20:45:00+00'::timestamptz
  ) THEN
    RAISE EXCEPTION 'A Cairo reminder was incorrectly scheduled inside 22:00-06:00 quiet hours';
  END IF;
END
$assert$;

DO $disabled_intervals$
DECLARE
  inserted_count integer;
BEGIN
  UPDATE public.background_reminder_preferences
  SET dhikr_interval_minutes = 0
  WHERE user_id = '10000000-0000-4000-8000-000000000001';

  UPDATE public.background_reminder_preferences
  SET salawat_interval_minutes = 0
  WHERE user_id = '10000000-0000-4000-8000-000000000002';

  SELECT public.plan_background_reminder_deliveries('2026-11-11 21:37:35+00'::timestamptz)
  INTO inserted_count;

  IF inserted_count <> 0 THEN
    RAISE EXCEPTION 'Expected disabled zero-minute intervals to create no reminders, received %', inserted_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.prayer_notification_deliveries
    WHERE notification_kind IN ('dhikr', 'salawat')
      AND scheduled_at > '2026-11-11 21:37:35+00'::timestamptz
  ) THEN
    RAISE EXCEPTION 'A disabled zero-minute interval created a future background reminder';
  END IF;
END
$disabled_intervals$;
