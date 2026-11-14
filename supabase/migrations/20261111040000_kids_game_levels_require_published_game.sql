BEGIN;

ALTER TABLE public.kids_game_levels ENABLE ROW LEVEL SECURITY;

-- Remove the legacy authenticated SELECT policy as well as its command-specific
-- admin policies. The public game client consumes the reviewed offline snapshot;
-- direct table access is intentionally anon-only and parent-scoped.
DROP POLICY IF EXISTS kids_game_levels_public_read ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_all ON public.kids_game_levels;
DROP POLICY IF EXISTS admin_all_kids_game_levels_select ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_select ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_insert ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_update ON public.kids_game_levels;
DROP POLICY IF EXISTS kids_game_levels_admin_delete ON public.kids_game_levels;

-- RLS does not constrain TRUNCATE or table-maintenance privileges. Keep the
-- public level catalogue read-only and remove legacy non-admin write grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.kids_game_levels
  FROM PUBLIC, anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN
  ON TABLE public.kids_game_levels
  FROM authenticated;

CREATE POLICY kids_game_levels_public_read
  ON public.kids_game_levels
  FOR SELECT
  TO anon
  USING (
    published IS TRUE
    AND EXISTS (
      SELECT 1
      FROM public.kids_games AS game
      WHERE game.id = kids_game_levels.game_id
        AND game.published IS TRUE
    )
  );

CREATE POLICY kids_game_levels_admin_all
  ON public.kids_game_levels
  FOR ALL
  TO authenticated
  USING (private.is_admin_user())
  WITH CHECK (private.is_admin_user());

COMMENT ON POLICY kids_game_levels_public_read ON public.kids_game_levels
  IS 'Anonymous clients can read only published levels belonging to a published Kids game.';

COMMIT;
