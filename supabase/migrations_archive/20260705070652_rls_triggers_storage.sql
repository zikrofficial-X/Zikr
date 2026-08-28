-- =============================================================================
-- Migration: 20260705070652_rls_triggers_storage
-- Description: Row Level Security policies, profile auto-create trigger,
--              updated_at trigger, and storage bucket setup.
--              Applied remotely on 2026-07-05. Local file synced to match
--              the version already recorded in supabase_migrations.schema_migrations.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. updated_at trigger function (reusable)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at trigger to all tables that have updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'users', 'site_settings', 'competitions', 'pinned_messages',
    'memorization_plans', 'contacts', 'subscriptions', 'video_publishing_config',
    'quran_surahs', 'quran_reciters', 'quran_tafsir', 'hadith_books', 'hadiths',
    'hadith_explanations', 'scholars', 'stories', 'prophets', 'prophet_sections',
    'dua_categories', 'duas', 'article_categories', 'articles', 'video_categories',
    'videos', 'video_generation_requests', 'kids_content', 'companions',
    'companion_stories', 'battles', 'battle_events', 'conquests', 'conquest_events',
    'tawasheeh_categories', 'tawasheeh', 'episodes', 'reminders',
    'user_subscriptions', 'prayer_locations', 'prayer_preferences',
    'tawasheeh_playlists', 'reading_progress', 'story_ratings', 'prophet_notes',
    'notification_settings', 'adhkar_streaks', 'app_settings'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Auto-create profile on new auth user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    COALESCE(NEW.raw_user_meta_data->>'locale', 'ar')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Enable RLS on all public user-owned tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prophet_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adhkar_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adhkar_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prayer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reciter_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recent_recitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_ayahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_tafsir ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_reciters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_audio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hadith_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prophets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prophet_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dua_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kids_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquest_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tawasheeh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memorization_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_publishing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 4. RLS Policies — Profiles
-- ---------------------------------------------------------------------------

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 5. RLS Policies — User-owned tables
-- ---------------------------------------------------------------------------

CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "reading_progress_select_own" ON public.reading_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reading_progress_upsert_own" ON public.reading_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reading_progress_update_own" ON public.reading_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reading_progress_delete_own" ON public.reading_progress FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "reminders_select_own" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reminders_insert_own" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reminders_update_own" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reminders_delete_own" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "quran_favorites_select_own" ON public.quran_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quran_favorites_insert_own" ON public.quran_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "quran_favorites_delete_own" ON public.quran_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_select_own" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_own" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_own" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "search_history_select_own" ON public.search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_history_insert_own" ON public.search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "search_history_delete_own" ON public.search_history FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "quran_reads_select_own" ON public.quran_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "quran_reads_insert_own" ON public.quran_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "story_reads_select_own" ON public.story_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "story_reads_insert_own" ON public.story_reads FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "story_ratings_select_all" ON public.story_ratings FOR SELECT USING (true);
CREATE POLICY "story_ratings_insert_own" ON public.story_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "story_ratings_update_own" ON public.story_ratings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "story_favorites_select_own" ON public.story_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "story_favorites_insert_own" ON public.story_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "story_favorites_delete_own" ON public.story_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "social_shares_select_own" ON public.social_shares FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "social_shares_insert_own" ON public.social_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prophet_notes_select_own" ON public.prophet_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prophet_notes_insert_own" ON public.prophet_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prophet_notes_update_own" ON public.prophet_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prophet_notes_delete_own" ON public.prophet_notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_select_own" ON public.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert_own" ON public.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update_own" ON public.notification_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "adhkar_completions_select_own" ON public.adhkar_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "adhkar_completions_insert_own" ON public.adhkar_completions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "adhkar_streaks_select_own" ON public.adhkar_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "adhkar_streaks_insert_own" ON public.adhkar_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "adhkar_streaks_update_own" ON public.adhkar_streaks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "app_settings_select_own" ON public.app_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "app_settings_insert_own" ON public.app_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "app_settings_update_own" ON public.app_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_subscriptions_select_own" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "research_requests_select_own" ON public.research_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "research_requests_insert_own" ON public.research_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_research_select_own" ON public.generated_research
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.research_requests r
      WHERE r.id = request_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "prayer_locations_select_own" ON public.prayer_locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prayer_locations_insert_own" ON public.prayer_locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prayer_locations_update_own" ON public.prayer_locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "prayer_locations_delete_own" ON public.prayer_locations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "prayer_preferences_select_own" ON public.prayer_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "prayer_preferences_insert_own" ON public.prayer_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prayer_preferences_update_own" ON public.prayer_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "prayer_notifications_select_own" ON public.prayer_notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tawasheeh_favorites_select_own" ON public.tawasheeh_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tawasheeh_favorites_insert_own" ON public.tawasheeh_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tawasheeh_favorites_delete_own" ON public.tawasheeh_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "tawasheeh_playlists_select_own" ON public.tawasheeh_playlists
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "tawasheeh_playlists_insert_own" ON public.tawasheeh_playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tawasheeh_playlists_update_own" ON public.tawasheeh_playlists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tawasheeh_playlists_delete_own" ON public.tawasheeh_playlists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "tawasheeh_playlist_items_select_own" ON public.tawasheeh_playlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tawasheeh_playlists p
      WHERE p.id = playlist_id AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );
CREATE POLICY "tawasheeh_playlist_items_insert_own" ON public.tawasheeh_playlist_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tawasheeh_playlists p
      WHERE p.id = playlist_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "tawasheeh_playlist_items_delete_own" ON public.tawasheeh_playlist_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tawasheeh_playlists p
      WHERE p.id = playlist_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "reciter_favorites_select_own" ON public.reciter_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "reciter_favorites_insert_own" ON public.reciter_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reciter_favorites_delete_own" ON public.reciter_favorites FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "recent_recitations_select_own" ON public.recent_recitations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recent_recitations_insert_own" ON public.recent_recitations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_behavior_insert_any" ON public.user_behavior FOR INSERT WITH CHECK (true);
