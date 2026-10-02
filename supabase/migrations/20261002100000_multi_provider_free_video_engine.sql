-- Multi Provider Free Video Engine: additive, idempotent hardening.
ALTER TABLE public.video_generation_requests
  ADD COLUMN IF NOT EXISTS content_hash text,
  ADD COLUMN IF NOT EXISTS source_hash text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_job_id text,
  ADD COLUMN IF NOT EXISTS template_version text,
  ADD COLUMN IF NOT EXISTS generation_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS publish_status text;

ALTER TABLE public.video_generation_requests DROP CONSTRAINT IF EXISTS video_generation_requests_status_check;
ALTER TABLE public.video_generation_requests ADD CONSTRAINT video_generation_requests_status_check
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry_wait', 'cancelled'));

CREATE UNIQUE INDEX IF NOT EXISTS video_generation_requests_content_hash_unique
  ON public.video_generation_requests (content_hash) WHERE content_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_generation_requests_source_id ON public.video_generation_requests ((content->>'sourceId'));
CREATE INDEX IF NOT EXISTS idx_video_generation_requests_next_retry_at ON public.video_generation_requests (next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_video_generation_requests_provider ON public.video_generation_requests (provider);

CREATE TABLE IF NOT EXISTS public.video_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  created_count integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  provider_stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_summary text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.video_automation_runs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_video_automation_runs_started_at ON public.video_automation_runs (started_at DESC);
