-- Fix Admin Video Template RPC actor validation, keep insights out of the publish queue,
-- and redact the previously persisted YouTube request URL. Queue rows are not modified.

CREATE TABLE IF NOT EXISTS public.social_post_insights (
  queue_id uuid NOT NULL REFERENCES public.social_publish_queue(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('youtube', 'facebook', 'facebook_reels')),
  video_id text,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL,
  source text NOT NULL,
  scope text NOT NULL,
  period text,
  status text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (queue_id, platform)
);

ALTER TABLE public.social_post_insights ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.social_post_insights FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.social_post_insights TO service_role;

CREATE INDEX IF NOT EXISTS social_post_insights_platform_captured_idx
  ON public.social_post_insights(platform, captured_at DESC);

-- Preserve previously collected metrics without changing any social_publish_queue row.
INSERT INTO public.social_post_insights (
  queue_id, platform, video_id, metrics, captured_at, source, scope, updated_at
)
SELECT
  q.id,
  'youtube',
  q.metadata #>> '{platformInsights,youtube,videoId}',
  jsonb_strip_nulls(jsonb_build_object(
    'views', q.metadata #> '{platformInsights,youtube,views}',
    'likes', q.metadata #> '{platformInsights,youtube,likes}',
    'comments', q.metadata #> '{platformInsights,youtube,comments}'
  )),
  CASE
    WHEN q.metadata #>> '{platformInsights,youtube,capturedAt}' ~ '^\d{4}-\d{2}-\d{2}T'
      THEN (q.metadata #>> '{platformInsights,youtube,capturedAt}')::timestamptz
    ELSE COALESCE(q.published_at, q.updated_at)
  END,
  COALESCE(q.metadata #>> '{platformInsights,youtube,source}', 'youtube-data-api-v3'),
  COALESCE(q.metadata #>> '{platformInsights,youtube,scope}', 'public-statistics'),
  now()
FROM public.social_publish_queue AS q
WHERE q.metadata #> '{platformInsights,youtube}' IS NOT NULL
  AND q.metadata #>> '{platformInsights,youtube,videoId}' IS NOT NULL
ON CONFLICT (queue_id, platform) DO NOTHING;

INSERT INTO public.social_post_insights (
  queue_id, platform, video_id, metrics, captured_at, source, scope, period, status, updated_at
)
SELECT
  q.id,
  'facebook_reels',
  q.metadata #>> '{platformInsights,facebookReels,videoId}',
  COALESCE(q.metadata #> '{platformInsights,facebookReels,metrics}', '{}'::jsonb),
  CASE
    WHEN q.metadata #>> '{platformInsights,facebookReels,capturedAt}' ~ '^\d{4}-\d{2}-\d{2}T'
      THEN (q.metadata #>> '{platformInsights,facebookReels,capturedAt}')::timestamptz
    ELSE COALESCE(q.published_at, q.updated_at)
  END,
  COALESCE(q.metadata #>> '{platformInsights,facebookReels,source}', 'meta-graph-api'),
  COALESCE(q.metadata #>> '{platformInsights,facebookReels,scope}', 'page-video-insights'),
  COALESCE(q.metadata #>> '{platformInsights,facebookReels,period}', 'lifetime'),
  q.metadata #>> '{platformInsights,facebookReels,status}',
  now()
FROM public.social_publish_queue AS q
WHERE q.metadata #> '{platformInsights,facebookReels}' IS NOT NULL
  AND q.metadata #>> '{platformInsights,facebookReels,videoId}' IS NOT NULL
ON CONFLICT (queue_id, platform) DO NOTHING;

-- service_role can read public.profiles, but intentionally cannot read auth.users.
-- Keep SECURITY INVOKER and service_role-only EXECUTE; do not widen auth.users grants.

CREATE OR REPLACE FUNCTION public.admin_create_video_template_version(
  p_template_id uuid,
  p_config jsonb,
  p_actor_user_id uuid
)
RETURNS TABLE(id uuid, version integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_audience text;
  v_version integer;
  v_asset text;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles AS actor WHERE actor.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'valid actor is required' USING ERRCODE = '22023';
  END IF;
  IF p_config IS NULL OR jsonb_typeof(p_config) <> 'object' THEN
    RAISE EXCEPTION 'template config must be a JSON object' USING ERRCODE = '22023';
  END IF;

  v_asset := p_config ->> 'assetKey';
  IF p_config ->> 'assetKey' IS NULL
     OR p_config ->> 'defaultFormat' IS NULL
     OR p_config ->> 'motion' IS NULL
     OR p_config ->> 'defaultFormat' NOT IN ('vertical', 'horizontal')
     OR p_config ->> 'motion' NOT IN ('slow', 'fade') THEN
    RAISE EXCEPTION 'unsupported template format or motion' USING ERRCODE = '22023';
  END IF;

  SELECT audience INTO v_audience
  FROM public.video_templates
  WHERE video_templates.id = p_template_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'video template not found' USING ERRCODE = 'P0002';
  END IF;

  IF (v_audience = 'kids' AND NOT (v_asset = ANY (ARRAY['kids-garden', 'kids-nature', 'kids-neighborhood', 'kids-workshop']::text[])))
     OR (v_audience = 'general' AND NOT (v_asset = ANY (ARRAY['calm', 'dawn', 'emerald', 'gold', 'night', 'paper', 'rose']::text[]))) THEN
    RAISE EXCEPTION 'asset does not match template audience' USING ERRCODE = '22023';
  END IF;

  SELECT COALESCE(MAX(video_template_versions.version), 0) + 1
  INTO v_version
  FROM public.video_template_versions
  WHERE video_template_versions.template_id = p_template_id;

  RETURN QUERY
  INSERT INTO public.video_template_versions AS inserted (
    template_id, version, config, status, is_system_seed, created_by
  )
  VALUES (p_template_id, v_version, p_config, 'draft', false, p_actor_user_id)
  RETURNING inserted.id, inserted.version;
END;
$function$;

CREATE OR REPLACE FUNCTION public.activate_video_template_version(
  p_version_id uuid,
  p_actor_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_template_id uuid;
  v_status text;
  v_is_system_seed boolean;
  v_reviewed_by uuid;
  v_reviewed_at timestamptz;
BEGIN
  IF p_actor_user_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.profiles AS actor WHERE actor.id = p_actor_user_id
  ) THEN
    RAISE EXCEPTION 'valid actor is required' USING ERRCODE = '22023';
  END IF;

  SELECT template_id, status, is_system_seed, reviewed_by, reviewed_at
  INTO v_template_id, v_status, v_is_system_seed, v_reviewed_by, v_reviewed_at
  FROM public.video_template_versions
  WHERE id = p_version_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'video template version not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_status NOT IN ('approved', 'retired', 'active') THEN
    RAISE EXCEPTION 'only reviewed template versions can be activated' USING ERRCODE = '55000';
  END IF;
  IF NOT v_is_system_seed AND (v_reviewed_by IS NULL OR v_reviewed_at IS NULL) THEN
    RAISE EXCEPTION 'review evidence is required before activation' USING ERRCODE = '23514';
  END IF;

  UPDATE public.video_template_versions
  SET status = 'retired'
  WHERE template_id = v_template_id
    AND status = 'active'
    AND id <> p_version_id;

  UPDATE public.video_template_versions
  SET status = 'active',
      activated_by = p_actor_user_id,
      activated_at = now()
  WHERE id = p_version_id;

  RETURN p_version_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_create_video_template_version(uuid, jsonb, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activate_video_template_version(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_video_template_version(uuid, jsonb, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.activate_video_template_version(uuid, uuid)
  TO service_role;

-- Cover the remaining unindexed foreign key reported by the Supabase advisor.
CREATE INDEX IF NOT EXISTS youtube_oauth_credentials_connected_by_idx
  ON public.youtube_oauth_credentials(connected_by);

-- The previous error string included the complete Google API URL. Replace it without
-- exposing or storing the credential again.
UPDATE public.youtube_sync_state
SET last_error = 'YouTube feed sync previously stored a provider request URL; the URL has been redacted. Check the route-rendering fix and rotate the API key.',
    updated_at = now()
WHERE id = 1
  AND last_error ~* 'key=';
