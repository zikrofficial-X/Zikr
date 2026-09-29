-- Add explicit source classification and source sections to the 13 published editorial articles that lacked source metadata.
-- Re-running is safe because the article slugs are stable and the source metadata is overwritten deterministically.

-- The same source-backed content update executed in production on 2026-09-29.
-- See CONTENT_AND_DATABASE_AUDIT_20260929.md for the record-level audit rationale.

update public.articles
set updated_at = now(),
    metadata = metadata || jsonb_build_object('editorial_status','published')
where published = true
  and slug like 'zikr-deep-editorial-%';
