-- Promote the requested existing Supabase Auth account to the primary admin.
-- This is intentionally a no-op when the account has not registered yet.
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE lower(email) = 'mohamed.alaa7785@gmail.com'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Primary admin account is not registered yet; skipping promotion.';
    RETURN;
  END IF;

  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = target_user_id;

  IF to_regclass('public.admin_role_assignments') IS NOT NULL THEN
    INSERT INTO public.admin_role_assignments (user_id, role, created_by)
    VALUES (target_user_id, 'super_admin', target_user_id)
    ON CONFLICT (user_id) DO UPDATE
      SET role = 'super_admin', updated_at = now();
  END IF;
END
$$;
