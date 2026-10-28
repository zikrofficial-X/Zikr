-- Avoid evaluating auth.uid() once per candidate row in the admin alert read policy.
-- This preserves the same authorization rule while allowing Postgres to init-plan the user id.
DROP POLICY IF EXISTS admin_queue_alert_deliveries_admin_read
  ON public.admin_queue_alert_deliveries;

CREATE POLICY admin_queue_alert_deliveries_admin_read
  ON public.admin_queue_alert_deliveries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_role_assignments a
      WHERE a.user_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND p.role = 'admin'
    )
  );
