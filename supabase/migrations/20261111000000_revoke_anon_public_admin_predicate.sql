-- The compatibility wrapper is SECURITY INVOKER and delegates to the private
-- administrator predicate. Anonymous clients do not need to execute it; authenticated
-- RLS policies retain their existing EXECUTE permission.
REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM anon;
