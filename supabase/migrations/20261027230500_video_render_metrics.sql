-- Track visual template performance without parsing JSON content at query time.
ALTER TABLE public.video_generation_requests
  ADD COLUMN IF NOT EXISTS scene text,
  ADD COLUMN IF NOT EXISTS render_duration_ms integer;

ALTER TABLE public.video_generation_requests
  DROP CONSTRAINT IF EXISTS video_generation_requests_render_duration_ms_check;

ALTER TABLE public.video_generation_requests
  ADD CONSTRAINT video_generation_requests_render_duration_ms_check
  CHECK (render_duration_ms IS NULL OR render_duration_ms >= 0);

CREATE INDEX IF NOT EXISTS idx_video_generation_requests_scene
  ON public.video_generation_requests (scene);

CREATE INDEX IF NOT EXISTS idx_video_generation_requests_template_scene
  ON public.video_generation_requests (template_version, scene);

COMMENT ON COLUMN public.video_generation_requests.scene IS
  'Normalized visual template scene used for this generation attempt.';

COMMENT ON COLUMN public.video_generation_requests.render_duration_ms IS
  'Elapsed render pipeline time in milliseconds, measured until media QA completes.';
