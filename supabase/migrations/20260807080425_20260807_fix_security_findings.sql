-- ============================================================
-- 1. Move pg_trgm and unaccent extensions out of the public schema
-- ============================================================
-- Both extensions are relocatable. We create a dedicated schema
-- and move them there so their objects no longer live in `public`,
-- which is exposed via the Data API.

CREATE SCHEMA IF NOT EXISTS extensions;

-- Supabase exposes these extensions as installable extensions, but local
-- validation environments may not ship every optional extension. Enable only
-- extensions advertised by PostgreSQL, then relocate existing installations.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'unaccent'
  ) THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions';
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'pg_trgm'
      AND extnamespace <> 'extensions'::regnamespace
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_extension
    WHERE extname = 'unaccent'
      AND extnamespace <> 'extensions'::regnamespace
  ) THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END;
$$;

-- ============================================================
-- 2. Lock down trigger SECURITY DEFINER functions
-- ============================================================
-- create_profile_for_new_user, create_profile_on_login, and
-- ensure_profile_for_user are trigger functions called by triggers
-- on auth.users. They must run as SECURITY DEFINER (the table owner)
-- to insert into public.profiles, but they should NOT be callable as
-- RPC endpoints by anon/authenticated roles. Revoke EXECUTE from
-- PUBLIC (inherited by anon and authenticated) so they can only be
-- invoked by the trigger mechanism.

DO $$
BEGIN
  IF to_regprocedure('public.create_profile_for_new_user()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.create_profile_for_new_user() FROM PUBLIC;
  END IF;

  IF to_regprocedure('public.create_profile_on_login()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.create_profile_on_login() FROM PUBLIC;
  END IF;

  IF to_regprocedure('public.ensure_profile_for_user()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.ensure_profile_for_user() FROM PUBLIC;
  END IF;
END;
$$;

-- ============================================================
-- 3. Switch is_admin_user to SECURITY INVOKER + restrict EXECUTE
-- ============================================================
-- is_admin_user() is a helper that checks the profiles table for an
-- 'admin' role. As SECURITY DEFINER it ran as the owner and was
-- callable by anyone via the Data API. The profiles table has a
-- public SELECT policy, so an INVOKER function can read it fine.
-- We also restrict EXECUTE to authenticated only, since anon has no
-- valid auth.uid() and should not be probing for admin accounts.

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;
