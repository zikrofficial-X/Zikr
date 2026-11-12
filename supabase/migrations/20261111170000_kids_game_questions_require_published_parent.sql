BEGIN;

ALTER TABLE public.kids_game_questions ENABLE ROW LEVEL SECURITY;

-- Question rows contain correct_index. Remove both the anonymous policy and
-- the legacy authenticated policy that allowed every signed-in user to read
-- published answer keys. Only a database administrator may select this table.
DROP POLICY IF EXISTS kids_game_questions_public_read
  ON public.kids_game_questions;
DROP POLICY IF EXISTS kids_game_questions_admin_all
  ON public.kids_game_questions;
DROP POLICY IF EXISTS admin_all_kids_game_questions_select
  ON public.kids_game_questions;
DROP POLICY IF EXISTS kids_game_questions_admin_select
  ON public.kids_game_questions;

REVOKE SELECT ON TABLE public.kids_game_questions FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.kids_game_questions TO authenticated;

CREATE POLICY kids_game_questions_admin_select
  ON public.kids_game_questions
  FOR SELECT
  TO authenticated
  USING (private.is_admin_user());

COMMENT ON POLICY kids_game_questions_admin_select
  ON public.kids_game_questions
  IS 'Only administrators may read question rows containing correct_index.';

COMMENT ON TABLE public.kids_game_questions
  IS 'Contains quiz answer keys. Direct SELECT is restricted to authenticated administrators; public gameplay must use a reviewed projection that omits correct_index.';

COMMIT;
