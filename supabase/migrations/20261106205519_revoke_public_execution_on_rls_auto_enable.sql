-- The RLS event trigger remains owned by postgres and continues to run
-- for DDL. Its SECURITY DEFINER function must not be callable through the
-- exposed Data API by anon or authenticated users.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
