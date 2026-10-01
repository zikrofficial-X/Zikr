-- Harden the durable video pipeline for every supported studio category.
-- The original constraint predated the admin studio's "other" category.
ALTER TABLE public.video_generation_requests
  DROP CONSTRAINT IF EXISTS video_generation_requests_category_check;

ALTER TABLE public.video_generation_requests
  ADD CONSTRAINT video_generation_requests_category_check
  CHECK (category IN ('quran', 'hadith', 'story', 'dua', 'adhkar', 'other'));

CREATE INDEX IF NOT EXISTS idx_video_generation_requests_stale_processing
  ON public.video_generation_requests (updated_at)
  WHERE status = 'processing' AND video_url IS NULL;
