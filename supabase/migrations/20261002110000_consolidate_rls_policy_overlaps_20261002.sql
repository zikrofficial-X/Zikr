-- RLS policy consolidation and privilege tightening.
-- This migration intentionally uses a timestamp newer than the existing
-- 20261002100000 production migration to avoid version collisions.

-- Remove admin ALL policies that duplicate the existing authenticated
-- INSERT/UPDATE/DELETE policies.
drop policy if exists article_categories_admin_write on public.article_categories;
drop policy if exists articles_admin_write on public.articles;
drop policy if exists dua_categories_admin_write on public.dua_categories;
drop policy if exists duas_admin_write on public.duas;
drop policy if exists content_admin_write_books on public.hadith_books;
drop policy if exists content_admin_write_hadith_explanations on public.hadith_explanations;
drop policy if exists content_admin_write_hadiths on public.hadiths;
drop policy if exists kids_content_admin_write on public.kids_content;
drop policy if exists prophet_sections_admin_write on public.prophet_sections;
drop policy if exists prophets_admin_write on public.prophets;
drop policy if exists content_admin_write_ayahs on public.quran_ayahs;
drop policy if exists content_admin_write_reciters on public.quran_reciters;
drop policy if exists content_admin_write_surahs on public.quran_surahs;
drop policy if exists content_admin_write_tafsir on public.quran_tafsir;
drop policy if exists content_admin_write_scholars on public.scholars;
drop policy if exists content_admin_write_stories on public.stories;

-- These policies are replaced by action-specific authenticated policies in a
-- later game-assets migration. Drop them idempotently here because an earlier
-- cleanup may already have removed them.
drop policy if exists "Admins only can modify game graphics" on public.game_graphics;
drop policy if exists "Admins only can modify game scenarios" on public.game_scenarios;

-- video_narrations already has a public SELECT policy. Restrict the admin
-- policy to write operations so authenticated admins do not overlap with it.
drop policy if exists "Admins only can manage video narrations" on public.video_narrations;

create policy "Admins can insert video narrations"
  on public.video_narrations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );

create policy "Admins can update video narrations"
  on public.video_narrations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );

create policy "Admins can delete video narrations"
  on public.video_narrations
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'::role
    )
  );

-- Remove redundant admin-only SELECT policies already covered by public
-- published-read policies.
drop policy if exists hadiths_public_read on public.hadiths;
drop policy if exists scholars_public_read on public.scholars;
drop policy if exists stories_public_read on public.stories;

-- Remove broad unrestricted child-event reads. Published-parent policies
-- provide the intended public visibility boundary.
drop policy if exists allow_public_read on public.battle_events;
drop policy if exists allow_public_read on public.companion_stories;
drop policy if exists allow_public_read on public.conquest_events;

-- User-owned policies should target authenticated users explicitly.
alter policy background_reminder_preferences_insert_own on public.background_reminder_preferences to authenticated;
alter policy background_reminder_preferences_select_own on public.background_reminder_preferences to authenticated;
alter policy background_reminder_preferences_update_own on public.background_reminder_preferences to authenticated;
alter policy favorites_owner_all on public.favorites to authenticated;
alter policy "Admins only can view usage stats" on public.free_tier_usage to authenticated;
alter policy "Users can insert their own achievements" on public.kids_achievements_legacy_20261002 to authenticated;
alter policy "Users can view their own achievements" on public.kids_achievements_legacy_20261002 to authenticated;
alter policy "Users can insert their own character selection" on public.kids_character_selection to authenticated;
alter policy "Users can update their own character selection" on public.kids_character_selection to authenticated;
alter policy "Users can view their own character selection" on public.kids_character_selection to authenticated;
alter policy "Users can insert their own game progress" on public.kids_game_progress to authenticated;
alter policy "Users can update their own game progress" on public.kids_game_progress to authenticated;
alter policy "Users can view their own game progress" on public.kids_game_progress to authenticated;
alter policy "Users can insert their own game results" on public.kids_game_results to authenticated;
alter policy "Users can view their own game results" on public.kids_game_results to authenticated;
alter policy allow_user_delete_locations on public.prayer_locations to authenticated;
alter policy allow_user_insert_locations on public.prayer_locations to authenticated;
alter policy allow_user_read_own_locations on public.prayer_locations to authenticated;
alter policy allow_user_update_locations on public.prayer_locations to authenticated;
alter policy prayer_locations_owner_all on public.prayer_locations to authenticated;
alter policy prayer_notification_deliveries_select_own on public.prayer_notification_deliveries to authenticated;
alter policy prayer_notifications_owner_insert on public.prayer_notifications to authenticated;
alter policy prayer_notifications_owner_read on public.prayer_notifications to authenticated;
alter policy allow_user_insert_preferences on public.prayer_preferences to authenticated;
alter policy allow_user_manage_preferences on public.prayer_preferences to authenticated;
alter policy allow_user_update_preferences on public.prayer_preferences to authenticated;
alter policy prayer_preferences_owner_all on public.prayer_preferences to authenticated;
alter policy profiles_insert_own on public.profiles to authenticated;
alter policy profiles_update_own on public.profiles to authenticated;
alter policy push_subscriptions_delete_own on public.push_subscriptions to authenticated;
alter policy push_subscriptions_insert_own on public.push_subscriptions to authenticated;
alter policy push_subscriptions_select_own on public.push_subscriptions to authenticated;
alter policy push_subscriptions_update_own on public.push_subscriptions to authenticated;
alter policy reading_progress_owner_all on public.reading_progress to authenticated;
alter policy recent_recitations_owner_all on public.recent_recitations to authenticated;
alter policy reciter_favorites_owner_all on public.reciter_favorites to authenticated;
alter policy reminders_owner_all on public.reminders to authenticated;
alter policy tawasheeh_favorites_owner_all on public.tawasheeh_favorites to authenticated;
alter policy tawasheeh_playlist_items_owner_all on public.tawasheeh_playlist_items to authenticated;
alter policy tawasheeh_playlists_owner_all on public.tawasheeh_playlists to authenticated;
alter policy allow_user_insert_behavior on public.user_behavior to authenticated;
alter policy allow_user_view_own_behavior on public.user_behavior to authenticated;

-- Keep tawasheeh public discovery policy unchanged.
