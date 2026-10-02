-- Remote migration: 20261002042816
drop policy if exists "Admins only can view usage stats" on public.free_tier_usage;
create policy "Admins only can view usage stats" on public.free_tier_usage for select to public
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));

drop policy if exists "Admins only can modify game graphics" on public.game_graphics;
create policy "Admins only can modify game graphics" on public.game_graphics for all to public
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));

drop policy if exists "Admins only can modify game scenarios" on public.game_scenarios;
create policy "Admins only can modify game scenarios" on public.game_scenarios for all to public
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));

drop policy if exists "Users can insert their own achievements" on public.kids_achievements_legacy_20261002;
create policy "Users can insert their own achievements" on public.kids_achievements_legacy_20261002 for insert to public
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own achievements" on public.kids_achievements_legacy_20261002;
create policy "Users can view their own achievements" on public.kids_achievements_legacy_20261002 for select to public
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own character selection" on public.kids_character_selection;
create policy "Users can insert their own character selection" on public.kids_character_selection for insert to public
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own character selection" on public.kids_character_selection;
create policy "Users can update their own character selection" on public.kids_character_selection for update to public
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own character selection" on public.kids_character_selection;
create policy "Users can view their own character selection" on public.kids_character_selection for select to public
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own game progress" on public.kids_game_progress;
create policy "Users can insert their own game progress" on public.kids_game_progress for insert to public
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own game progress" on public.kids_game_progress;
create policy "Users can update their own game progress" on public.kids_game_progress for update to public
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own game progress" on public.kids_game_progress;
create policy "Users can view their own game progress" on public.kids_game_progress for select to public
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own game results" on public.kids_game_results;
create policy "Users can insert their own game results" on public.kids_game_results for insert to public
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own game results" on public.kids_game_results;
create policy "Users can view their own game results" on public.kids_game_results for select to public
using ((select auth.uid()) = user_id);
