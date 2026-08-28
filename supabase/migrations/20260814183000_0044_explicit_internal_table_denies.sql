-- These tables are intentionally service-role-only. Keep explicit deny
-- policies when the tables exist, while remaining safe on reduced previews.
DO $$
BEGIN
  IF to_regclass('public.prayer_schedule_cache') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS prayer_schedule_cache_no_public_access ON public.prayer_schedule_cache';
    EXECUTE 'CREATE POLICY prayer_schedule_cache_no_public_access ON public.prayer_schedule_cache FOR ALL TO public USING (false) WITH CHECK (false)';
  END IF;

  IF to_regclass('public.push_runtime_settings') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS push_runtime_settings_no_public_access ON public.push_runtime_settings';
    EXECUTE 'CREATE POLICY push_runtime_settings_no_public_access ON public.push_runtime_settings FOR ALL TO public USING (false) WITH CHECK (false)';
  END IF;
END
$$;
