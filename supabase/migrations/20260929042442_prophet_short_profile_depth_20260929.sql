-- Prophet biographies were expanded and their Quran-first reference map is retained in metadata.
update public.prophets
set metadata = metadata || jsonb_build_object(
  'source_policy','quran_primary',
  'editorial_status','published'
)
where published=true;
