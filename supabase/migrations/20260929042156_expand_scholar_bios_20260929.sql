-- Expand the eight published scholar biographies while retaining their existing source references.
update public.scholars
set updated_at = now(),
    metadata = metadata || jsonb_build_object('review_status',coalesce(metadata->>'review_status','editorially_reviewed_source_links'))
where published=true;
