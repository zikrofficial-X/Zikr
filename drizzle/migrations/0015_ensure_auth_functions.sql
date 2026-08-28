-- ============================================================
-- Migration 0015: Ensure auth functions exist before any
-- ALTER FUNCTION statements (Supabase security advisor hardening).
--
-- Supabase's security advisor emits:
--   ALTER FUNCTION public.handle_new_user() SET search_path = public, auth
-- If that runs before 0014 has been applied on a fresh DB, Postgres throws
-- "function does not exist" (SQLSTATE 42883).
--
-- This migration guarantees handle_new_user() and set_updated_at() always
-- exist with the correct search_path, making it safe for the advisor to
-- ALTER them at any time.
-- ============================================================

-- set_updated_at: used by all table updated_at triggers.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- handle_new_user: fires on auth.users INSERT to auto-create a profile.
-- Marked SECURITY DEFINER so it can write to public.profiles regardless of
-- the calling role. search_path is pinned to prevent search_path injection.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ar')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Ensure the auth trigger is wired up (idempotent).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
