-- admin_control_center_snapshot is not referenced by the application and is SECURITY DEFINER.
-- Keep it unavailable through the public PostgREST API when present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='admin_control_center_snapshot' AND p.pronargs=0
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.admin_control_center_snapshot() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;
