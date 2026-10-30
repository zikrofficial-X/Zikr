-- ZIKR content expansion 2026-10-30. Idempotent and source-grounded.
BEGIN;

INSERT INTO public.dua_categories(name_ar,name_en,slug,description_ar,description_en,published,is_active)
SELECT v.name_ar,v.name_en,v.slug,v.description_ar,v.description_en,true,true
FROM (VALUES
('أدعية القرآن','Quranic Duas','quranic-duas','أدعية من القرآن الكريم مع رقم السورة والآية.','Supplications from the Quran with surah and verse references.'),
('أدعية السنة','Prophetic Supplications','sunnah-duas','أدعية نبوية مرتبطة بمصادر الروايات.','Prophetic supplications linked to hadith sources.'),
('أذكار الصباح والمساء','Morning & Evening','morning-evening','أذكار الأوقات اليومية ومصادر ألفاظها.','Daily remembrance and source references.'),
('أذكار الصلاة','Prayer Remembrance','prayer-worship','أذكار الصلاة والطهارة والعبادة.','Prayer, purification, and worship remembrance.'),
('الأسرة والوالدان','Family & Parents','family-relations','أدعية للأسرة والوالدين والذرية.','Supplications for family, parents, and children.'),
('أحوال الحياة','Life Situations','life-situations','أدعية عامة مع تمييز المأثور من الصياغة التحريرية.','General supplications with source type clearly identified.')
) AS v(name_ar,name_en,slug,description_ar,description_en)
WHERE NOT EXISTS(SELECT 1 FROM public.dua_categories c WHERE c.slug=v.slug);

UPDATE public.duas d
SET category_id=CASE WHEN d.metadata->>'source_type'='quran'
  THEN (SELECT id FROM public.dua_categories WHERE slug='quranic-duas')
  ELSE (SELECT id FROM public.dua_categories WHERE slug='life-situations') END,
  updated_at=now()
WHERE d.category_id IS NULL;

WITH requested(surah_order,ayah_number,title_ar,title_en,occasion_ar,benefits_ar,surah_name) AS (VALUES
(2,250,'دعاء الصبر والثبات','Patience and Steadfastness','عند الشدائد','طلب الصبر والثبات','البقرة'),
(3,16,'دعاء المغفرة والوقاية','Seeking Forgiveness','طلب المغفرة وحسن العاقبة','التضرع بالمغفرة','آل عمران'),
(3,53,'دعاء الإيمان والاتباع','Faith and Following','طلب الثبات على الإيمان','الدعاء بالاتباع','آل عمران'),
(7,47,'دعاء السلامة من الظلم','Protection from Wrongdoing','التضرع إلى الله','طلب النجاة من الظلم','الأعراف'),
(14,40,'دعاء إقامة الصلاة','Establishing Prayer','الدعاء للأسرة والذرية','طلب الصلاح وإقامة الصلاة','إبراهيم'),
(14,41,'دعاء المغفرة للوالدين','Forgiveness for Parents','الدعاء للوالدين والمؤمنين','طلب المغفرة','إبراهيم'),
(18,10,'دعاء الرحمة والرشد','Mercy and Guidance','عند الحيرة وطلب الرشد','طلب الرحمة والتوفيق','الكهف'),
(23,109,'دعاء المغفرة والرحمة','Mercy and Forgiveness','طلب الرحمة والمغفرة','التضرع إلى الله','المؤمنون'),
(59,10,'دعاء سلامة الصدر','Purity of Heart','الدعاء للمؤمنين','طلب سلامة القلب','الحشر'),
(66,8,'دعاء إتمام النور','Perfecting the Light','طلب المغفرة وحسن العاقبة','التضرع بالمغفرة','التحريم')
),
canonical AS (
  SELECT r.*,a.text_uthmani,
    'https://quran.com/'||r.surah_order||'/'||r.ayah_number AS source_url
  FROM requested r
  JOIN public.quran_surahs s ON s."order"=r.surah_order
  JOIN public.quran_ayahs a ON a.surah_id=s.id AND a.ayah_number=r.ayah_number
)
INSERT INTO public.duas(category_id,title_ar,title_en,slug,text_ar,occasion_ar,source_ar,benefits_ar,published,metadata)
SELECT (SELECT id FROM public.dua_categories WHERE slug='quranic-duas'),
  c.title_ar,c.title_en,
  'zikr-dua-quran-'||lpad(c.surah_order::text,3,'0')||lpad(c.ayah_number::text,3,'0'),
  c.text_uthmani,c.occasion_ar,
  'القرآن الكريم — '||c.surah_name||' '||c.ayah_number,
  c.benefits_ar,true,
  jsonb_build_object('source_type','quran','source_url',c.source_url,'reference',c.source_url,'source_locked',true,'content_expansion_version','2026-10-30')
