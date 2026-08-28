-- Persist asynchronous HeyGen state so scheduled workers can poll a submitted
-- provider job without creating a duplicate video on every invocation.
ALTER TABLE public.video_generation_requests
  ADD COLUMN IF NOT EXISTS heygen_video_id text,
  ADD COLUMN IF NOT EXISTS heygen_status text,
  ADD COLUMN IF NOT EXISTS heygen_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS heygen_last_polled_at timestamptz;

-- A provider video ID must map to one ZIKR request. NULL remains permitted for
-- queued rows that have not yet been submitted to HeyGen.
CREATE UNIQUE INDEX IF NOT EXISTS video_generation_requests_heygen_video_id_key
  ON public.video_generation_requests (heygen_video_id)
  WHERE heygen_video_id IS NOT NULL;

-- Supports the bounded status-poll query used by GitHub Actions.
CREATE INDEX IF NOT EXISTS idx_video_generation_requests_processing_heygen
  ON public.video_generation_requests (updated_at ASC)
  WHERE status = 'processing' AND heygen_video_id IS NOT NULL;

-- Keep provider-state values explicit while allowing null for legacy/new rows.
ALTER TABLE public.video_generation_requests
  DROP CONSTRAINT IF EXISTS video_generation_requests_heygen_status_check;

ALTER TABLE public.video_generation_requests
  ADD CONSTRAINT video_generation_requests_heygen_status_check
  CHECK (heygen_status IS NULL OR heygen_status IN ('processing', 'completed', 'failed'));
