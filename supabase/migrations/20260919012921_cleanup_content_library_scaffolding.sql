-- Remove seed scaffolding from content_library.
-- These rows are not editorial content: every current row uses the starter-* slug,
-- is unpublished, has no source, and contains only the 56-character scaffold text.
-- Keep real editorial content untouched.
delete from public.content_library
where slug like 'starter-%'
  and published = false
  and source_id is null;

