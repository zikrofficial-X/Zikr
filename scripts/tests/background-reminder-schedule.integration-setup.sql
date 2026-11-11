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
  dhikr_interval_minutes integer NOT NULL DEFAULT 60,
  salawat_enabled boolean NOT NULL DEFAULT false,
  salawat_interval_minutes integer NOT NULL DEFAULT 60,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prayer_locations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  timezone text,
  is_default boolean NOT NULL DEFAULT false
);

CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE public.prayer_notification_deliveries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  push_subscription_id uuid NOT NULL,
  prayer_name text NOT NULL,
  notification_kind text NOT NULL,
  notification_text text,
  scheduled_at timestamptz NOT NULL,
  CONSTRAINT prayer_notification_deliveries_reminder_unique
    UNIQUE (push_subscription_id, notification_kind, scheduled_at)
);
