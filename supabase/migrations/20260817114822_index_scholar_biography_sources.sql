-- Add explicit source status to scholar biographies.
-- Only institutional sources verified during this audit are marked primary_indexed.

update public.scholars
set metadata = jsonb_build_object(
  'content_status', 'primary_indexed',
  'references', jsonb_build_array(jsonb_build_object(
    'url', 'https://binbaz.org.sa/about',
    'title_ar', 'الموقع الرسمي لسماحة الشيخ الإمام ابن باز — عن الموقع',
    'locator_ar', 'صفحة تعريفية بالموقع وأعمال الشيخ',
    'source_type', 'official_archive'
  ))
)
where slug = 'ibn-baz';

update public.scholars
set metadata = jsonb_build_object(
  'content_status', 'primary_indexed',
  'references', jsonb_build_array(jsonb_build_object(
    'url', 'https://www.uthaymeen.com/',
    'title_ar', 'أرشيف أعمال الشيخ محمد بن صالح العثيمين — صفحة السيرة',
    'locator_ar', 'السيرة والدراسة والتدريس والأعمال العلمية',
    'source_type', 'official_archive'
  ))
)
where slug = 'uthaymin';

update public.scholars
set metadata = jsonb_build_object(
  'content_status', 'source_review_required',
  'editorial_note_ar', 'السيرة موجزة ومثبتة في قاعدة البيانات، لكن يلزم استكمال إحالات مؤسسية أو ببليوغرافية محددة قبل توسيعها أو نقل أقوال منها.'
)
where slug in ('ibn-qayyim','nawawi','saadi','shaarawi','albani','ibn-taymiyyah');
