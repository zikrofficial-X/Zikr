-- admin_control_center_snapshot is not referenced by the application and is SECURITY DEFINER.
-- Keep it unavailable through the public PostgREST API.
REVOKE EXECUTE ON FUNCTION public.admin_control_center_snapshot() FROM PUBLIC, anon, authenticated;
