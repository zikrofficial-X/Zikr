BEGIN;

ALTER TABLE public.kids_game_questions ENABLE ROW LEVEL SECURITY;

-- Question rows contain correct_index. Do not expose the base table to public
-- clients: a published-parent filter does not protect answer keys. Public
-- gameplay must use a separately reviewed projection that omits correct_index.
DROP POLICY IF EXISTS kids_game_questions_public_read
  ON public.kids_game_questions;

REVOKE SELECT ON TABLE public.kids_game_questions FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.kids_game_questions TO authenticated;

COMMENT ON TABLE public.kids_game_questions
  IS 'Contains quiz answer keys. Direct SELECT is restricted to authenticated administrators; public gameplay must use a reviewed projection that omits correct_index.';

COMMIT;
