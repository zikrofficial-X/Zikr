-- Hide published media that has no verified playable source.
-- Rows are preserved and marked for source remediation; no content is deleted.
UPDATE public.videos
SET metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'content_source', 'youtube',
      'source_ref', youtube_id,
      'source_note', 'Existing YouTube source identifier retained; verify channel ownership before editorial promotion'
    ),
    updated_at = now()
WHERE published IS TRUE
  AND coalesce(youtube_id, '') <> '';

UPDATE public.videos
SET published = false,
    updated_at = now(),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'publication_block', 'No verified playable source; hidden until an official source is supplied',
      'blocked_at', now()
    )
WHERE published IS TRUE
  AND coalesce(youtube_id, '') = '';

UPDATE public.tawasheeh
SET published = false,
    updated_at = now(),
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'publication_block', 'Placeholder or unverified audio URL; hidden until a verified source is supplied',
      'blocked_at', now()
    )
WHERE published IS TRUE
  AND (audio_url IS NULL OR audio_url LIKE 'https://example.com/%');
