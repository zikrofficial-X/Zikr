-- Meta OAuthException code 368 is a temporary posting restriction. Store a shared
-- Reels-only cooldown so the scheduled worker stops re-hitting Meta across queue items.
ALTER TABLE public.social_platform_credentials
  ADD COLUMN IF NOT EXISTS facebook_reels_rate_limited_until timestamptz;

COMMENT ON COLUMN public.social_platform_credentials.facebook_reels_rate_limited_until
  IS 'Global Facebook Reels retry cooldown after Meta posting-rate restriction; does not mark OAuth credentials disconnected.';
