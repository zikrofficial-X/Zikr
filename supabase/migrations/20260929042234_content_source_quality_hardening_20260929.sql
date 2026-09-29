update public.duas
set metadata = metadata || jsonb_build_object(
  'source_type', case when coalesce((metadata->>'not_hadith_quote')::boolean,false) then 'editorial' else coalesce(metadata->>'source_type','editorial') end,
  'editorial_status','published'
)
where published=true
  and coalesce(metadata->>'source_type','')='';

update public.videos
set metadata = metadata || jsonb_build_object(
  'source_url', concat('https://www.youtube.com/watch?v=',youtube_id),
  'source_verification_status','pending',
  'editorial_status','published_external_unverified',
  'needs_source_review',true
),
updated_at=now()
where published=true;

update public.hadiths h
set grade_ar = case
  when hb.name_ar='صحيح البخاري' then 'صحيح — ضمن صحيح البخاري'
  when hb.name_ar='صحيح مسلم' then 'صحيح — ضمن صحيح مسلم'
  else h.grade_ar
end,
updated_at=now()
from public.hadith_books hb
where h.book_id=hb.id
  and h.published=true
  and (h.grade_ar is null or trim(h.grade_ar)='')
  and hb.name_ar in ('صحيح البخاري','صحيح مسلم');
