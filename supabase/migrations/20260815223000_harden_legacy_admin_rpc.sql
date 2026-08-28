-- The application and RLS policies use private.is_admin_user().
-- public.is_admin_user() is a legacy duplicate and must not be callable through
-- the Data API by client roles.
DO $$
BEGIN
  IF to_regprocedure('public.is_admin_user()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM PUBLIC, anon, authenticated, service_role;
  END IF;
END;
$$;
