\set ON_ERROR_STOP on

BEGIN;
SET LOCAL ROLE anon;
DO $anon$
BEGIN
  IF (SELECT count(*) FROM public.kids_game_levels) <> 1 THEN
    RAISE EXCEPTION 'Anonymous clients must see only published levels of published games';
  END IF;
END
$anon$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL test.is_admin = 'false';
DO $authenticated$
BEGIN
  IF (SELECT count(*) FROM public.kids_game_levels) <> 0 THEN
    RAISE EXCEPTION 'Authenticated non-admin clients must not bypass the anonymous-only public policy';
  END IF;
END
$authenticated$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL test.is_admin = 'true';
DO $admin$
BEGIN
  IF (SELECT count(*) FROM public.kids_game_levels) <> 3 THEN
    RAISE EXCEPTION 'Admins must retain access to all Kids levels for editorial review';
  END IF;
END
$admin$;
COMMIT;
