update public.hadiths
set grade_ar = case
  when coalesce(trim(grade_ar),'')='' then 'غير مذكور في سجل المصدر'
  else grade_ar
end,
grade_en = case
  when coalesce(trim(grade_en),'')='' then 'Not provided in source dataset'
  else grade_en
end,
updated_at=now()
where published=true;
