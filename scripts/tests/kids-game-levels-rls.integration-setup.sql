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
  published boolean NOT NULL DEFAULT false
);

ALTER TABLE public.kids_game_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY kids_game_questions_public_read
  ON public.kids_game_questions
  FOR SELECT
  TO anon
  USING (published IS TRUE);

CREATE POLICY kids_game_questions_admin_all
  ON public.kids_game_questions
  FOR ALL
  TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

CREATE POLICY kids_game_levels_public_read
  ON public.kids_game_levels
  FOR SELECT
  TO anon
  USING (published IS TRUE);

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

INSERT INTO public.kids_game_questions (id, level_id, published)
VALUES
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', true),
  ('80000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000002', true),
  ('80000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000003', true),
  ('80000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000001', false);
