CREATE TABLE IF NOT EXISTS public.admin_queue_alert_deliveries (
  alert_key text PRIMARY KEY,
  queue_name text NOT NULL CHECK (queue_name IN ('video', 'social')),
  failed_count integer NOT NULL CHECK (failed_count > 0),
  webhook_sent boolean NOT NULL DEFAULT false,
  email_sent boolean NOT NULL DEFAULT false,
  delivered_at timestamptz,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_queue_alert_deliveries_created_at
  ON public.admin_queue_alert_deliveries (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_queue_alert_deliveries_queue
  ON public.admin_queue_alert_deliveries (queue_name, created_at DESC);

ALTER TABLE public.admin_queue_alert_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_queue_alert_deliveries_admin_read ON public.admin_queue_alert_deliveries;
CREATE POLICY admin_queue_alert_deliveries_admin_read
  ON public.admin_queue_alert_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_role_assignments a WHERE a.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

COMMENT ON TABLE public.admin_queue_alert_deliveries IS
  'Idempotency and delivery audit records for new video/social queue failure alerts.';
