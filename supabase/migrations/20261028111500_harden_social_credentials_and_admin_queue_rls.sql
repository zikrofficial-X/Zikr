-- Explicitly keep social publishing credentials inaccessible to browser roles.
-- The server-side service_role remains the only supported access path.
REVOKE ALL ON TABLE public.social_platform_credentials FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS social_platform_credentials_deny_anon
  ON public.social_platform_credentials;
CREATE POLICY social_platform_credentials_deny_anon
  ON public.social_platform_credentials
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

DROP POLICY IF EXISTS social_platform_credentials_deny_authenticated
  ON public.social_platform_credentials;
CREATE POLICY social_platform_credentials_deny_authenticated
  ON public.social_platform_credentials
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Avoid per-row re-evaluation of auth.uid() in this authenticated admin-read policy.
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

COMMENT ON TABLE public.social_platform_credentials IS
  'Social platform credentials are restricted to server-side service_role access; anon and authenticated clients are explicitly denied by privileges and restrictive RLS policies.';

COMMENT ON POLICY social_platform_credentials_deny_anon
  ON public.social_platform_credentials IS
  'Fail-closed policy: anonymous browser clients must never read or mutate social publishing credentials.';

COMMENT ON POLICY social_platform_credentials_deny_authenticated
  ON public.social_platform_credentials IS
  'Fail-closed policy: authenticated browser clients must never read or mutate social publishing credentials.';
