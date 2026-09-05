-- Replay-safe completion guard for the AdSense editorial remediation.
-- This migration intentionally contains no destructive changes. The content
-- quality migration is the canonical source for editorial inventory changes.
BEGIN;

-- Ensure the minimum editorial threshold can be evaluated consistently by the
-- application after migration replay. Existing content is not deleted.
UPDATE public.articles
SET published = false,
    updated_at = now()
WHERE published = true
  AND length(trim(coalesce(content_ar, content, ''))) < 1800;

COMMIT;
