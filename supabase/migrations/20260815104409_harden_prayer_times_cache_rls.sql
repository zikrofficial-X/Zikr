-- The legacy prayer_times_cache table is a public read cache.
-- It is not used by the application as a user-owned table, so authenticated
-- clients must not be able to mutate shared cache rows.
DO $$
BEGIN
  IF to_regclass('public.prayer_times_cache') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS prayer_times_cache_user_access ON public.prayer_times_cache';
    EXECUTE 'DROP POLICY IF EXISTS "prayer_times_cache_authenticated_all" ON public.prayer_times_cache';
    EXECUTE 'CREATE POLICY "prayer_times_cache_public_read_only" ON public.prayer_times_cache FOR SELECT TO public USING (true)';
  END IF;
END
$$;
