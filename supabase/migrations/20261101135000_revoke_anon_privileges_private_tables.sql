-- Remove unnecessary direct anon privileges from private/user-scoped tables.
-- RLS already prevents anonymous row access; this is defense-in-depth and does
-- not change authenticated or service_role access.
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

COMMIT;
