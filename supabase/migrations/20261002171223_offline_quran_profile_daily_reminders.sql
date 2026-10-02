BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS preferred_reciter_code text,
  ADD COLUMN IF NOT EXISTS daily_wird_target integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Cairo';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_daily_wird_target_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_daily_wird_target_check
      CHECK (daily_wird_target BETWEEN 1 AND 6236);
  END IF;
END $$;

ALTER TABLE public.background_reminder_preferences
  ADD COLUMN IF NOT EXISTS quran_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS quran_time time without time zone NOT NULL DEFAULT '20:00:00',
  ADD COLUMN IF NOT EXISTS quran_message text NOT NULL DEFAULT 'اهدأ قليلًا… وافتح وردك اليومي. آية واحدة قد تغيّر يومك.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'background_reminder_preferences_quran_time_check'
  ) THEN
    ALTER TABLE public.background_reminder_preferences
      ADD CONSTRAINT background_reminder_preferences_quran_time_check
      CHECK (quran_time >= '00:00:00'::time AND quran_time < '24:00:00'::time);
  END IF;
END $$;

COMMIT;
