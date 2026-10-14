-- Disable the one-off Quran tafsir seed-loader role after the verified seed restore.
-- Public reading remains enabled; authenticated admin writes keep their dedicated policies.
-- Safe for fresh project replay where the temporary role or policy does not exist.
DO $migration$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'zikr_seed_loader') THEN
    EXECUTE 'ALTER ROLE zikr_seed_loader NOLOGIN';
    EXECUTE 'REVOKE ALL PRIVILEGES ON TABLE public.quran_tafsir FROM zikr_seed_loader';
  END IF;

  IF to_regclass('public.quran_tafsir') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS tmp_zikr_seed_loader ON public.quran_tafsir';
  END IF;
END;
$migration$;
