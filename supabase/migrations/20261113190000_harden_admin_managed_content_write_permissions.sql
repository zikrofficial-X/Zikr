BEGIN;

ALTER TABLE public.social_publish_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_audio_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- All tracked consumers read and write these admin-managed records through
-- server routes/jobs using the service role. Keep public read-only catalog
-- access where required, but prevent authenticated users from bypassing the
-- routes' step-up, validation, audit, and storage-lifecycle controls.
DROP POLICY IF EXISTS social_publish_queue_admin_read ON public.social_publish_queue;
DROP POLICY IF EXISTS social_publish_queue_admin_write ON public.social_publish_queue;
DROP POLICY IF EXISTS social_publish_queue_authenticated_read_published_or_admin ON public.social_publish_queue;

-- These are the policy names in the deployed historical migration
-- 20260630000017_0017_video_automation.sql. Keep the alternate names too
-- because older preview databases may have been created from the audit fixture.
DROP POLICY IF EXISTS select_video_requests_admin ON public.video_generation_requests;
DROP POLICY IF EXISTS insert_video_requests_admin ON public.video_generation_requests;
DROP POLICY IF EXISTS update_video_requests_admin ON public.video_generation_requests;
DROP POLICY IF EXISTS admin_select_video_generation_requests ON public.video_generation_requests;
DROP POLICY IF EXISTS admin_insert_video_generation_requests ON public.video_generation_requests;
DROP POLICY IF EXISTS admin_update_video_generation_requests ON public.video_generation_requests;

DROP POLICY IF EXISTS media_assets_admin_all ON public.media_assets;

DROP POLICY IF EXISTS site_audio_assets_admin_insert ON public.site_audio_assets;
DROP POLICY IF EXISTS site_audio_assets_admin_update ON public.site_audio_assets;
DROP POLICY IF EXISTS site_audio_assets_admin_delete ON public.site_audio_assets;

DROP POLICY IF EXISTS admin_all_videos_insert ON public.videos;
DROP POLICY IF EXISTS admin_all_videos_update ON public.videos;
DROP POLICY IF EXISTS admin_all_videos_delete ON public.videos;

REVOKE ALL PRIVILEGES ON TABLE public.social_publish_queue FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.video_generation_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.media_assets FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.site_audio_assets FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.videos FROM PUBLIC, anon, authenticated;

GRANT ALL PRIVILEGES ON TABLE public.social_publish_queue TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.video_generation_requests TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.media_assets TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.site_audio_assets TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.videos TO service_role;

-- Public catalog reads remain available through the existing RLS policies.
GRANT SELECT ON TABLE public.media_assets TO anon;
GRANT SELECT ON TABLE public.videos TO anon, authenticated;

COMMIT;
