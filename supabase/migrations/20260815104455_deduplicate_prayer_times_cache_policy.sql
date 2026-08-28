-- Keep one explicit read-only policy for the legacy public prayer cache.
DO $$
BEGIN
  IF to_regclass('public.prayer_times_cache') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Public can read prayer times cache" ON public.prayer_times_cache';
  END IF;
END
$$;
