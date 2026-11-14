\set ON_ERROR_STOP on

DO $policy$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'prophet_sections'
      AND policyname = 'allow_public_read'
  ) THEN
    RAISE EXCEPTION 'The unrestricted prophet section policy must be removed';
  END IF;
END
$policy$;

BEGIN;
SET LOCAL ROLE anon;
DO $anon$
BEGIN
  IF (SELECT count(*) FROM public.prophet_sections) <> 1 THEN
    RAISE EXCEPTION 'Anonymous clients must see only sections of published prophets';
  END IF;
END
$anon$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL test.is_admin = 'false';
DO $authenticated$
BEGIN
  IF (SELECT count(*) FROM public.prophet_sections) <> 1 THEN
    RAISE EXCEPTION 'Authenticated non-admin clients must see only published prophet sections';
  END IF;
END
$authenticated$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL test.is_admin = 'true';
DO $admin$
BEGIN
  IF (SELECT count(*) FROM public.prophet_sections) <> 2 THEN
    RAISE EXCEPTION 'Admins must retain access to unpublished prophet sections for editorial review';
  END IF;
END
$admin$;
COMMIT;
