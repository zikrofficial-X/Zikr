-- Keep the human-readable automation descriptions aligned with the live worker settings.
-- This does not change any enable/disable values or publishing permissions.

update public.admin_settings
set description = case key
  when 'video_automation_ai_enabled' then
    'تمكين مزودي التوليد المرئي بالذكاء الاصطناعي (Hugging Face LTX وWAN) مع الرجوع الآمن إلى قالب FFmpeg المحلي عند تعذر المزود.'
  when 'video_automation_auto_publish' then
    'السماح بالنشر التلقائي بعد اكتمال طلب الفيديو والتحقق من تطابق رابط الوسائط والمصدر وصلاحيات المنصات. عند التعطيل تعود موافقة المراجعة البشرية لتكون مطلوبة.'
  when 'video_automation_facebook_enabled' then
    'إتاحة النشر إلى Facebook وReels؛ يتحقق عامل النشر من اتصال OAuth الفعلي وصلاحية رمز الصفحة قبل معالجة الطابور.'
  else description
end
where key in (
  'video_automation_ai_enabled',
  'video_automation_auto_publish',
  'video_automation_facebook_enabled'
);
