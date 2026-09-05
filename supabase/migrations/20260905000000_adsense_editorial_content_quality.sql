-- ZIKR editorial quality remediation
-- Keep the production database free of thin public article pages.
-- Editorial seed content is managed separately so this migration remains
-- deterministic and replay-safe in Supabase Preview/CI environments.

BEGIN;

UPDATE public.articles
SET published = false,
    updated_at = now()
WHERE published = true
  AND length(trim(coalesce(content_ar, content, ''))) < 1800;

COMMIT;
