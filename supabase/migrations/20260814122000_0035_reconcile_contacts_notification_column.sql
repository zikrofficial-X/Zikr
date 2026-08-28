-- Reconcile the legacy production contacts column with the canonical schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'notificationsent'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'contacts'
      AND column_name = 'notification_sent'
  ) THEN
    ALTER TABLE public.contacts
      RENAME COLUMN notificationsent TO notification_sent;
  END IF;
END
$$;

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS notification_sent boolean NOT NULL DEFAULT false;
