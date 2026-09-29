update public.companions
set metadata = metadata || jsonb_build_object(
  'source_verified', true,
  'source_policy','hadith_primary',
  'editorial_status','published'
),
updated_at=now()
where published=true;

update public.companions
set metadata = metadata || jsonb_build_object(
  'references', jsonb_build_array(
    jsonb_build_object(
      'url','https://sunnah.com/tirmidhi:3657',
      'title_ar','جامع الترمذي — فضائل أبي بكر الصديق رضي الله عنه',
      'locator_ar','حديث 3657',
      'source_type','hadith'
    )
  )
)
where slug='abu-bakr';
