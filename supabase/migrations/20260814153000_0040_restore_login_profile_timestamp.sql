-- Restore the login-profile synchronization behavior that existed before the
-- profile hardening migration. The prior trigger tracked successful sign-ins in
-- profiles.last_login_at; keep the existing RLS and sensitive-field safeguards.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

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
    SET last_login_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.create_profile_on_login() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_profile_on_login() FROM anon;
REVOKE ALL ON FUNCTION public.create_profile_on_login() FROM authenticated;
