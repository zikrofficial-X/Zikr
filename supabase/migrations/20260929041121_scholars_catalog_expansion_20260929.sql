-- Expand the published scholar catalog with source-verified historical profiles.
-- Idempotent by slug.

insert into public.scholars
  (id, name_ar, name_en, slug, bio_ar, bio_en, website_url, youtube_url, published, metadata)
select
  gen_random_uuid(),
  v.name_ar,
  v.name_en,
  v.slug,
  v.bio_ar,
  v.bio_en,
  v.website_url,
  null,
  true,
  v.metadata::jsonb
from (
  values
    ('الإمام أبو حنيفة النعمان بن ثابت','Abu Hanifa','abu-hanifa',
     'فقيه وعالم من الكوفة عاش في القرنين الأول والثاني الهجريين، ونُسبت إليه المدرسة الحنفية. تعرض هذه الصفحة أثره في الفقه وتاريخ تشكل المدرسة مع إحالات إلى مصادر بحثية مستقلة، دون تحويل السيرة التاريخية إلى فتوى.',
     'A jurist and scholar from Kufa who lived in the first two Islamic centuries and is associated with the Hanafi school. This profile presents his historical and legal legacy with independent references rather than treating biography as a fatwa.',
     'https://www.iranicaonline.org/articles/abu-hanifa-noman-b',
     '{"category":"متقدمين","field":"الفقه وأصوله","source_verified":true,"review_status":"editorially_reviewed_source_links","references":[{"url":"https://www.iranicaonline.org/articles/abu-hanifa-noman-b","title_ar":"Encyclopaedia Iranica — أبو حنيفة","source_type":"academic"}]}'::json),
    ('الإمام يحيى بن شرف النووي','Yahya ibn Sharaf al-Nawawi','al-nawawi',
     'فقيه ومحدث شافعي من علماء القرن السابع الهجري، ارتبطت به مؤلفات في الحديث والفقه مثل رياض الصالحين وشرح صحيح مسلم. تقدم الصفحة نبذة تاريخية ومراجع دون نسبة أقوال إليه بلا توثيق.',
     'A Shafi‘i jurist and hadith scholar of the seventh Islamic century, known for works in hadith and jurisprudence including Riyad al-Salihin and his commentary on Sahih Muslim. The profile is historical and source-linked.',
     'https://kclpure.kcl.ac.uk/ws/files/2927554/503464.pdf',
     '{"category":"متقدمين","field":"الحديث والفقه","source_verified":true,"review_status":"editorially_reviewed_source_links","references":[{"url":"https://kclpure.kcl.ac.uk/ws/files/2927554/503464.pdf","title_ar":"King''s College London — دراسة حياة النووي والحديث","source_type":"academic"}]}'::json),
    ('تقي الدين أحمد بن تيمية','Taqi al-Din Ahmad Ibn Taymiyya','ibn-taymiyya',
     'عالم حنبلي من دمشق في العصر المملوكي، وُلد سنة 1263م وتوفي سنة 1328م. تناولت الدراسات الحديثة فكره في العقيدة والفقه والمنهج والتفاعل مع قضايا عصره، ولذلك تعرض الصفحة المعلومات التاريخية مع إحالة أكاديمية واضحة.',
     'A Hanbali scholar from the Mamluk period, born in 1263 and died in 1328. Modern scholarship discusses his work in theology, law, method, and the issues of his time; this profile keeps those descriptions historical and source-linked.',
     'https://plato.stanford.edu/entries/ibn-taymiyya/',
     '{"category":"متقدمين","field":"العقيدة والفقه والمنهج","source_verified":true,"review_status":"editorially_reviewed_source_links","references":[{"url":"https://plato.stanford.edu/entries/ibn-taymiyya/","title_ar":"Stanford Encyclopedia of Philosophy — ابن تيمية","source_type":"academic"},{"url":"https://academic.oup.com/reference/62361/reference-article-abstract/554574605","title_ar":"Oxford Bibliographies — Ibn Taymiyya","source_type":"academic"}]}'::json),
    ('الحافظ ابن كثير','Isma‘il ibn Umar ibn Kathir','ibn-kathir',
     'مفسر ومحدث ومؤرخ من علماء دمشق في القرن الثامن الهجري، اشتهر بتفسير القرآن وبأعماله في الحديث والتاريخ والسيرة. تعرض الصفحة أثره العلمي مع الإحالة إلى دراسات ومراجع يمكن الرجوع إليها.',
     'A Qur’anic exegete, hadith scholar, and historian associated with Damascus in the eighth Islamic century, known especially for his tafsir and works in hadith, history, and sira.',
     'https://etheses.whiterose.ac.uk/id/eprint/548/1/uk_bl_ethos_496564.pdf',
     '{"category":"متقدمين","field":"التفسير والحديث والتاريخ","source_verified":true,"review_status":"editorially_reviewed_source_links","references":[{"url":"https://etheses.whiterose.ac.uk/id/eprint/548/1/uk_bl_ethos_496564.pdf","title_ar":"University of Leeds/White Rose — دراسة ابن كثير والتفسير","source_type":"academic"},{"url":"https://dar-us-salam.com/authors/hafiz-ibn-kathir.htm","title_ar":"دار السلام — السيرة والأعمال","source_type":"reference"}]}'::json)
) as v(name_ar,name_en,slug,bio_ar,bio_en,website_url,metadata)
where not exists (select 1 from public.scholars s where s.slug = v.slug);
