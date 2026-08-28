-- Remove overlapping permissive RLS policies without widening access.
-- Admin policies are split by command so public SELECT policies do not overlap.

DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      ('article_categories', 'admin_all_article_categories'),
      ('articles', 'articles_admin_all'),
      ('battles', 'battles_admin_write'),
      ('companion_stories', 'admin_all_companion_stories'),
      ('companions', 'companions_admin_write'),
      ('competitions', 'admin_all_competitions'),
      ('conquest_events', 'admin_all_conquest_events'),
      ('conquests', 'conquests_admin_write'),
      ('dua_categories', 'admin_all_dua_categories'),
      ('duas', 'admin_all_duas'),
      ('hadith_books', 'admin_all_hadith_books'),
      ('hadith_explanations', 'admin_all_hadith_explanations'),
      ('hadiths', 'admin_all_hadiths'),
      ('kids_content', 'admin_all_kids_content'),
      ('memorization_plans', 'admin_all_memorization_plans'),
      ('pinned_messages', 'admin_all_pinned_messages'),
      ('prophet_sections', 'admin_all_prophet_sections'),
      ('prophets', 'admin_all_prophets'),
      ('quran_ayahs', 'admin_all_quran_ayahs'),
      ('quran_reciters', 'admin_all_quran_reciters'),
      ('quran_surahs', 'admin_all_quran_surahs'),
      ('quran_tafsir', 'admin_all_quran_tafsir'),
      ('scholars', 'admin_all_scholars'),
      ('site_settings', 'admin_all_site_settings'),
      ('stories', 'Admin Full Access Stories'),
      ('video_categories', 'admin_all_video_categories'),
      ('videos', 'admin_all_videos')
    ) AS v(table_name, policy_name)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', rec.policy_name, rec.table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (private.is_admin_user())',
      rec.policy_name || '_insert', rec.table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (private.is_admin_user()) WITH CHECK (private.is_admin_user())',
      rec.policy_name || '_update', rec.table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (private.is_admin_user())',
      rec.policy_name || '_delete', rec.table_name
    );
  END LOOP;
END $$;

-- This table is only written by the service role or an admin. The service role
-- bypasses RLS, so its redundant public-role policy is not needed. The table is
-- optional in legacy/local replay environments, so do not fail if it is absent.
DO $social_queue$
BEGIN
  IF to_regclass('public.social_publish_queue') IS NOT NULL THEN
    DROP POLICY IF EXISTS social_publish_queue_admin_all ON public.social_publish_queue;
    DROP POLICY IF EXISTS social_publish_queue_service_role_all ON public.social_publish_queue;
    CREATE POLICY social_publish_queue_admin_insert ON public.social_publish_queue
      FOR INSERT TO authenticated WITH CHECK (private.is_admin_user());
    CREATE POLICY social_publish_queue_admin_update ON public.social_publish_queue
      FOR UPDATE TO authenticated USING (private.is_admin_user()) WITH CHECK (private.is_admin_user());
    CREATE POLICY social_publish_queue_admin_delete ON public.social_publish_queue
      FOR DELETE TO authenticated USING (private.is_admin_user());
  END IF;
END
$social_queue$;

-- Keep one owner policy for each personal activity table.
DROP POLICY IF EXISTS users_own_reading_progress ON public.reading_progress;
DROP POLICY IF EXISTS recent_recitations_owner ON public.recent_recitations;
DROP POLICY IF EXISTS users_own_reciter_favorites ON public.reciter_favorites;
DROP POLICY IF EXISTS users_own_reminders ON public.reminders;
DROP POLICY IF EXISTS users_own_tawasheeh_favorites ON public.tawasheeh_favorites;

-- A playlist may be read publicly when explicitly public, or by its owner.
-- Writes remain owner-only and are separated by command.
DROP POLICY IF EXISTS tawasheeh_playlists_owner_all ON public.tawasheeh_playlists;
DROP POLICY IF EXISTS users_own_tawasheeh_playlists ON public.tawasheeh_playlists;
DROP POLICY IF EXISTS tawasheeh_playlists_public_read ON public.tawasheeh_playlists;
CREATE POLICY tawasheeh_playlists_public_or_owner_select ON public.tawasheeh_playlists
  FOR SELECT TO public USING (is_public = true OR (SELECT auth.uid()) = user_id);
CREATE POLICY tawasheeh_playlists_owner_insert ON public.tawasheeh_playlists
  FOR INSERT TO public WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY tawasheeh_playlists_owner_update ON public.tawasheeh_playlists
  FOR UPDATE TO public USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY tawasheeh_playlists_owner_delete ON public.tawasheeh_playlists
  FOR DELETE TO public USING ((SELECT auth.uid()) = user_id);

-- Public newsletter signup needs one INSERT policy. Account owners may still
-- read/update/delete their own subscription rows without INSERT overlap. The
-- legacy baseline drops this table, so guard the policy repair for replays.
DO $subscriptions$
BEGIN
  IF to_regclass('public.subscriptions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Anyone can subscribe" ON public.subscriptions;
    DROP POLICY IF EXISTS subscriptions_public_insert ON public.subscriptions;
    DROP POLICY IF EXISTS subscriptions_owner_all ON public.subscriptions;
    CREATE POLICY subscriptions_public_insert ON public.subscriptions
      FOR INSERT TO anon, authenticated WITH CHECK (email IS NOT NULL);
    CREATE POLICY subscriptions_owner_select ON public.subscriptions
      FOR SELECT TO authenticated USING (
        email = ((SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))::text)
      );
    CREATE POLICY subscriptions_owner_update ON public.subscriptions
      FOR UPDATE TO authenticated USING (
        email = ((SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))::text)
      ) WITH CHECK (
        email = ((SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))::text)
      );
    CREATE POLICY subscriptions_owner_delete ON public.subscriptions
      FOR DELETE TO authenticated USING (
        email = ((SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))::text)
      );
  END IF;
END
$subscriptions$;