CREATE POLICY "user_behavior_select_own" ON public.user_behavior FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "tasks_select_own" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "saved_stories_select_own" ON public.saved_stories FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "saved_stories_insert_own" ON public.saved_stories FOR INSERT WITH CHECK (true);

CREATE POLICY "story_progress_select_own" ON public.story_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = user_id AND u.email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);
CREATE POLICY "story_progress_upsert_own" ON public.story_progress FOR INSERT WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 6. RLS Policies — Public content (read-only for all)
-- ---------------------------------------------------------------------------

CREATE POLICY "quran_surahs_public_read"    ON public.quran_surahs    FOR SELECT USING (true);
CREATE POLICY "quran_ayahs_public_read"     ON public.quran_ayahs     FOR SELECT USING (true);
CREATE POLICY "quran_tafsir_public_read"    ON public.quran_tafsir    FOR SELECT USING (true);
CREATE POLICY "quran_reciters_public_read"  ON public.quran_reciters  FOR SELECT USING (true);
CREATE POLICY "quran_audio_public_read"     ON public.quran_audio     FOR SELECT USING (true);
CREATE POLICY "hadith_books_public_read"    ON public.hadith_books    FOR SELECT USING (true);
CREATE POLICY "hadiths_public_read"         ON public.hadiths         FOR SELECT USING (published = true);
CREATE POLICY "hadith_explanations_public_read" ON public.hadith_explanations FOR SELECT USING (true);
CREATE POLICY "scholars_public_read"        ON public.scholars        FOR SELECT USING (published = true);
CREATE POLICY "stories_public_read"         ON public.stories         FOR SELECT USING (published = true);
CREATE POLICY "prophets_public_read"        ON public.prophets        FOR SELECT USING (published = true);
CREATE POLICY "prophet_sections_public_read" ON public.prophet_sections FOR SELECT USING (true);
CREATE POLICY "dua_categories_public_read"  ON public.dua_categories  FOR SELECT USING (published = true);
CREATE POLICY "duas_public_read"            ON public.duas            FOR SELECT USING (published = true);
CREATE POLICY "article_categories_public_read" ON public.article_categories FOR SELECT USING (published = true);
CREATE POLICY "articles_public_read"        ON public.articles        FOR SELECT USING (published = true);
CREATE POLICY "video_categories_public_read" ON public.video_categories FOR SELECT USING (published = true);
CREATE POLICY "videos_public_read"          ON public.videos          FOR SELECT USING (published = true);
CREATE POLICY "kids_content_public_read"    ON public.kids_content    FOR SELECT USING (published = true);
CREATE POLICY "companions_public_read"      ON public.companions      FOR SELECT USING (published = true);
CREATE POLICY "companion_stories_public_read" ON public.companion_stories FOR SELECT USING (true);
CREATE POLICY "battles_public_read"         ON public.battles         FOR SELECT USING (published = true);
CREATE POLICY "battle_events_public_read"   ON public.battle_events   FOR SELECT USING (true);
CREATE POLICY "conquests_public_read"       ON public.conquests       FOR SELECT USING (published = true);
CREATE POLICY "conquest_events_public_read" ON public.conquest_events FOR SELECT USING (true);
CREATE POLICY "tawasheeh_categories_public_read" ON public.tawasheeh_categories FOR SELECT USING (published = true);
CREATE POLICY "tawasheeh_public_read"       ON public.tawasheeh       FOR SELECT USING (published = true);
CREATE POLICY "competitions_public_read"    ON public.competitions    FOR SELECT USING (published = true);
CREATE POLICY "pinned_messages_public_read" ON public.pinned_messages FOR SELECT USING (is_active = true);
CREATE POLICY "memorization_plans_public_read" ON public.memorization_plans FOR SELECT USING (published = true);
CREATE POLICY "episodes_public_read"        ON public.episodes        FOR SELECT USING (true);
CREATE POLICY "contacts_public_insert"      ON public.contacts        FOR INSERT WITH CHECK (true);
CREATE POLICY "subscriptions_public_insert" ON public.subscriptions   FOR INSERT WITH CHECK (true);
CREATE POLICY "users_service_only"          ON public.users           USING (false);
CREATE POLICY "users_insert_service_only"   ON public.users           FOR INSERT WITH CHECK (false);
CREATE POLICY "site_settings_public_read"   ON public.site_settings   FOR SELECT USING (true);
CREATE POLICY "video_publishing_config_public_read" ON public.video_publishing_config FOR SELECT USING (true);
CREATE POLICY "video_generation_requests_public_read" ON public.video_generation_requests FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- 7. Storage Buckets
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',    'avatars',    false, 5242880,   ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('thumbnails', 'thumbnails', true,  10485760,  ARRAY['image/jpeg','image/png','image/webp']),
  ('audio',      'audio',      true,  104857600, ARRAY['audio/mpeg','audio/mp4','audio/ogg','audio/wav']),
  ('videos',     'videos',     false, 524288000, ARRAY['video/mp4','video/webm']),
  ('documents',  'documents',  false, 52428800,  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('screenshots','screenshots',false, 10485760,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Storage Policies
-- ---------------------------------------------------------------------------

CREATE POLICY "avatars_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "thumbnails_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "audio_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio');
CREATE POLICY "videos_auth_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos' AND auth.role() = 'authenticated');

CREATE POLICY "documents_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "documents_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "screenshots_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "screenshots_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
