-- Remove exact duplicate non-unique indexes that were fully covered by
-- equivalent UNIQUE constraint indexes on the same key columns.
-- This reduces write overhead without removing any uniqueness guarantees.
drop index if exists public.adhkar_streaks_user_id_idx;
drop index if exists public.app_settings_user_id_idx;
drop index if exists public.articles_slug_idx;
drop index if exists public.battles_slug_idx;
drop index if exists public.companions_slug_idx;
drop index if exists public.conquests_slug_idx;
drop index if exists public.content_agent_queue_source_idx;
drop index if exists public.notification_settings_user_id_idx;
drop index if exists public.prayer_preferences_user_id_idx;
drop index if exists public.prophets_slug_idx;
drop index if exists public.site_settings_key_idx;
drop index if exists public.tawasheeh_slug_idx;
drop index if exists public.tawasheeh_categories_slug_idx;
drop index if exists public.videos_slug_idx;
