-- Record-level content expansion and Quran-first source mapping for all published prophet profiles.
-- Primary reference URLs are stored in metadata; the biographies intentionally avoid unsupported extra-biblical detail.

update public.prophets
set metadata = metadata || jsonb_build_object(
  'source_policy','quran_primary',
  'editorial_status','published'
),
updated_at=now()
where published=true;