FROM canonical c
WHERE NOT EXISTS (
  SELECT 1 FROM public.duas d
  WHERE d.slug='zikr-dua-quran-'||lpad(c.surah_order::text,3,'0')||lpad(c.ayah_number::text,3,'0')
);

WITH incoming(category_slug,title_ar,title_en,slug,summary_ar,summary_en,content_ar,content_en,tags,metadata) AS (VALUES
('quran','من الآية إلى السياق: منهج عملي لقراءة القرآن','From Verse to Context','quran-reading-context','خطوات عملية لفهم موضع الآية والرجوع إلى تفسير موثوق.','A practical method for reading verses in context and consulting reliable tafsir.','اقرأ الآية مع ما قبلها وما بعدها، وحدد موضوع المقطع قبل تدوين الفائدة. لا تقتطع جملة ثم تحملها معنى منفصلًا. ارجع إلى تفسير موثوق يشرح المفردات وصلات الآيات وأسباب النزول عند ثبوتها.

قسّم ملاحظاتك إلى النص القرآني كما في المصحف، وشرح المفسر، والفائدة الشخصية. عند مشاركة فائدة اذكر السورة ورقم الآية واسم التفسير وموضعه. لا تعدل رسم الآية ولا تضف كلمات داخل الاقتباس.','Read the verse with its surrounding passage and identify the section''s topic before recording a reflection. Consult a reliable tafsir for vocabulary, connections between verses, and established occasions of revelation.

Keep the Quranic text, the scholar''s explanation, and your personal reflection distinct. Cite the surah, verse, tafsir title, and location when sharing a note.','القرآن|التدبر|التفسير','{"review_status":"pending_editorial_review","references":["https://quran.com/1","https://quran.com/2"],"content_expansion_version":"2026-10-30"}'::jsonb),
('aqeedah','تعلم أصول الإيمان والتحقق من الدليل','Learning Faith with Evidence','faith-and-evidence','مدخل منظم يميز بين النص الشرعي وشرحه والتلخيص الشخصي.','A structured introduction distinguishing scripture, scholarly explanation, and personal summary.','ابدأ بالمحكم الواضح من القرآن والسنة الصحيحة ثم اقرأ شرحًا لعالم موثوق. فرّق بين نص الدليل وشرح العالم وصياغتك أنت؛ النص ينقل كما ورد، والشرح ينسب إلى صاحبه، والتلخيص يوسم بأنه عمل تحريري.

تحقق من مصدر الحديث ودرجته قبل الاستشهاد به. لا تجعل الخلاف العلمي سببًا للتعصب ولا تنقل حكمًا على شخص من مقطع مجتزأ. دوّن الأسئلة ثم اعرض ما أشكل عليك على معلم مؤهل.','Begin with clear Quranic passages and authentic Sunnah, then consult qualified scholarship. Keep the source text, scholarly explanation, and your own summary separate.

Verify hadith references and grading before citing them. Record questions and take difficult matters to a qualified teacher rather than relying on clipped social-media posts.','العقيدة|الإيمان|المصادر','{"review_status":"pending_editorial_review","references":["https://quran.com/112","https://quran.com/2/285"],"content_expansion_version":"2026-10-30"}'::jsonb),
('fiqh','تنظيم اليوم حول الصلوات الخمس','Planning a Day Around the Five Prayers','planning-around-prayer','طريقة عملية لتخطيط اليوم حول المواقيت المحلية دون الاعتماد على توقيت ثابت.','A practical routine built around local prayer times, not fixed generic schedules.','ابدأ بمعرفة مواقيت مدينتك من مصدر موثوق وتأكد من المنطقة الزمنية وطريقة الحساب. خصص وقتًا للاستعداد والوضوء والانتقال، وضع المهام الكبيرة بين الصلوات وعدّل الجدول بحسب العمل والصحة ومسؤوليات الأسرة.

قد تختلف دقائق المواقيت بين الجهات وطرق الحساب؛ ارجع إلى الجهة المحلية التي تتبعها عند وجود اختلاف. مسائل السفر والمرض والجمع والقصر لها شروط وتفاصيل، ولا يستخرج حكمها من تطبيق المواقيت.','Use a trusted local timetable and confirm the city, time zone, and calculation method. Leave room for preparation and travel, and adapt the schedule to work, health, and family responsibilities.

Calculation methods may differ by a few minutes. For travel, illness, or combining prayers, seek qualified guidance; a timetable app is not a source of legal rulings.','الصلاة|الوقت|المواقيت','{"review_status":"pending_editorial_review","references":["https://quran.com/4/103","https://quran.com/17/78"],"content_expansion_version":"2026-10-30"}'::jsonb),
('fiqh','تعلم الوضوء خطوة خطوة','Learning Wudu Step by Step','wudu-learning-guide','مدخل تعليمي للوضوء من الآية والمصادر الفقهية الموثوقة.','A learning guide to wudu grounded in Quran and reliable fiqh references.','اقرأ آية الوضوء في سورة المائدة، ثم راجع شرحًا فقهيًا موثوقًا يبين الأعضاء والترتيب وما يتعلق بالنية والغسل والمسح. تعلم الصفة من معلم أو مادة موثقة ثم طبقها بهدوء.

عند تعليم طفل اشرح له اسم العضو ودعه يطبق بنفسه ثم صحح الخطأ بلطف. تجنب الإسراف في الماء والتكرار بسبب الشك. إذا اختلفت الأقوال الفقهية فاذكر ذلك واطلب توجيه معلم مؤهل.','Read the wudu verse in Surah Al-Ma''idah and consult a reliable fiqh explanation for the required actions and their order. Learn from a qualified teacher or trusted instructional resource.

When teaching children, explain each step calmly, avoid wasting water, and do not encourage repeated washing caused by doubt. Ask a qualified teacher about differences in legal details.','الوضوء|الطهارة|التعليم','{"review_status":"pending_editorial_review","references":["https://quran.com/5/6"],"content_expansion_version":"2026-10-30"}'::jsonb),
('fiqh','فهم الزكاة قبل استخدام الحاسبة','Understanding Zakat Before Using a Calculator','zakat-before-calculator','ما الذي ينبغي معرفته عن نوع المال والنصاب والحول قبل إدخال الأرقام؟','What to identify about assets, nisab, and timing before entering figures.','يبدأ حساب الزكاة بتحديد نوع المال ووقت وجوب الزكاة والنصاب المعتمد وما يدخل في الوعاء الزكوي. يختلف التفصيل بين النقد والذهب وعروض التجارة والزروع والأسهم والديون. الحاسبة أداة لتنظيم الأرقام وليست جهة إفتاء.

سجل نوع الأصل وقيمته وتاريخ التقييم ومصدر السعر. لا تفترض أن كل دين يخصم بالطريقة نفسها، ولا تجمع المخزون والأدوات الثابتة والأموال الشخصية في خانة واحدة. في الأنشطة المركبة اطلب مراجعة مختص.','Zakat calculations depend on asset type, timing, nisab, and the relevant rules for cash, gold, trade goods, crops, shares, and debts. A calculator organizes figures; it does not issue a ruling.

Record the asset type, valuation date, and price source. Do not assume every debt is deducted in the same way. Seek qualified advice for complex businesses or shared ownership.','الزكاة|النصاب|الحول','{"review_status":"pending_editorial_review","references":["https://quran.com/9/60","https://quran.com/2/267"],"content_expansion_version":"2026-10-30"}'::jsonb),
('tazkiyah','فقه الدعاء وآدابه: المأثور والدعاء العام','Supplication: Sources and Etiquette','dua-types-and-sources','تمييز الدعاء القرآني والنبوي عن الصياغة العامة.','Distinguishing Quranic and Prophetic supplications from general wording.','عند نشر دعاء اسأل: هل هو آية أم حديث أم كلمات عامة؟ إذا كان آية فانقلها من المصحف واذكر السورة والرقم. وإذا كان حديثًا فاذكر الكتاب والرقم واللفظ والدرجة عند الحاجة وافتح المصدر قبل النشر.

الدعاء العام بصياغة شخصية يوسم بوضوح بأنه صياغة تحريرية. لا تنسب عبارة جميلة إلى النبي ﷺ ولا تحدد لها وقتًا أو عددًا أو فضلًا مخصوصًا بغير دليل.','Before publishing a supplication, identify whether it is Quran, hadith, or general wording. Quote Quran from a canonical mushaf and cite the surah and verse. For hadith, include the collection and reference and verify the wording and grading.

Clearly label personal wording as editorial. Do not assign a special time, number, or promised reward without evidence.','الدعاء|الأذكار|المصادر','{"review_status":"pending_editorial_review","references":["https://quran.com/2/186","https://sunnah.com/abudawud:1522"],"content_expansion_version":"2026-10-30"}'::jsonb),
('tazkiyah','بناء ورد يومي من الأذكار دون إرهاق','Building a Sustainable Daily Dhikr Routine','daily-adhkar-plan','خطة مرنة لتوزيع الأذكار ومراجعة ألفاظها ومصادرها.','A flexible routine for remembrance with source and wording checks.','ابدأ بمجموعة صغيرة من الأذكار الثابتة وافهم متى يقال الذكر وما العدد الوارد فيه إن وجد. وزعها على أذكار الصباح والمساء وما بعد الصلاة والنوم والاستيقاظ. لا تنقل ذكرًا من وقت إلى آخر دون دليل.

العداد الإلكتروني وسيلة للتذكير وليس عبادة مستقلة أو مقياسًا للخشوع. لا تقارن عددك بالآخرين ولا تعاقب نفسك على فوات الورد. إذا انقطعت فعد بهدوء، وحافظ على النص كما في المصدر.','Start with a small set of established remembrances and learn their appropriate times and any transmitted counts. Arrange them around morning, evening, prayer, and sleep.

A digital counter is a reminder, not a measure of devotion. Avoid comparison or guilt when a routine is missed. Return calmly and preserve the wording found in the source.','الأذكار|الورد اليومي|الاستمرارية','{"review_status":"pending_editorial_review","references":["https://sunnah.com/bukhari:6306","https://sunnah.com/bukhari:6369"],"content_expansion_version":"2026-10-30"}'::jsonb),
('tazkiyah','التوبة العملية ورد الحقوق','Repentance and Restoring Rights','repentance-and-rights','تحويل معنى التوبة إلى خطوات عملية وإصلاح ما تعلق بحقوق الآخرين.','Turning repentance into practical change and restoring the rights of others.','التوبة رجوع إلى الله يظهر أثره في السلوك؛ من معانيها ترك الذنب والندم والعزم على عدم العودة. وإذا تعلق الأمر بحق إنسان فينبغي معالجة أثر الفعل برد الحق أو طلب المسامحة أو السعي إلى تسوية عادلة بحسب الحال.

ابدأ بخطوة قابلة للتنفيذ وابتعد عن الظروف التي تسهل الرجوع إلى الخطأ. إذا تعلق الأمر بمال أو أمانة أو أذى فاطلب المشورة الشرعية أو القانونية عند التعقيد. لا تنشر تفاصيل خاصة طلبًا للتفاعل.','Repentance should lead to changed conduct: leaving the wrong, regretting it, and resolving not to return. When another person''s rights are involved, seek to restore what was taken or repair the harm fairly.

Choose a practical next step and seek qualified religious or legal advice when money, trust, or harm is involved. Do not expose private details for engagement.','التوبة|الحقوق|الإصلاح','{"review_status":"pending_editorial_review","references":["https://quran.com/66/8","https://quran.com/39/53"],"content_expansion_version":"2026-10-30"}'::jsonb),
('history','كيف تقرأ السيرة النبوية وتزن الروايات؟','How to Read Seerah Sources Carefully','seerah-reading-method','تمييز النص القرآني والحديث عن الرواية التاريخية.','Distinguishing Quran, hadith, and historical reports in Seerah.','تضم السيرة نصوصًا قرآنية وأحاديث متفاوتة الدرجات وأخبارًا تاريخية لها مناهج مختلفة. حدد نوع المصدر قبل نقل الخبر واقرأه في سياقه. ميّز بين ما يذكره المصدر والتقدير الذي يضعه الباحث وما لا يملك له إلا رواية واحدة.

اجمع الآيات ذات الصلة ثم الأحاديث ثم ارجع إلى كتب السيرة والتاريخ. سجل المصدر والموضع ونوع النص ودرجة الحديث عند الحاجة. إذا اختلفت الروايات فاذكر ذلك بوضوح ولا تملأ الفراغات بأرقام غير موثقة.','Seerah combines Quranic passages, hadith reports of varying grades, and historical accounts. Identify the source type and read each report in context. Separate what a source states from later estimates and single-source reports.

Record the reference and report type. Where accounts differ, describe the disagreement rather than inventing dates, numbers, or details to fill gaps.','السيرة|التاريخ|المصادر','{"review_status":"pending_editorial_review","references":["https://quran.com/33","https://sunnah.com/bukhari/64"],"content_expansion_version":"2026-10-30"}'::jsonb),
('history','قراءة الغزوات والسرايا: السياق قبل الأرقام','Reading Expeditions in Their Historical Context','battles-reading-method','منهج لتوثيق أحداث السيرة دون تضخيم الأعداد أو اختلاق التفاصيل.','A source-first approach to recording events without invented figures.','ابدأ بتحديد نوع الحدث: غزوة أو سرية أو تحرك لم تقع فيه مواجهة. سورة الأنفال تتناول بدرًا وآيات من آل عمران تتناول أحدًا، لكن الإحالة القرآنية لا تجعل كل تفصيل تاريخي واردًا في الآيات. افصل بين القرآن والسنة وكتب المغازي.

إذا لم يتوفر مصدر لعدد أو تاريخ فلا تضع رقمًا تقديريًا. لا تحول الحدث إلى إسقاط معاصر. أي خريطة تحتاج إلى مصدر للإحداثيات وبيان مواضع الاختلاف في تحديد المكان.','First identify whether an event was a battle, expedition, or movement without direct fighting. Quranic references provide context but do not independently establish every historical detail.

Do not invent dates, troop counts, or coordinates. Distinguish Quran, hadith, and historical reports, and show disagreements where the sources differ.','الغزوات|السيرة|التوثيق','{"review_status":"pending_editorial_review","references":["https://quran.com/8","https://quran.com/3/121-180"],"content_expansion_version":"2026-10-30"}'::jsonb),
('history','دراسة سير الصحابة: المواقف الموثقة والسياق','Studying the Companions Through Verified Reports','companions-source-method','منهج لحفظ الأمانة في نقل سير الصحابة ومواقفهم.','A careful method for presenting the lives and reports of the Companions.','ابدأ بما ثبت عن الصحابي ومكانته ثم انتقل إلى المواقف التي لها مصدر محدد. إذا كان المصدر حديثًا فاذكر الكتاب والرقم، وإذا كانت المعلومة تاريخية فاذكر كتاب التراجم وموضعها. لا تنسب عبارة تحفيزية لمجرد انتشارها في الصور.

قسّم الصفحة إلى تعريف ومواقف موثقة وأثر علمي ومصادر. الدروس المستفادة لا تتحول إلى أقوال منسوبة للشخصية. وعند تعليم الأطفال قدم المواقف المناسبة للعمر واترك الروايات التي تحتاج إلى تحقيق خارج النسخة المنشورة.','Begin with established biographical information and move to individual reports only when a source can be named. Cite hadith collections and numbers or biographical works and locations.

Separate a lesson drawn by the editor from words attributed to the person. Do not repeat popular quotations without a traceable reference, and adapt material to the audience''s age.','الصحابة|السيرة|الحديث','{"review_status":"pending_editorial_review","references":["https://sunnah.com/bukhari/62","https://sunnah.com/muslim/44"],"content_expansion_version":"2026-10-30"}'::jsonb)
)
INSERT INTO public.articles(category_id,title,slug,content,summary,author,tags,published,metadata,title_ar,title_en,content_ar,content_en,summary_ar,summary_en,featured)
SELECT c.id,i.title_ar,i.slug,i.content_ar,i.summary_ar,'فريق تحرير ذِكر — مسودة مراجعة',string_to_array(i.tags,'|'),false,i.metadata,i.title_ar,i.title_en,i.content_ar,i.content_en,i.summary_ar,i.summary_en,false
FROM incoming i JOIN public.article_categories c ON c.slug=i.category_slug
WHERE NOT EXISTS(SELECT 1 FROM public.articles a WHERE a.slug=i.slug);

WITH incoming(slug,title_ar,title_en,age_group,age_min,age_max,content_ar,content_en,summary_ar,summary_en) AS (VALUES
('story-kind-word','الكلمة الطيبة في ساحة المدرسة','A Kind Word at School','6-8',6,8,'في ساحة المدرسة لاحظت ليلى أن زميلتها تجلس وحدها، فدعتها للمشاركة وشرحت لها قواعد اللعبة بهدوء. بعد قليل شاركت المجموعة كلها وتعلم الأطفال أن الترحيب قد يغير يوم شخص آخر.','Laila noticed a classmate sitting alone and invited her to join the game. She explained the rules patiently, and soon the whole group was playing together.','قصة عن التعاطف والترحيب.','A story about kindness and inclusion.'),
('story-return-book','الكتاب الذي عاد إلى مكتبته','The Book Returned to Its Shelf','3-5',3,5,'انتهى سامي من قراءة كتاب الصور ثم تذكر أن لكل شيء مكانًا. أعاد الكتاب إلى الرف وساعدته أخته في ترتيب الأقلام، ثم اختارا قصة أخرى.','Sami finished his picture book and remembered that everything has a place. He returned it to the shelf, helped tidy the pencils, and chose another story.','قصة عن المحافظة على الأشياء.','A story about caring for shared things.'),
('story-sharing-water','زجاجة الماء المشتركة','Sharing Water Kindly','6-8',6,8,'لاحظت مريم أن صديقتها نسيت زجاجة الماء، فسألت المعلمة عن طريقة مشاركة آمنة. استخدم الأطفال أكوابًا نظيفة وتعلموا أن المساعدة تراعي النظافة والاستئذان.','Maryam noticed that a friend had forgotten her water bottle. She asked the teacher how to help safely, and the children used clean cups and practiced asking permission.','قصة عن المساعدة والنظافة.','A story about helping and hygiene.'),
('story-honest-mistake','الخطأ الذي أصلحته نور','Noor Fixes a Mistake','9-12',9,12,'كتبت نور اسم زميلتها بطريقة خاطئة على لوحة الفصل. اعترفت واعتذرت ثم صححت البطاقة وراجعت الأسماء مع المجموعة. تعلمت أن الاعتذار يصبح أقوى عندما يتبعه إصلاح الخطأ.','Noor misspelled a classmate''s name on the classroom display. She admitted the mistake, apologized, corrected the card, and checked the other names with the group.','قصة عن الاعتذار وإصلاح الخطأ.','A story about apologizing and making things right.'),
('story-neighbor-garden','حديقة الجيران الصغيرة','The Neighbours'' Little Garden','6-8',6,8,'اجتمع أطفال الحي لتنظيف مساحة صغيرة باستخدام أدوات آمنة وبإشراف الكبار. ابتعدوا عن الأسلاك والأدوات الحادة وتعلموا العمل الجماعي واحترام المكان المشترك.','Children gathered to tidy a small shared garden with safe tools and adult supervision. They stayed away from wires and sharp objects and worked as a team.','قصة عن التعاون والسلامة.','A story about teamwork and safety.'),
('story-listening-friend','صديق يحتاج إلى من يسمعه','A Friend Who Needs Listening','9-12',9,12,'عاد عمر صامتًا، فسأله ياسين إن كان يريد الحديث أو يحتاج وقتًا. استمع إليه دون نشر ما سمعه وشجعه على التحدث إلى شخص بالغ يثق به إن استمر الضيق.','Omar came home quiet. Yassin asked whether he wanted to talk or needed time. He listened without sharing private details and encouraged Omar to speak with a trusted adult if the sadness continued.','قصة عن الاستماع والخصوصية.','A story about listening and respecting privacy.')
)
INSERT INTO public.kids_content(title_ar,title_en,slug,type,content_ar,content_en,age_group,summary_ar,summary_en,age_min,age_max,featured,published,is_active,facebook_share_enabled,metadata)
SELECT i.title_ar,i.title_en,i.slug,'story',i.content_ar,i.content_en,i.age_group,i.summary_ar,i.summary_en,i.age_min,i.age_max,false,true,true,false,
jsonb_build_object('content_origin','original_zikr_editorial','parent_review_recommended',true,'age_appropriate',true,'content_expansion_version','2026-10-30')
FROM incoming i
WHERE NOT EXISTS(SELECT 1 FROM public.kids_content k WHERE k.slug=i.slug);

WITH incoming(slug,references_ar) AS (VALUES
('adam','البقرة 30–39؛ الأعراف 11–27؛ طه 115–123'),
('idris','مريم 56–57؛ الأنبياء 85–86'),
('nuh','هود 25–49؛ نوح 1–28؛ الشعراء 105–122'),
('hud','الأعراف 65–72؛ هود 50–60؛ الشعراء 123–140'),
('salih','الأعراف 73–79؛ هود 61–68؛ الشعراء 141–159'),
('ibrahim','البقرة 124–132؛ الأنعام 74–83؛ الأنبياء 51–73؛ الصافات 83–113'),
('lut','الأعراف 80–84؛ هود 77–83؛ الشعراء 160–175'),
('ismail','مريم 54–55؛ الأنبياء 85–86؛ الصافات 100–107'),
('ishaq','هود 71–73؛ الأنبياء 72–73؛ الصافات 112–113'),
('yaqub','البقرة 132–133؛ يوسف 4–101'),
('yusuf','سورة يوسف 4–101'),
('ayyub','الأنبياء 83–84؛ ص 41–44'),
('shuayb','الأعراف 85–93؛ هود 84–95؛ الشعراء 176–191'),
('musa','طه 9–98؛ القصص 3–46؛ الأعراف 103–156'),
('harun','طه 29–36 و90–94؛ الأعراف 142–151'),
('dhulkifl','الأنبياء 85–86؛ ص 48'),
('yunus','يونس 98؛ الأنبياء 87–88؛ الصافات 139–148؛ القلم 48–50'),
('dawud','البقرة 251؛ الأنبياء 78–80؛ سبأ 10–11؛ ص 17–26'),
('sulayman','الأنبياء 78–82؛ النمل 15–44؛ سبأ 12–14؛ ص 30–40'),
('ilyas','الأنعام 85–86؛ الصافات 123–132'),
('alyasa','الأنعام 86؛ ص 48'),
('zakariya','آل عمران 37–41؛ مريم 2–11؛ الأنبياء 89–90'),
('yahya','آل عمران 39؛ مريم 12–15؛ الأنبياء 90'),
('isa','آل عمران 45–59؛ المائدة 110–120؛ مريم 16–36؛ الزخرف 57–65'),
('muhammad','آل عمران 144؛ الأحزاب 21؛ الفتح 29؛ القلم 4؛ الضحى 1–11')
)
INSERT INTO public.prophet_sections(prophet_id,title_ar,title_en,content_ar,content_en,section_type,order_num)
SELECT p.id,'دليل مواضع القراءة في القرآن','Quran Passage Guide',
  'مواضع القراءة: '||i.references_ar||'. اقرأ الآيات كاملة في سياقها، واستعن بتفسير موثوق، وافصل النص القرآني عن التلخيص التحريري. هذا الدليل يحدد مواضع القراءة ولا يضيف تفاصيل تاريخية غير منصوص عليها.',
  'Quran reading references: '||i.references_ar||'. Read the complete passages in context and consult reliable tafsir. This guide identifies reading locations and does not add unsupported historical details.',
  'teachings',
  COALESCE((SELECT max(ps.order_num) FROM public.prophet_sections ps WHERE ps.prophet_id=p.id),0)+1
FROM incoming i JOIN public.prophets p ON p.slug=i.slug
WHERE NOT EXISTS(SELECT 1 FROM public.prophet_sections ps WHERE ps.prophet_id=p.id AND ps.title_ar='دليل مواضع القراءة في القرآن');

COMMIT;