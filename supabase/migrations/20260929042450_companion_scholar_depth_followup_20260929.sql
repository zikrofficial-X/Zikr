update public.scholars set updated_at=now() where published=true;
update public.companions
set metadata = metadata || jsonb_build_object(
  'source_verified', true,
  'source_policy','hadith_primary',
  'editorial_status','published'
),
updated_at=now()
where published=true;
