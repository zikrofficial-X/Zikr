-- Final RLS overlap cleanup.
-- Keep published/approved public reads explicit and remove duplicate admin/owner policies.

drop policy if exists admin_all_competitions_delete on public.competitions;
drop policy if exists admin_all_competitions_insert on public.competitions;
drop policy if exists admin_all_competitions_update on public.competitions;

drop policy if exists admin_all_memorization_plans_delete on public.memorization_plans;
drop policy if exists admin_all_memorization_plans_insert on public.memorization_plans;
drop policy if exists admin_all_memorization_plans_update on public.memorization_plans;

drop policy if exists admin_all_pinned_messages_delete on public.pinned_messages;
drop policy if exists admin_all_pinned_messages_insert on public.pinned_messages;
drop policy if exists admin_all_pinned_messages_update on public.pinned_messages;

drop policy if exists admin_write_quran_ayahs on public.quran_ayahs;
drop policy if exists admin_write_quran_surahs on public.quran_surahs;

drop policy if exists "Admins only can modify game graphics" on public.game_graphics;
create policy "Admins can insert game graphics" on public.game_graphics for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));
create policy "Admins can update game graphics" on public.game_graphics for update to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role)) with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));
create policy "Admins can delete game graphics" on public.game_graphics for delete to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));

drop policy if exists "Admins only can modify game scenarios" on public.game_scenarios;
create policy "Admins can insert game scenarios" on public.game_scenarios for insert to authenticated with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));
create policy "Admins can update game scenarios" on public.game_scenarios for update to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role)) with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));
create policy "Admins can delete game scenarios" on public.game_scenarios for delete to authenticated using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'::role));

drop policy if exists prayer_locations_owner_all on public.prayer_locations;
drop policy if exists prayer_preferences_owner_all on public.prayer_preferences;
drop policy if exists social_publish_queue_admin_read on public.social_publish_queue;

drop policy if exists tawasheeh_playlists_owner_all on public.tawasheeh_playlists;
create policy "tawasheeh_playlists_owner_insert" on public.tawasheeh_playlists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "tawasheeh_playlists_owner_update" on public.tawasheeh_playlists for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "tawasheeh_playlists_owner_delete" on public.tawasheeh_playlists for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists allow_public_read on public.article_categories;
drop policy if exists allow_public_read on public.dua_categories;
drop policy if exists allow_public_read on public.kids_content;
drop policy if exists allow_public_read on public.tawasheeh;
drop policy if exists allow_public_read on public.tawasheeh_categories;