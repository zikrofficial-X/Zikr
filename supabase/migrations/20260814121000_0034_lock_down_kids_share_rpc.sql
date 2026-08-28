-- The share counter is invoked by the server-side route through a service-role
-- client. Do not expose this SECURITY DEFINER function through PostgREST.
REVOKE ALL ON FUNCTION public.increment_kids_content_shares(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_kids_content_shares(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_kids_content_shares(text) TO service_role;
