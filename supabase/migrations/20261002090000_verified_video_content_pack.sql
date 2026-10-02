-- Verified educational video content pack for ZIKR.
-- Editorial summaries are original; Quran/Hadith links point to primary reference pages.
insert into public.video_categories (name_ar, name_en, slug, description_ar, description_en, icon, published, is_active)
values
  ('القرآن وعلومه', 'Quran & Sciences', 'quran-verified', 'تدبر تعليمي مرتبط بمواضع القرآن ومراجع التفسير.', 'Educational Quran reflections with references.', '📖', true, true),
  ('السنة والسيرة', 'Sunnah & Seerah', 'sunnah-verified', 'شرح تربوي يحيل إلى كتب الحديث الأصلية.', 'Educational hadith content with primary references.', '🌙', true, true),
  ('قصص موثقة', 'Verified Stories', 'verified-stories', 'قصص الأنبياء والسيرة مع فصل النص عن الدرس التحريري.', 'Stories grounded in primary sources.', '🧭', true, true),
  ('الأذكار', 'Adhkar', 'adhkar-verified', 'مواد عملية للأذكار مع الإحالة إلى مصادرها.', 'Practical adhkar content with references.', '🤲', true, true),
  ('رسالة عامة', 'General Reminders', 'general-reminders', 'رسائل أصلية غير منسوبة إلى نص شرعي.', 'Original non-attributed reminders.', '💬', true, true)
on conflict (slug) do update set name_ar=excluded.name_ar, name_en=excluded.name_en, description_ar=excluded.description_ar, description_en=excluded.description_en, icon=excluded.icon, published=true, is_active=true, updated_at=now();

insert into public.videos (title, slug, description, category_id, duration, views, published, metadata)
select v.title, v.slug, v.description, c.id, v.duration, 0, true, v.metadata::jsonb
from (values
  ('تدبر سورة الفاتحة: خريطة العبودية والهداية','quran-reflection-al-fatiha','مسار تعليمي يربط بين الحمد والرحمة والعبادة والاستعانة وطلب الهداية.',600,'{"content_kind":"verified_editorial","sources":[{"label":"سورة الفاتحة — القرآن الكريم","url":"https://quran.com/1"},{"label":"التفسير الميسر — الفاتحة","url":"https://quran.com/1:1/tafsirs/ar-tafsir-muyassar"}]}'),
  ('سورة العصر: رأس مال الوقت والعمل الصالح','quran-reflection-al-asr','شرح موجز للإيمان والعمل والتواصي بالحق والصبر.',480,'{"content_kind":"verified_editorial","sources":[{"label":"سورة العصر — القرآن الكريم","url":"https://quran.com/103"}]}'),
  ('قصة يوسف عليه السلام: الصبر الذي لا يبرر الخطأ','story-yusuf-patience','قراءة متسلسلة لمراحل الرؤيا والجب والابتلاء والسجن والتمكين.',720,'{"content_kind":"verified_story","sources":[{"label":"سورة يوسف — القرآن الكريم","url":"https://quran.com/12"}]}'),
  ('قصة موسى عليه السلام: الخوف مع أداء الأمانة','story-musa-courage','سرد تعليمي يجمع المواضع القرآنية الأساسية لقصة موسى.',720,'{"content_kind":"verified_story","sources":[{"label":"سورة القصص — القرآن الكريم","url":"https://quran.com/28"},{"label":"سورة طه — القرآن الكريم","url":"https://quran.com/20"}]}'),
  ('أذكار الصباح: بناء ورد ثابت مع التثبت','adhkar-morning-evidence','دليل عملي لاختيار ورد الصباح وفهم عدد التكرار وربط الذكر ببداية اليوم.',600,'{"content_kind":"verified_adhkar","sources":[{"label":"صحيح البخاري 6306","url":"https://sunnah.com/bukhari:6306"},{"label":"الأحزاب 41–42","url":"https://quran.com/33/41-42"}]}'),
  ('الأذكار بعد الصلاة: ترتيب هادئ بلا استعجال','adhkar-after-prayer','مادة تشرح الذكر بعد الصلاة وتؤكد أن العداد أداة تذكير.',600,'{"content_kind":"verified_adhkar","sources":[{"label":"صحيح مسلم 591","url":"https://sunnah.com/muslim/5/171"}]}'),
  ('رسالة عامة: تثبت قبل أن تشارك','general-verify-before-sharing','رسالة توعوية أصلية عن التثبت قبل نشر المحتوى الديني.',420,'{"content_kind":"general_reminder","sources":[{"label":"منهج التثبت في ذِكر","url":"/articles/verify-religious-information-before-sharing"}]}'),
  ('رسالة عامة: اجعل التقنية خادمة للعبادة','general-digital-worship','رسالة توعوية أصلية عن الاستخدام الهادئ للتقنية.',420,'{"content_kind":"general_reminder","sources":[{"label":"دليل الاستخدام الهادئ في ذِكر","url":"/articles/digital-discipline-and-worship"}]}')
) as v(title, slug, description, duration, metadata)
join public.video_categories c on c.slug = case
  when v.slug like 'quran-%' then 'quran-verified'
  when v.slug like 'story-%' then 'verified-stories'
  when v.slug like 'adhkar-%' then 'adhkar-verified'
  else 'general-reminders' end
on conflict (slug) do update set title=excluded.title, description=excluded.description, category_id=excluded.category_id, duration=excluded.duration, metadata=excluded.metadata, published=true, updated_at=now();
