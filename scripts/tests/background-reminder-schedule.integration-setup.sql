DO $roles$
BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

DO $roles$
BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

DO $roles$
BEGIN
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

CREATE TABLE public.background_reminder_preferences (
  user_id uuid PRIMARY KEY,
  dhikr_enabled boolean NOT NULL DEFAULT false,
  dhikr_interval_minutes integer NOT NULL DEFAULT 60 CHECK (dhikr_interval_minutes IN (15, 30, 60, 120)),
  salawat_enabled boolean NOT NULL DEFAULT false,
  salawat_interval_minutes integer NOT NULL DEFAULT 60 CHECK (salawat_interval_minutes IN (15, 30, 60, 120)),
  quiet_hours_start time,
  quiet_hours_end time,
  quran_enabled boolean NOT NULL DEFAULT false,
  quran_time time NOT NULL DEFAULT '20:00',
  quran_message text NOT NULL DEFAULT 'Daily Quran reminder',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prayer_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  city text NOT NULL,
  timezone text,
  is_default boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX prayer_locations_one_default_per_user_idx
  ON public.prayer_locations (user_id)
  WHERE is_default;

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE CHECK (endpoint LIKE 'https://%'),
  p256dh text NOT NULL CHECK (char_length(p256dh) >= 16),
  auth text NOT NULL CHECK (char_length(auth) >= 8),
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.prayer_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  push_subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id) ON DELETE CASCADE,
  prayer_name text NOT NULL CHECK (
    prayer_name IN ('Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha', 'Dhikr', 'Salawat')
  ),
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')
  ),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  processing_at timestamptz,
  processed_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  retry_after timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  notification_kind text NOT NULL DEFAULT 'prayer' CHECK (
    notification_kind IN ('prayer', 'dhikr', 'salawat')
  ),
  notification_text text,
  CONSTRAINT prayer_notification_deliveries_prayer_unique
    UNIQUE (push_subscription_id, prayer_name, scheduled_at)
);

-- Production has both uniqueness guards. The worker's ON CONFLICT target uses
-- the dedicated notification-kind index introduced for background reminders.
CREATE UNIQUE INDEX prayer_delivery_kind_schedule_idx
  ON public.prayer_notification_deliveries (push_subscription_id, notification_kind, scheduled_at);

INSERT INTO public.background_reminder_preferences (
  user_id,
  dhikr_enabled,
  dhikr_interval_minutes,
  salawat_enabled,
  salawat_interval_minutes,
  quiet_hours_start,
  quiet_hours_end
)
VALUES
  ('10000000-0000-4000-8000-000000000001', true, 15, false, 60, '22:00', '06:00'),
  ('10000000-0000-4000-8000-000000000002', false, 60, true, 60, NULL, NULL);

INSERT INTO public.prayer_locations (id, user_id, city, timezone, is_default)
VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Cairo', 'Africa/Cairo', true),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'New York', 'America/New_York', true);

INSERT INTO public.push_subscriptions (id, user_id, endpoint, p256dh, auth, is_active)
VALUES
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'https://push.example/subscription/1', '1234567890123456', '12345678', true),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'https://push.example/subscription/2', 'abcdefghijklmnop', 'abcdefgh', true);
