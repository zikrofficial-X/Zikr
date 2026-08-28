-- Make the admin predicate safe for RLS evaluation without requiring direct
-- access to public.profiles from anonymous public-read requests.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION private.is_admin_user() FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_admin_user() TO anon, authenticated, service_role;

DO $$
DECLARE
  policy_record record;
BEGIN
  FOR policy_record IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        coalesce(qual, '') ILIKE '%profiles%'
        OR coalesce(with_check, '') ILIKE '%profiles%'
      )
  LOOP
    IF policy_record.cmd = 'SELECT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING (private.is_admin_user())',
        policy_record.policyname,
        policy_record.tablename
      );
    ELSIF policy_record.cmd = 'INSERT' THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I WITH CHECK (private.is_admin_user())',
        policy_record.policyname,
        policy_record.tablename
      );
    ELSE
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING (private.is_admin_user()) WITH CHECK (private.is_admin_user())',
        policy_record.policyname,
        policy_record.tablename
      );
    END IF;
  END LOOP;
END
$$;
