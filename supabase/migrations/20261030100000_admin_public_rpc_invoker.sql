-- The public compatibility wrapper is used by RLS policies on legacy content tables.
-- It must run with the caller's privileges; the private predicate performs the narrowly
-- scoped role lookup with its own hardened SECURITY DEFINER implementation.
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT private.is_admin_user();
$function$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.is_admin_user() IS
  'Non-privileged compatibility wrapper for row-level security policies; delegates role resolution to the private predicate.';
