-- Keep social publishing credentials inaccessible to browser roles.
-- The server-side service_role remains the only supported access path.
REVOKE ALL ON TABLE public.social_platform_credentials
  FROM PUBLIC, anon, authenticated;

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

COMMENT ON TABLE public.social_platform_credentials IS
  'Social platform credentials are restricted to server-side service_role access; anon and authenticated clients are explicitly denied by privileges and restrictive RLS policies.';

COMMENT ON POLICY social_platform_credentials_deny_anon
  ON public.social_platform_credentials IS
  'Fail-closed policy: anonymous browser clients must never read or mutate social publishing credentials.';

COMMENT ON POLICY social_platform_credentials_deny_authenticated
  ON public.social_platform_credentials IS
  'Fail-closed policy: authenticated browser clients must never read or mutate social publishing credentials.';
