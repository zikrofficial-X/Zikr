-- Replace overlapping PUBLIC/ALL SELECT policies with role-specific SELECT policies.
-- Anonymous users see only publishable content. Signed-in users see publishable content,
-- while admins additionally see drafts/private records. Mutations remain admin-only.

-- content_library
drop policy if exists content_library_admin_all on public.content_library;
drop policy if exists content_library_public_read on public.content_library;
create policy content_library_public_read on public.content_library
  for select to anon
  using (published = true and review_status = 'approved');
create policy content_library_admin_select on public.content_library
  for select to authenticated
  using ((published = true and review_status = 'approved') or is_admin_user());
create policy content_library_admin_insert on public.content_library
  for insert to authenticated
  with check (is_admin_user());
create policy content_library_admin_update on public.content_library
  for update to authenticated
  using (is_admin_user()) with check (is_admin_user());
create policy content_library_admin_delete on public.content_library
  for delete to authenticated
  using (is_admin_user());

-- content_sources
drop policy if exists content_sources_admin_all on public.content_sources;
drop policy if exists content_sources_public_read on public.content_sources;
create policy content_sources_public_read on public.content_sources
  for select to anon
  using (verified = true);
create policy content_sources_admin_select on public.content_sources
  for select to authenticated
  using (verified = true or is_admin_user());
create policy content_sources_admin_insert on public.content_sources
  for insert to authenticated
  with check (is_admin_user());
create policy content_sources_admin_update on public.content_sources
  for update to authenticated
  using (is_admin_user()) with check (is_admin_user());
create policy content_sources_admin_delete on public.content_sources
  for delete to authenticated
  using (is_admin_user());

-- media_assets
drop policy if exists media_assets_admin_all on public.media_assets;
drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_public_read on public.media_assets
  for select to anon
  using (published = true and rights_verified = true);
create policy media_assets_admin_select on public.media_assets
  for select to authenticated
  using ((published = true and rights_verified = true) or is_admin_user());
create policy media_assets_admin_insert on public.media_assets
  for insert to authenticated
  with check (is_admin_user());
create policy media_assets_admin_update on public.media_assets
  for update to authenticated
  using (is_admin_user()) with check (is_admin_user());
create policy media_assets_admin_delete on public.media_assets
  for delete to authenticated
  using (is_admin_user());

-- kids_games
drop policy if exists kids_games_admin_all on public.kids_games;
drop policy if exists kids_games_public_read on public.kids_games;
create policy kids_games_public_read on public.kids_games
  for select to anon
  using (published = true);
create policy kids_games_admin_select on public.kids_games
  for select to authenticated
  using (published = true or is_admin_user());
create policy kids_games_admin_insert on public.kids_games
  for insert to authenticated
  with check (is_admin_user());
create policy kids_games_admin_update on public.kids_games
  for update to authenticated
  using (is_admin_user()) with check (is_admin_user());
create policy kids_games_admin_delete on public.kids_games
  for delete to authenticated
  using (is_admin_user());

-- kids_game_levels
drop policy if exists kids_game_levels_admin_all on public.kids_game_levels;
drop policy if exists kids_game_levels_public_read on public.kids_game_levels;
create policy kids_game_levels_public_read on public.kids_game_levels
  for select to anon
  using (published = true);
create policy kids_game_levels_admin_select on public.kids_game_levels
  for select to authenticated
  using (published = true or is_admin_user());
create policy kids_game_levels_admin_insert on public.kids_game_levels
  for insert to authenticated
  with check (is_admin_user());
create policy kids_game_levels_admin_update on public.kids_game_levels
  for update to authenticated
  using (is_admin_user()) with check (is_admin_user());
create policy kids_game_levels_admin_delete on public.kids_game_levels
  for delete to authenticated
  using (is_admin_user());

-- kids_game_questions
drop policy if exists kids_game_questions_admin_all on public.kids_game_questions;
drop policy if exists kids_game_questions_public_read on public.kids_game_questions;
create policy kids_game_questions_public_read on public.kids_game_questions
  for select to anon
  using (published = true);
create policy kids_game_questions_admin_select on public.kids_game_questions
  for select to authenticated
  using (published = true or is_admin_user());
create policy kids_game_questions_admin_insert on public.kids_game_questions
  for insert to authenticated
  with check (is_admin_user());
create policy kids_game_questions_admin_update on public.kids_game_questions
  for update to authenticated
  using (is_admin_user()) with check (is_admin_user());
create policy kids_game_questions_admin_delete on public.kids_game_questions
  for delete to authenticated
  using (is_admin_user());
