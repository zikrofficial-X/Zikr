-- Keep one shared next-allowed timestamp for Facebook Reels. Meta code 368 uses a
-- 24-hour cooldown; confirmed successful posts also pace subsequent Reels to avoid bursts.
ALTER TABLE public.social_platform_credentials
  ADD COLUMN IF NOT EXISTS facebook_reels_next_allowed_at timestamptz;

COMMENT ON COLUMN public.social_platform_credentials.facebook_reels_next_allowed_at
  IS 'Next allowed Facebook Reels publish time; stores Meta rate-limit cooldowns and post-success pacing without marking OAuth disconnected.';
