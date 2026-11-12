DO $roles$
BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

DO $roles$
BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END
$roles$;

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
AS $function$
  SELECT COALESCE(current_setting('test.is_admin', true), 'false') = 'true';
$function$;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin_user() TO authenticated;

CREATE TABLE public.kids_games (
  id uuid PRIMARY KEY,
  published boolean NOT NULL DEFAULT false
);

CREATE TABLE public.kids_game_levels (
  id uuid PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.kids_games(id),
  level_no integer NOT NULL,
  published boolean NOT NULL DEFAULT false
);

ALTER TABLE public.kids_game_levels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.kids_game_questions (
  id uuid PRIMARY KEY,
  level_id uuid NOT NULL REFERENCES public.kids_game_levels(id),
  published boolean NOT NULL DEFAULT false,
  correct_index integer NOT NULL
);

ALTER TABLE public.kids_game_questions ENABLE ROW LEVEL SECURITY;

-- Reproduce the pre-remediation policies from the production migration chain.
-- These legacy SELECT policies are intentionally permissive so the following
-- migrations must replace them, not merely pass against an already-clean setup.
CREATE POLICY kids_game_levels_public_read
  ON public.kids_game_levels
  FOR SELECT
  TO anon
  USING (published IS TRUE);

CREATE POLICY kids_game_levels_admin_select
  ON public.kids_game_levels
  FOR SELECT
  TO authenticated
  USING (published IS TRUE OR private.is_admin_user());

CREATE POLICY kids_game_levels_admin_insert
  ON public.kids_game_levels
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_user());

CREATE POLICY kids_game_levels_admin_update
  ON public.kids_game_levels
  FOR UPDATE
  TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

CREATE POLICY kids_game_levels_admin_delete
  ON public.kids_game_levels
  FOR DELETE
  TO authenticated
  USING (private.is_admin_user());

CREATE POLICY kids_game_questions_public_read
  ON public.kids_game_questions
  FOR SELECT
  TO anon
  USING (published IS TRUE);

CREATE POLICY kids_game_questions_admin_select
  ON public.kids_game_questions
  FOR SELECT
  TO authenticated
  USING (published IS TRUE OR private.is_admin_user());

CREATE POLICY kids_game_questions_admin_insert
  ON public.kids_game_questions
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin_user());

CREATE POLICY kids_game_questions_admin_update
  ON public.kids_game_questions
  FOR UPDATE
  TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

CREATE POLICY kids_game_questions_admin_delete
  ON public.kids_game_questions
  FOR DELETE
  TO authenticated
  USING (private.is_admin_user());

GRANT SELECT ON public.kids_games, public.kids_game_levels, public.kids_game_questions TO anon, authenticated;

INSERT INTO public.kids_games (id, published)
VALUES
  ('60000000-0000-4000-8000-000000000001', true),
  ('60000000-0000-4000-8000-000000000002', false);

INSERT INTO public.kids_game_levels (id, game_id, level_no, published)
VALUES
  ('70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 1, true),
  ('70000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', 1, true),
  ('70000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', 2, false);

INSERT INTO public.kids_game_questions (id, level_id, published, correct_index)
VALUES
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', true, 1),
  ('80000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', true, 0),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', true, 2),
  ('80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000001', false, 3);
