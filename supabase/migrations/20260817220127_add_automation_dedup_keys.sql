-- Durable idempotency keys for scheduled media generation and publishing.
-- Partial unique indexes allow legacy/manual rows without a key to remain unchanged.
ALTER TABLE public.video_generation_requests
  ADD COLUMN IF NOT EXISTS automation_key text;

CREATE UNIQUE INDEX IF NOT EXISTS video_generation_requests_automation_key_unique
  ON public.video_generation_requests (automation_key)
  WHERE automation_key IS NOT NULL;

DO $$
BEGIN
  IF to_regclass('public.social_publish_queue') IS NOT NULL THEN
    ALTER TABLE public.social_publish_queue
      ADD COLUMN IF NOT EXISTS automation_key text;

    CREATE UNIQUE INDEX IF NOT EXISTS social_publish_queue_automation_key_unique
      ON public.social_publish_queue (automation_key)
      WHERE automation_key IS NOT NULL;
  END IF;
END $$;
