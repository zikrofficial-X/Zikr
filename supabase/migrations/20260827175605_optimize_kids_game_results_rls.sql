-- Keep the same ownership boundary while allowing Postgres to evaluate auth.uid()
-- once per statement instead of once per row.
drop policy if exists "kids_game_results_select_own" on public.kids_game_results;
create policy "kids_game_results_select_own"
  on public.kids_game_results
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "kids_game_results_insert_own" on public.kids_game_results;
create policy "kids_game_results_insert_own"
  on public.kids_game_results
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
