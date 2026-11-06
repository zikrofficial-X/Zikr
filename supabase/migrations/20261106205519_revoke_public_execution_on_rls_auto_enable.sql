-- The RLS event trigger remains owned by postgres and continues to run
-- for DDL. Its SECURITY DEFINER function must not be callable through the
-- exposed Data API by anon or authenticated users. The trigger is managed by
-- Supabase and may not exist in a fresh local replay, so guard its presence.
DO $migration$
BEGIN
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END;
$migration$;
