-- Prevent clients from bypassing the server-side atomic game-result processor.
-- The application reads a user's own progress through the authenticated client,
-- but all writes flow through the service-role-only SECURITY DEFINER RPC.

REVOKE ALL PRIVILEGES ON TABLE
  public.kids_game_progress,
  public.kids_game_results
FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE
  public.kids_game_progress,
  public.kids_game_results
TO authenticated;

DROP POLICY IF EXISTS "Users can view their own game progress"
  ON public.kids_game_progress;
DROP POLICY IF EXISTS "Users can insert their own game progress"
  ON public.kids_game_progress;
DROP POLICY IF EXISTS "Users can update their own game progress"
  ON public.kids_game_progress;

CREATE POLICY kids_game_progress_select_own
  ON public.kids_game_progress
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own game results"
  ON public.kids_game_results;
DROP POLICY IF EXISTS "Users can insert their own game results"
  ON public.kids_game_results;

CREATE POLICY kids_game_results_select_own
  ON public.kids_game_results
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
