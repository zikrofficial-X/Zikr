BEGIN;

ALTER TABLE public.kids_game_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kids_game_questions_public_read
  ON public.kids_game_questions;

CREATE POLICY kids_game_questions_public_read
  ON public.kids_game_questions
  FOR SELECT
  TO anon
  USING (
    published IS TRUE
    AND EXISTS (
      SELECT 1
      FROM public.kids_game_levels AS level
      JOIN public.kids_games AS game
        ON game.id = level.game_id
      WHERE level.id = kids_game_questions.level_id
        AND level.published IS TRUE
        AND game.published IS TRUE
    )
  );

COMMENT ON POLICY kids_game_questions_public_read
  ON public.kids_game_questions
  IS 'Anonymous clients can read only published questions belonging to a published level and published Kids game.';

COMMIT;
