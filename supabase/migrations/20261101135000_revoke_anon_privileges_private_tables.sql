-- Remove unnecessary direct anon privileges from private/user-scoped tables.
-- Most listed tables were already protected by RLS. The server-only social
-- profile cache's public-read policy is removed below. This preserves
-- authenticated and service_role access while reducing anonymous exposure.
BEGIN;

DO $anon_acl$
DECLARE
  target_table text;
  private_tables text[] := ARRAY[
    'admin_page_views',
    'admin_queue_alert_deliveries',
    'admin_role_assignments',
    'background_reminder_preferences',
    'contacts',
    'content_agent_queue',
    'content_agent_runs',
    'content_publish_queue',
    'content_translation_queue',
    'favorites',
    'memorization_progress',
    'notifications',
    'prayer_notification_deliveries',
    'prayer_notifications',
    'prayer_preferences',
    'profiles',
    'push_subscriptions',
    'reading_progress',
    'recent_recitations',
    'reciter_favorites',
    'reminders',
    'social_publish_queue',
    'social_sync_jobs',
    'social_sync_state',
    'social_platform_profiles',
    'tawasheeh_favorites',
    'user_behavior',
    'video_automation_runs',
    'video_generation_requests'
  ];
BEGIN
  FOREACH target_table IN ARRAY private_tables LOOP
    IF to_regclass(format('public.%I', target_table)) IS NOT NULL THEN
      EXECUTE format(
        'REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon',
        target_table
      );
    END IF;
  END LOOP;
END;
$anon_acl$;


-- Keep public content readable by anon, but do not expose the SECURITY DEFINER
-- admin predicate to anonymous callers. Authenticated admins retain draft access.
DROP POLICY IF EXISTS public_read_hadiths ON public.hadiths;
CREATE POLICY hadiths_public_read_published
  ON public.hadiths FOR SELECT TO anon
  USING (published = true);
CREATE POLICY hadiths_authenticated_read_published_or_admin
  ON public.hadiths FOR SELECT TO authenticated
  USING (published = true OR private.is_admin_user());

DROP POLICY IF EXISTS public_read_stories ON public.stories;
CREATE POLICY stories_public_read_published
  ON public.stories FOR SELECT TO anon
  USING (published = true);
CREATE POLICY stories_authenticated_read_published_or_admin
  ON public.stories FOR SELECT TO authenticated
  USING (published = true OR private.is_admin_user());

DROP POLICY IF EXISTS social_platform_profiles_public_read ON public.social_platform_profiles;

DROP POLICY IF EXISTS public_read_scholars ON public.scholars;
CREATE POLICY scholars_public_read_published
  ON public.scholars FOR SELECT TO anon
  USING (published = true);
CREATE POLICY scholars_authenticated_read_published_or_admin
  ON public.scholars FOR SELECT TO authenticated
  USING (published = true OR private.is_admin_user());

REVOKE EXECUTE ON FUNCTION private.is_admin_user() FROM anon;

COMMIT;
