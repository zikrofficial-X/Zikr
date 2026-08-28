-- The profile guard only inspects OLD/NEW rows and auth context. It does not
-- need elevated database privileges, so keep it out of the SECURITY DEFINER
-- attack surface and make direct RPC invocation unavailable to API roles.

CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.role() <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
      NEW.email := NULL;
    ELSIF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'role and email are managed by the authentication system'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_profile_sensitive_fields() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.guard_profile_sensitive_fields() FROM anon;
REVOKE ALL ON FUNCTION public.guard_profile_sensitive_fields() FROM authenticated;
