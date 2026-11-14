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
    RAISE EXCEPTION 'Authenticated non-admin clients must not bypass the anonymous-only parent-scoped level policy';
  END IF;
  IF (SELECT count(*) FROM public.kids_game_questions) <> 0 THEN
    RAISE EXCEPTION 'Authenticated non-admin clients must not read published question rows containing correct_index';
  END IF;
  IF NOT has_table_privilege('authenticated', 'public.kids_game_questions', 'SELECT') THEN
    RAISE EXCEPTION 'Authenticated role should retain table privilege while RLS restricts answer-key visibility to admins';
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
      AND policyname IN (
        'admin_all_kids_game_levels_select',
        'kids_game_levels_admin_select',
        'kids_game_levels_admin_insert',
        'kids_game_levels_admin_update',
        'kids_game_levels_admin_delete'
      )
  ) THEN
    RAISE EXCEPTION 'Legacy Kids levels policies must be removed in favor of the parent-scoped anon policy and admin ALL policy';
  END IF;

  IF (
    SELECT count(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_game_questions'
      AND policyname = 'kids_game_questions_admin_select'
      AND coalesce(qual, '') ILIKE '%private.is_admin_user%'
      AND coalesce(qual, '') NOT ILIKE '%published%'
  ) <> 1 THEN
    RAISE EXCEPTION 'Kids question SELECT must be restricted to administrators, not all authenticated users';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'kids_game_questions'
      AND policyname IN (
        'kids_game_questions_public_read',
        'kids_game_questions_admin_all',
        'admin_all_kids_game_questions_select'
      )
  ) THEN
    RAISE EXCEPTION 'Kids answer-key table must not retain a public or duplicate broad admin policy';
  END IF;
END
$policy_contract$;


-- RLS does not apply to TRUNCATE or maintenance privileges. Prove that the
-- migrations remove the broad legacy grants rather than relying on row policies.
DO $privilege_contract$
BEGIN
  IF has_table_privilege('anon', 'public.kids_game_levels', 'INSERT')
    OR has_table_privilege('anon', 'public.kids_game_levels', 'UPDATE')
    OR has_table_privilege('anon', 'public.kids_game_levels', 'DELETE')
    OR has_table_privilege('anon', 'public.kids_game_levels', 'TRUNCATE')
    OR has_table_privilege('anon', 'public.kids_game_levels', 'REFERENCES')
    OR has_table_privilege('anon', 'public.kids_game_levels', 'TRIGGER')
    OR has_table_privilege('anon', 'public.kids_game_levels', 'MAINTAIN') THEN
    RAISE EXCEPTION 'Anonymous level access must be read-only and must not retain non-DML privileges';
  END IF;

  IF has_table_privilege('authenticated', 'public.kids_game_levels', 'TRUNCATE')
    OR has_table_privilege('authenticated', 'public.kids_game_levels', 'REFERENCES')
    OR has_table_privilege('authenticated', 'public.kids_game_levels', 'TRIGGER')
    OR has_table_privilege('authenticated', 'public.kids_game_levels', 'MAINTAIN') THEN
    RAISE EXCEPTION 'Authenticated level editors must not retain non-DML privileges that bypass RLS';
  END IF;

  IF has_table_privilege('anon', 'public.kids_game_questions', 'SELECT')
    OR has_table_privilege('anon', 'public.kids_game_questions', 'INSERT')
    OR has_table_privilege('anon', 'public.kids_game_questions', 'UPDATE')
    OR has_table_privilege('anon', 'public.kids_game_questions', 'DELETE')
    OR has_table_privilege('anon', 'public.kids_game_questions', 'TRUNCATE')
    OR has_table_privilege('anon', 'public.kids_game_questions', 'REFERENCES')
    OR has_table_privilege('anon', 'public.kids_game_questions', 'TRIGGER')
    OR has_table_privilege('anon', 'public.kids_game_questions', 'MAINTAIN') THEN
    RAISE EXCEPTION 'Anonymous clients must not retain any table-level access to Kids answer keys';
  END IF;

  IF has_table_privilege('authenticated', 'public.kids_game_questions', 'INSERT')
    OR has_table_privilege('authenticated', 'public.kids_game_questions', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.kids_game_questions', 'DELETE')
    OR has_table_privilege('authenticated', 'public.kids_game_questions', 'TRUNCATE')
    OR has_table_privilege('authenticated', 'public.kids_game_questions', 'REFERENCES')
    OR has_table_privilege('authenticated', 'public.kids_game_questions', 'TRIGGER')
    OR has_table_privilege('authenticated', 'public.kids_game_questions', 'MAINTAIN') THEN
    RAISE EXCEPTION 'Authenticated clients must have SELECT-only access to Kids answer keys';
  END IF;
END
$privilege_contract$;
