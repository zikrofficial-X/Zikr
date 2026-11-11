\set ON_ERROR_STOP on

BEGIN;
SET LOCAL ROLE anon;
DO $anon$
BEGIN
  IF (SELECT count(*) FROM public.kids_game_levels) <> 1 THEN
    RAISE EXCEPTION 'Anonymous clients must see only published levels of published games';
  END IF;
  IF has_table_privilege('anon', 'public.kids_game_questions', 'SELECT') THEN
    RAISE EXCEPTION 'Anonymous clients must not have direct SELECT privilege on question rows containing correct_index';
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
  IF (SELECT count(*) FROM public.kids_game_questions) <> 0 THEN
    RAISE EXCEPTION 'Authenticated non-admin clients must not bypass the anonymous-only question policy';
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
  IF (SELECT count(*) FROM public.kids_game_questions) <> 4 THEN
    RAISE EXCEPTION 'Admins must retain access to all Kids questions for editorial review';
  END IF;
END
$admin$;
COMMIT;

DO $policy_contract$
BEGIN
  IF (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_game_levels'
      AND policyname = 'kids_game_levels_admin_all'
  ) <> 1 THEN
    RAISE EXCEPTION 'Kids levels must retain exactly one admin ALL policy';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_game_levels'
      AND policyname = 'admin_all_kids_game_levels_select'
  ) THEN
    RAISE EXCEPTION 'The duplicate Kids levels admin SELECT policy must not remain';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_game_questions'
      AND policyname = 'kids_game_questions_admin_all'
  ) <> 1 THEN
    RAISE EXCEPTION 'Kids questions must retain exactly one admin ALL policy';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_game_questions'
      AND policyname = 'admin_all_kids_game_questions_select'
  ) THEN
    RAISE EXCEPTION 'The duplicate Kids questions admin SELECT policy must not remain';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_game_questions'
      AND policyname = 'kids_game_questions_public_read'
  ) THEN
    RAISE EXCEPTION 'The answer-key table must not retain a public read policy';
  END IF;
END
$policy_contract$;
