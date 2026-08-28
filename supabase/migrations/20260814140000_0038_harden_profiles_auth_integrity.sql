-- Harden profile confidentiality and integrity without changing the public schema.
-- This migration is intentionally idempotent because earlier deployments applied
-- several profile-policy variants outside the canonical repository history.

-- Authenticated users only need to read their own profile. Administrators retain
-- access through the SECURITY DEFINER predicate without exposing profile emails
-- or roles to every authenticated account.
DROP POLICY IF EXISTS "profiles_select_own_or_public" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_self_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR private.is_admin_user()
  );

-- Direct profile writes occur under an authenticated JWT.  The client may manage
-- presentation preferences but must never assign a role or store an arbitrary
-- email address.  Auth triggers and service-role operations execute without an
-- end-user auth.uid(), so trusted identity synchronization remains functional.
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS guard_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER guard_profile_sensitive_fields
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_sensitive_fields();

-- The deployed login trigger previously wrote profiles.last_login_at even though
-- that column does not exist.  An AFTER UPDATE trigger exception can prevent
-- successful sign-in completion, so only update the maintained timestamp.
CREATE OR REPLACE FUNCTION public.create_profile_on_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE
    SET updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_profile_on_login() FROM PUBLIC;
