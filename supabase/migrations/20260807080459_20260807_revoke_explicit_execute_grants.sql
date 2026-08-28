-- Revoke explicit EXECUTE grants from anon and authenticated on
-- trigger SECURITY DEFINER functions. The earlier REVOKE FROM PUBLIC
-- was not sufficient because Supabase grants EXECUTE to anon and
-- authenticated explicitly (not just via PUBLIC inheritance).

DO $$
BEGIN
  IF to_regprocedure('public.create_profile_for_new_user()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.create_profile_for_new_user() FROM anon, authenticated;
  END IF;

  IF to_regprocedure('public.create_profile_on_login()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.create_profile_on_login() FROM anon, authenticated;
  END IF;

  IF to_regprocedure('public.ensure_profile_for_user()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.ensure_profile_for_user() FROM anon, authenticated;
  END IF;
END;
$$;

-- For is_admin_user: revoke from anon (no valid session), keep
-- authenticated only (already granted in the previous migration,
-- but revoke from anon explicitly). Guard this for partial local replays.
DO $$
BEGIN
  IF to_regprocedure('public.is_admin_user()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.is_admin_user() FROM anon;
  END IF;
END;
$$;
