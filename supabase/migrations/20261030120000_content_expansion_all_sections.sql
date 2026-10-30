-- ZIKR all-section content expansion. Safe and idempotent. New editorial material is not auto-published.
BEGIN;
INSERT INTO public.dua_categories(name_ar,name_en,slug,description_ar,description_en,published,is_active,updated_at)
VALUES ('أدعية القرآن','Quranic Duas','quranic-duas','أدعية قرآنية موثقة برقم السورة والآية.','Quranic supplications with references.',true,true,now()),
('أدعية السنة','Prophetic Supplications','sunnah-duas','أدعية من السنة مع روابط مباشرة لمصادر الروايات.','Prophetic supplications with source links.',true,true,now()),
('أذكار الصباح والمساء','Morning & Evening','morning-evening','أذكار يومية مع بيان المصدر والعدد المنقول.','Daily remembrance with sources and counts.',true,true,now()),
('أذكار الصلاة','Prayer Remembrance','prayer-worship','أذكار الصلاة والطهارة والعبادة.','Prayer and worship remembrance.',true,true,now()),
('الأسرة والوالدان','Family & Parents','family-relations','أدعية متعلقة بالوالدين والأسرة والذرية.','Family and parent supplications.',true,true,now()),
('أحوال الحياة','Life Situations','life-situations','أدعية عامة مع فصل المأثور عن الصياغة التحريرية.','Daily supplications, source type distinguished.',true,true,now())
ON CONFLICT(slug) DO UPDATE SET name_ar=excluded.name_ar,name_en=excluded.name_en,description_ar=excluded.description_ar,description_en=excluded.description_en,published=true,is_active=true,updated_at=now();

UPDATE public.duas d SET category_id=CASE
WHEN d.metadata->>'source_type'='quran' THEN (SELECT id FROM public.dua_categories WHERE slug='quranic-duas')
WHEN d.metadata->>'source_type' IN ('hadith','sunnah') THEN (SELECT id FROM public.dua_categories WHERE slug='sunnah-duas')
WHEN d.title_ar ILIKE '%الصباح%' OR d.title_ar ILIKE '%المساء%' OR d.slug ILIKE '%morning%' OR d.slug ILIKE '%evening%' THEN (SELECT id FROM public.dua_categories WHERE slug='morning-evening')
WHEN d.title_ar ILIKE '%الصلاة%' OR d.title_ar ILIKE '%الوضوء%' THEN (SELECT id FROM public.dua_categories WHERE slug='prayer-worship')
WHEN d.title_ar ILIKE '%الوالد%' OR d.title_ar ILIKE '%الأسرة%' OR d.title_ar ILIKE '%الأبناء%' OR d.title_ar ILIKE '%الذرية%' THEN (SELECT id FROM public.dua_categories WHERE slug='family-relations')
ELSE (SELECT id FROM public.dua_categories WHERE slug='life-situations') END,updated_at=now() WHERE d.category_id IS NULL;

WITH requested(surah_order,ayah_number,title_ar,title_en,occasion_ar,benefits_ar,source_name) AS (VALUES (2,250,'دعاء الصبر والثبات','Patience and Steadfastness','عند الشدائد','طلب الصبر والثبات','البقرة 250'),
(3,16,'دعاء المغفرة والوقاية','Seeking Forgiveness','طلب المغفرة وحسن العاقبة','التضرع بالمغفرة','آل عمران 16'),
(3,53,'دعاء الإيمان والاتباع','Faith and Following','طلب الثبات على الإيمان','الدعاء بالاتباع','آل عمران 53'),
(7,47,'دعاء السلامة من الظلم','Protection from Wrongdoing','التضرع إلى الله','طلب النجاة من الظلم','الأعراف 47'),
(14,40,'دعاء إقامة الصلاة','Establishing Prayer','الدعاء للأسرة والذرية','طلب الصلاح وإقامة الصلاة','إبراهيم 40'),
(14,41,'دعاء المغفرة للوالدين','Forgiveness for Parents','الدعاء للوالدين والمؤمنين','طلب المغفرة','إبراهيم 41'),
(18,10,'دعاء الرحمة والرشد','Mercy and Guidance','عند الحيرة وطلب الرشد','طلب الرحمة والتوفيق','الكهف 10'),
(23,109,'دعاء المغفرة والرحمة','Mercy and Forgiveness','طلب الرحمة والمغفرة','التضرع إلى الله','المؤمنون 109'),
(59,10,'دعاء سلامة الصدر','Purity of Heart','الدعاء للمؤمنين','طلب سلامة القلب','الحشر 10'),
(66,8,'دعاء إتمام النور','Perfecting the Light','طلب المغفرة وحسن العاقبة','التضرع بالمغفرة','التحريم 8')),
canonical AS (SELECT r.*,a.text_uthmani,'https://quran.com/'||r.surah_order||'/'||r.ayah_number source_url FROM requested r JOIN public.quran_surahs s ON s."order"=r.surah_order JOIN public.quran_ayahs a ON a.surah_id=s.id AND a.ayah_number=r.ayah_number)
INSERT INTO public.duas(category_id,title_ar,title_en,slug,text_ar,occasion_ar,source_ar,benefits_ar,published,metadata)
SELECT (SELECT id FROM public.dua_categories WHERE slug='quranic-duas'),c.title_ar,c.title_en,'zikr-dua-quran-'||lpad(c.surah_order::text,3,'0')||lpad(c.ayah_number::text,3,'0'),c.text_uthmani,c.occasion_ar,'القرآن الكريم — '||c.source_name,c.benefits_ar,true,jsonb_build_object('source_type','quran','source_url',c.source_url,'reference',c.source_url,'source_locked',true,'content_expansion_version','2026-10-30')
FROM canonical c WHERE NOT EXISTS(SELECT 1 FROM public.duas d WHERE d.metadata->>'source_url'=c.source_url) ON CONFLICT(slug) DO NOTHING;

WITH incoming(slug,title_ar,title_en,text_ar,source_ar,source_url,occasion_ar,benefits_ar) AS (VALUES ('zikr-dua-hadith-bukhari-6306','سيد الاستغفار','Sayyid al-Istighfar','اللَّهُمَّ أَنْتَ رَبِّي، لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتَ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَىَّ وَأَبُوءُ لَكَ بِذَنْبِي، فَاغْفِرْ لِي، فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ','صحيح البخاري 6306','https://sunnah.com/bukhari:6306','الصباح والمساء','مطابقة اللفظ محليًا قبل النشر.'),
('zikr-dua-hadith-bukhari-6369','الاستعاذة من الهم والدين','Seeking Refuge from Worry and Debt','اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ، وَالْعَجْزِ وَالْكَسَلِ، وَالْجُبْنِ وَالْبُخْلِ، وَضَلَعِ الدَّيْنِ، وَغَلَبَةِ الرِّجَالِ','صحيح البخاري 6369','https://sunnah.com/bukhari:6369','عند الهم والحزن والدين','مطابقة اللفظ محليًا قبل النشر.'),
('zikr-dua-hadith-abu-dawud-1522','اللهم أعني على ذكرك وشكرك وحسن عبادتك','O Allah, Help Me Remember You','اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ','سنن أبي داود 1522','https://sunnah.com/abudawud:1522','بعد الصلاة','مراجعة اللفظ والدرجة محليًا قبل النشر.'),
('zikr-dua-hadith-bukhari-6324','باسمك اللهم أموت وأحيا','In Your Name I Die and Live','بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا','صحيح البخاري 6324','https://sunnah.com/bukhari/80/21','عند النوم','مطابقة اللفظ محليًا قبل النشر.'),
('zikr-dua-hadith-bukhari-after-prayer','ذكر ما بعد الصلاة','Remembrance After Prayer','لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ، وَلَهُ الْحَمْدُ، وَهْوَ عَلَى كُلِّ شَىْءٍ قَدِيرٌ، اللَّهُمَّ لاَ مَانِعَ لِمَا أَعْطَيْتَ، وَلاَ مُعْطِيَ لِمَا مَنَعْتَ، وَلاَ يَنْفَعُ ذَا الْجَدِّ مِنْكَ الْجَدُّ','صحيح البخاري — باب الذكر بعد الصلاة','https://sunnah.com/bukhari/10/236','بعد الصلاة','مطابقة اللفظ محليًا قبل النشر.'))
INSERT INTO public.duas(category_id,title_ar,title_en,slug,text_ar,occasion_ar,source_ar,benefits_ar,published,metadata)
SELECT (SELECT id FROM public.dua_categories WHERE slug='sunnah-duas'),i.title_ar,i.title_en,i.slug,i.text_ar,i.occasion_ar,i.source_ar,i.benefits_ar,false,jsonb_build_object('source_type','hadith','source_provider','sunnah.com','source_url',i.source_url,'reference',i.source_url,'review_status','human_review_required','content_expansion_version','2026-10-30')
FROM incoming i WHERE NOT EXISTS(SELECT 1 FROM public.duas d WHERE d.slug=i.slug) ON CONFLICT(slug) DO NOTHING;

WITH incoming(category_slug,title,slug,summary,tags,metadata,content) AS (VALUES ('quran','من الآية إلى السياق: منهج عملي لقراءة القرآن','quran-reading-context','خطوات لفهم الآيات في سياقها والرجوع إلى التفسير.','القرآن|التدبر|التفسير','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/1","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://quran.com/2","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'القراءة الواعية تبدأ من موضع الآية داخل السورة، لا من اقتطاع جملة قصيرة ثم تحميلها معنى منفصلًا. اقرأ الآية مع ما قبلها وما بعدها، وانتبه إلى موضوع المقطع قبل تدوين أي فائدة. ارجع إلى تفسير موثوق يشرح المفردات وصلات الآيات وأسباب النزول عند ثبوتها، ولا تجعل مقطعًا متداولًا بديلًا عن التفسير.

قسّم ملاحظاتك إلى النص القرآني كما في المصحف، وشرح المفسر، والفائدة الشخصية. إذا شاركت فائدة فاذكر السورة ورقم الآية ورابط المصحف واسم التفسير والموضع. لا تعدل رسم الآية ولا تضف كلمات توضيحية داخل الاقتباس. اختر موضوعًا أسبوعيًا مثل الصبر أو الشكر واجمع مواضعه واقرأ كل موضع في سياقه. إذا تعلق السؤال بحكم شرعي فارجع إلى عالم مؤهل.'),
('aqeedah','تعلم أصول الإيمان والتحقق من الدليل','faith-and-evidence','مدخل يميز بين النص الشرعي وشرحه والتلخيص الشخصي.','العقيدة|الإيمان|المصادر','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/112","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://quran.com/2/285","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'التعلم في مسائل الإيمان يحتاج إلى ترتيب. ابدأ بالمحكم الواضح من القرآن والسنة الصحيحة ثم اقرأ شرحًا لعالم موثوق. فرّق بين نص الدليل وشرح العالم وصياغتك أنت؛ النص ينقل كما ورد، والشرح ينسب إلى صاحبه، والتلخيص يوسم بأنه عمل تحريري.

عند دراسة موضوع مثل التوحيد أو الإيمان باليوم الآخر اجمع الآيات ذات الصلة واقرأها في سياقاتها. تحقق من مصدر الحديث ودرجته قبل الاستشهاد به. لا تجعل الخلاف العلمي سببًا للتعصب ولا تنقل حكمًا على شخص من مقطع مجتزأ. ضع خطة قراءة أسبوعية وتدوين للأسئلة ثم اعرض ما أشكل عليك على معلم مؤهل. لا تفت فيما لا تعلم ولا تجعل التطبيق بديلًا عن أهل العلم.'),
('fiqh','تنظيم اليوم حول الصلوات الخمس','planning-around-prayer','تنظيم العمل والدراسة والراحة حول مواقيت الصلاة.','الصلاة|الوقت|المواقيت','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/4/103","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://quran.com/17/78","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'ابدأ بمعرفة مواقيت مدينتك من مصدر موثوق وتأكد من المنطقة الزمنية وطريقة الحساب. خصص وقتًا للاستعداد والوضوء والانتقال. ضع المهام الكبيرة بين الصلوات وعدّل الجدول بحسب العمل والصحة ومسؤوليات الأسرة؛ لا يوجد جدول واحد يناسب الجميع.

اختبر التنبيهات ولا تعتمد على توقيت قديم أو إعداد جغرافي خاطئ. قد تختلف دقائق المواقيت بين الجهات، لذا ارجع إلى الجهة المحلية عند وجود اختلاف. لا تجعل الهاتف سببًا في التأخير. مسائل السفر والمرض والجمع والقصر لها شروط وتفاصيل؛ لا يستخرج حكمها من التطبيق بل يسأل فيها أهل العلم.'),
('fiqh','تعلم الوضوء خطوة خطوة','wudu-learning-guide','تعليم الوضوء من مصدر موثوق دون إسراف أو وسوسة.','الوضوء|الطهارة|التعليم','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/5/6","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://sunnah.com/bukhari:159","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'الوضوء عبادة تعلم من القرآن والسنة وشروح الفقهاء. اقرأ آية الوضوء في سورة المائدة، ثم راجع شرحًا موثوقًا يبين الأعضاء والترتيب وما يتعلق بالنية والماء والغسل والمسح. تعلم الصفة من معلم أو مادة موثقة ثم طبقها بهدوء. لا تكرر غسل العضو بسبب الشك ولا تجعل كل إحساس دليلًا على بطلان الوضوء.

عند تعليم طفل اشرح له اسم العضو ودعه يطبق بنفسه ثم صحح الخطأ بلطف. لا تستخدم التخويف أو السخرية ولا تجعل الماء لعبة تهدر. إذا اختلفت الأقوال الفقهية فاذكر ذلك واطلب توجيه معلم مؤهل. اللعبة والفيديو وسيلتان مساعدتان وليسا مصدر فتوى أو بديلًا عن التعليم المباشر.'),
('fiqh','فهم الزكاة قبل استخدام الحاسبة','zakat-before-calculator','فهم نوع المال والنصاب والحول وحدود الأدوات الرقمية.','الزكاة|النصاب|الحول','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/9/60","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://quran.com/2/267","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'حساب الزكاة يبدأ بتحديد نوع المال ووقت وجوب الزكاة والنصاب المعتمد وما يدخل في الوعاء الزكوي. يختلف التفصيل بين النقد والذهب وعروض التجارة والزروع والأسهم والديون. الحاسبة أداة لتنظيم الأرقام وليست جهة إفتاء.

اعرض نوع الأصل وقيمته وتاريخ تملكه ومصدر سعر التقييم، وبيّن قيمة النصاب وتاريخه وطريقة الحساب. لا تفترض أن كل دين يخصم بالطريقة نفسها، ولا تجمع المخزون والأدوات الثابتة والمبالغ الشخصية في خانة واحدة. في الأنشطة المركبة اطلب مراجعة مختص، ولا تجعل التطبيق يقرر أهلية مستحق بعينه.'),
('tazkiyah','فقه الدعاء وآدابه: المأثور والدعاء العام','dua-types-and-sources','تمييز الدعاء القرآني والنبوي عن الصياغة التحريرية.','الدعاء|الأذكار|المصادر','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/2/186","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://sunnah.com/abudawud:1522","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'عند نشر دعاء اسأل: هل هو آية أم حديث أم كلمات عامة؟ إذا كان آية فانقله من المصحف واذكر السورة والرقم. وإذا كان حديثًا فاذكر الكتاب والرقم واللفظ والدرجة عند الحاجة وافتح المصدر قبل النشر. لا تجعل العبارة الجميلة حديثًا ولا تنسب لها وقتًا أو عددًا أو فضلًا مخصوصًا بغير دليل.

الدعاء العام بصياغة شخصية يوسم بوضوح بأنه صياغة تحريرية. العداد لا ينشئ سنة بعدد من عنده. بطاقة الدعاء الجيدة تعرض نوع النص ومصدره ورابطه، وتترك المادة غير الموثقة مسودة للمراجعة بدل نسبتها إلى النبي ﷺ.'),
('tazkiyah','بناء ورد يومي من الأذكار دون إرهاق','daily-adhkar-plan','خطة مرنة لتوزيع الأذكار ومراجعة الألفاظ والأعداد.','الأذكار|الورد اليومي|الاستمرارية','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://sunnah.com/bukhari:6306","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://sunnah.com/bukhari:6369","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'ابدأ بمجموعة صغيرة من الأذكار الثابتة وافهم متى يقال الذكر وما العدد الوارد فيه إن وجد. وزعها على أذكار الصباح والمساء وما بعد الصلاة والنوم والاستيقاظ. لا تنقل ذكرًا من وقت إلى آخر دون دليل، وراجع المصدر عند اختلاف الألفاظ.

العداد الإلكتروني يساعد على تذكر العدد لكنه ليس عبادة مستقلة ولا مقياسًا للخشوع. لا تقارن عددك بالآخرين ولا تعاقب نفسك على فوات الورد. إذا انقطعت فعد بهدوء. عند تعليم الأطفال اشرح معنى الذكر ولا تجعل المكافأة مرتبطة بعدد التكرار. حافظ على النص كما في المصدر ولا تعرض مادة غير محققة على أنها حديث صحيح.'),
('tazkiyah','التوبة العملية ورد الحقوق','repentance-and-rights','تطبيق معاني التوبة في السلوك وإصلاح الحقوق.','التوبة|الحقوق|الإصلاح','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/66/8","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://quran.com/39/53","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'التوبة رجوع إلى الله يظهر أثره في السلوك؛ من معانيها ترك الذنب والندم والعزم على عدم العودة. وإذا تعلق الأمر بحق إنسان فينبغي معالجة أثر الفعل برد الحق أو طلب المسامحة أو السعي إلى تسوية عادلة بحسب الحال.

ابدأ بخطوة قابلة للتنفيذ وابتعد عن الظروف التي تسهل الرجوع إلى الخطأ. إذا كان الأمر متعلقًا بمال أو أمانة أو أذى فاطلب المشورة الشرعية أو القانونية عند التعقيد. لا تنشر تفاصيل خاصة طلبًا للتفاعل. إذا صاحبت المشكلة حالة صحية أو سلوكية معقدة فاطلب مساعدة مهنية؛ التوبة لا تعني رفض العلاج.'),
('history','كيف تقرأ السيرة النبوية وتزن الروايات؟','seerah-reading-method','تمييز النص القرآني والحديث عن الرواية التاريخية.','السيرة|التاريخ|المصادر','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/33","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://sunnah.com/bukhari/64","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'السيرة فيها نص قرآني وأحاديث متفاوتة الدرجات وأخبار تاريخية لها مناهج مختلفة. حدد نوع المصدر قبل نقل الخبر واقرأه في سياقه. ميّز بين التاريخ الذي يذكره المصدر والتقدير الذي يضعه الباحث والحدث الذي لا يملك له إلا رواية واحدة.

اجمع الآيات ذات الصلة ثم الأحاديث ثم ارجع إلى كتب السيرة والتاريخ. سجل المصدر والموضع ونوع النص ودرجة الحديث عند الحاجة. لا تملأ الفراغات بأرقام شائعة ولا تختزل الأحداث في لغة تحريضية أو أحكام معاصرة. إذا اختلفت الروايات فاذكر ذلك بوضوح واجعل ما يحتاج إلى تحقيق خارج النسخة المنشورة.'),
('history','قراءة الغزوات والسرايا: السياق قبل الأرقام','battles-reading-method','إطار لتوثيق الأحداث العسكرية في السيرة دون تضخيم الأرقام.','الغزوات|السيرة|التوثيق','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://quran.com/8","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://quran.com/3/121-180","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://sunnah.com/bukhari/64","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'ابدأ بتحديد نوع الحدث: غزوة أو سرية أو تحرك لم تقع فيه مواجهة. سورة الأنفال تتناول بدرًا وآيات من آل عمران تتناول أحدًا، لكن الإحالة القرآنية لا تجعل كل تفصيل تاريخي واردًا في الآيات. افصل بين القرآن والسنة وكتب المغازي.

راجع سبب الخروج والأطراف والنتيجة والأثر التاريخي. إذا لم يتوفر مصدر لعدد أو تاريخ فلا تضع رقمًا تقديريًا. لا تستخدم وصف النصر والهزيمة بطريقة تلغي التعقيد التاريخي ولا تحول الحدث إلى إسقاط معاصر. أي خريطة تحتاج إلى مصدر للإحداثيات وبيان مواضع الاختلاف في تحديد المكان.'),
('history','دراسة سير الصحابة: المواقف الموثقة والسياق','companions-source-method','منهج لحفظ الأمانة في نقل سير الصحابة ومواقفهم.','الصحابة|السيرة|الحديث','{"editorial":true,"review_status":"human_review_required","references":[{"url":"https://sunnah.com/bukhari/62","title_ar":"مرجع مرتبط بالمقال"},{"url":"https://sunnah.com/muslim/44","title_ar":"مرجع مرتبط بالمقال"}],"content_expansion_version":"2026-10-30"}'::jsonb,'ابدأ بما ثبت عن الصحابي ومكانته ثم انتقل إلى المواقف التي لها مصدر محدد. إذا كان المصدر حديثًا فاذكر الكتاب والرقم، وإذا كانت المعلومة تاريخية فاذكر كتاب التراجم وموضعها. لا تنسب عبارة تحفيزية لمجرد انتشارها في الصور.

احترم مقام الصحابة وابتعد عن المقارنات التي تثير التعصب أو الانتقاص. قسّم الصفحة إلى تعريف ومواقف موثقة وأثر علمي ومصادر. الدروس المستفادة لا تتحول إلى أقوال منسوبة للشخصية. وعند تعليم الأطفال قدم المواقف المناسبة للعمر واترك الروايات التي تحتاج إلى تحقيق خارج النسخة المنشورة.'))
INSERT INTO public.articles(category_id,title,title_ar,slug,summary,summary_ar,content,content_ar,author,tags,published,featured,metadata)
SELECT c.id,i.title,i.title,i.slug,i.summary,i.summary,i.content,i.content,'فريق تحرير ذِكر — مسودة للمراجعة',string_to_array(i.tags,'|'),false,false,i.metadata
FROM incoming i JOIN public.article_categories c ON c.slug=i.category_slug
WHERE NOT EXISTS(SELECT 1 FROM public.articles a WHERE a.slug=i.slug) ON CONFLICT(slug) DO NOTHING;

WITH incoming(slug,title,summary,content,category,reference_ar) AS (VALUES ('quran-story-people-cave-study','أصحاب الكهف: الثبات وطلب الرحمة','تأمل قرآني في خبر الفتية ودعائهم بالرحمة والرشد.','يذكر القرآن خبر الفتية الذين آووا إلى الكهف ودعوا ربهم أن يؤتيهم من لدنه رحمة ويهيئ لهم من أمرهم رشدًا. اقرأ الآيات 9–26 من سورة الكهف كاملة مع تفسير موثوق، ولا تضف أسماء الفتية أو تفاصيل زمنية وجغرافية غير منصوص عليها. هذا تلخيص تعليمي لا يغني عن قراءة النص وتفسيره.','prophets','الكهف 9–26'),
('quran-story-garden-owners','أصحاب الجنة: النعمة والمسؤولية','قراءة في مقطع أصحاب الجنة وما يعرضه من الشكر والمسؤولية.','يعرض مقطع أصحاب الجنة في سورة القلم قصة أصحاب بستان عزموا على جني ثمره دون مراعاة حق المحتاجين. اقرأ الآيات 17–33 في سياقها، ولا تضف أسماء أو مكانًا أو زمنًا لم يذكره النص. تفرق المادة بين النص القرآني والفوائد التي يستنبطها القارئ.','history','القلم 17–33'),
('quran-story-saba','قوم سبأ: الشكر وتغير الأحوال','قراءة قرآنية في آيات سبأ مع تجنب التفاصيل الجغرافية غير المحققة.','تذكر سورة سبأ خبر الجنتين وما ارتبط به من النعمة ثم الإعراض. اقرأ الآيات 15–19 كاملة ولا تربط القصة بأطلال أو مواقع أثرية بعينها دون دليل مستقل. يركز الملخص على العلاقة بين النعمة والمسؤولية.','history','سبأ 15–19'),
('quran-story-maryam','مريم عليها السلام: العبادة والاصطفاء','قراءة في الآيات التي تعرض قصة مريم عليها السلام ضمن سورة مريم.','تقدم سورة مريم مقطعًا متتابعًا عن مريم عليها السلام من اعتزالها إلى البشارة ثم الولادة ومواجهة قومها وكلام عيسى في المهد كما ورد في الآيات. اقرأ الآيات 16–36 كاملة مع تفسير موثوق، ولا تضف حوارات أو وصفًا لم يذكره الوحي أو مصدر محقق.','prophets','مريم 16–36'))
INSERT INTO public.stories(slug,title,content,category,published,is_approved,summary,metadata)
SELECT i.slug,i.title,i.content,i.category,false,false,i.summary,jsonb_build_object('content_origin','quranic_reading_guide','review_status','human_review_required','reference_ar',i.reference_ar,'source_url','https://quran.com','publish_blocked_until_review',true,'content_expansion_version','2026-10-30')
FROM incoming i WHERE NOT EXISTS(SELECT 1 FROM public.stories s WHERE s.slug=i.slug) ON CONFLICT(slug) DO NOTHING;

INSERT INTO public.memorization_plans(title,cadence,target_ref,prompt,tajweed_focus,published)
SELECT v.title,v.cadence,v.target_ref,v.prompt,v.tajweed_focus,true FROM (VALUES ('البداية الهادئة: 5 آيات يوميًا','يومي','سورة قصيرة أو 5 آيات','استمع واقرأ ثم سمّع دون نظر وسجل الأخطاء.','مخارج الحروف والمدود.'),
('نصف صفحة مع مراجعة يومية','6 أيام أسبوعيًا','نصف صفحة جديدة وسابقة','قسّم المقطع لوحدات واربط نهاية كل وحدة ببداية التالية.','الغنة والقلقلة.'),
('صفحة في الأسبوع مع تثبيت','5 أيام حفظ + يومان مراجعة','5 صفحات أسبوعيًا','ابدأ كل جلسة بالمراجعة قبل الجديد.','التفخيم والترقيق.'),
('خطة سور قصار للناشئين','4 أيام أسبوعيًا','سورة قصيرة في كل مرحلة','قراءة جماعية وشرح كلمات وتسميع مشجع.','وضوح الحروف.'),
('تثبيت المحفوظ القديم','3 مرات أسبوعيًا','جزء محفوظ','سمّع من الذاكرة ثم راجع المصحف عند الشك.','الوقف والابتداء.'),
('مراجعة مكثفة قبل الاختبار','أسبوعان','10–20 صفحة بحسب القدرة','قسّم المقرر إلى جلسات واختبر مواضع متنوعة.','سلامة الترتيل.'),
('حفظ مع فهم المعنى','يومي','آيات قليلة ومعنى إجمالي','اقرأ تفسيرًا مختصرًا واربط الآيات بموضوع السورة.','أحكام التلاوة.'),
('خطة نهاية الأسبوع','الجمعة والسبت','مراجعة محفوظ الأسبوع','سمّع المقطع كاملًا ثم أعد مواضع الخطأ.','تصحيح الأخطاء.')) v(title,cadence,target_ref,prompt,tajweed_focus)
WHERE NOT EXISTS(SELECT 1 FROM public.memorization_plans p WHERE p.title=v.title);

WITH incoming(slug,references_ar) AS (VALUES ('adam','البقرة 30–39؛ الأعراف 11–27؛ طه 115–123'),
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
('muhammad','آل عمران 144؛ الأحزاب 21؛ الفتح 29؛ القلم 4؛ الضحى 1–11'))
INSERT INTO public.prophet_sections(prophet_id,title_ar,title_en,content_ar,section_type,order_num)
SELECT p.id,'مواطن القراءة القرآنية','Quran Reading Guide','مواضع القراءة: '||i.references_ar||'. اقرأ الآيات كاملة في سياقها، واستعن بتفسير موثوق، وافصل النص عن التلخيص التحريري، ولا تكمل التفاصيل من القصص غير المسندة. ملخص الصفحة الحالي: '||COALESCE(p.bio_ar,''),'teachings',COALESCE((SELECT max(ps.order_num) FROM public.prophet_sections ps WHERE ps.prophet_id=p.id),0)+1
FROM incoming i JOIN public.prophets p ON p.slug=i.slug WHERE NOT EXISTS(SELECT 1 FROM public.prophet_sections ps WHERE ps.prophet_id=p.id AND ps.title_ar='مواطن القراءة القرآنية');

WITH incoming(slug,bio_ar) AS (VALUES ('abu-hanifa','أبو حنيفة النعمان بن ثابت فقيه من أهل الكوفة، ارتبط اسمه بتاريخ المدرسة الحنفية ومنهج النظر الفقهي. تُقرأ ترجمته مع التمييز بين المصادر التاريخية وكتب المناقب، ولا تنسب إليه فتوى أو عبارة دون مرجع.'),
('ahmad-ibn-hanbal','أحمد بن حنبل إمام في الحديث والفقه وصاحب المسند، وارتبط اسمه بالمدرسة الحنبلية. تعرض سيرته عنايته بالرواية ومكانته العلمية، ويجب إسناد المواقف إلى مصادرها.'),
('malik-ibn-anas','مالك بن أنس من علماء المدينة ومحدثيها وصاحب الموطأ. يمكن دراسة أثر البيئة العلمية في تكوين منهجه، مع التفريق بين نص الموطأ والشروح اللاحقة.'),
('shafii','محمد بن إدريس الشافعي فقيه ومحدث ارتبط اسمه بالمدرسة الشافعية وكتاب الرسالة. تدرس أعماله من خلال بناء الاستدلال وموقع السنة، ولا تنسب إليه الأقوال دون مصدر.'),
('bukhari','محمد بن إسماعيل البخاري محدث اشتهر بالجامع الصحيح وترتيب الأحاديث على أبواب. دراسة منهجه تحتاج النظر في التراجم والأسانيد والتحقق من نص كل حديث عند الاستشهاد.'),
('al-nawawi','يحيى بن شرف النووي فقيه ومحدث شافعي، ومن كتبه رياض الصالحين وشرح صحيح مسلم والأذكار. نسبة أي عبارة إليه تحتاج مراجعة النص الأصلي وموضعه.'),
('ibn-kathir','إسماعيل بن عمر ابن كثير مفسر ومحدث ومؤرخ، ومن أعماله تفسير القرآن العظيم والبداية والنهاية. عند الاستفادة منه راجع الآية وسياق الروايات.'),
('ibn-taymiyya','أحمد بن عبد الحليم ابن تيمية عالم حنبلي من دمشق في العصر المملوكي. اعرض آراءه بأمانة وفي سياقها ولا تقتطع عبارة.'))
UPDATE public.scholars s SET metadata=COALESCE(s.metadata,'{}'::jsonb)||jsonb_build_object('editorial_draft_bio_ar',i.bio_ar,'draft_review_status','human_review_required','content_expansion_version','2026-10-30'),updated_at=now()
FROM incoming i WHERE s.slug=i.slug AND COALESCE(s.metadata->>'content_expansion_version','')<>'2026-10-30';
WITH incoming(slug,bio_ar) AS (VALUES ('abu-huraira','أبو هريرة رضي الله عنه صحابي من دوس اشتهر برواية الحديث. دراسة سيرته تفتح بابًا لفهم حفظ السنة والتعليم، وتحتاج إلى الرجوع إلى الأحاديث المحددة بدل القصص بلا مصدر.'),
('asma-bint-abi-bakr','أسماء بنت أبي بكر رضي الله عنها صحابية تذكرها مصادر السيرة والحديث في سياق أسرتها ومساندتها للدعوة. تميّز روايات حياتها الثابتة من الأخبار التي تحتاج تحقيقًا.'),
('salman-al-farisi','سلمان الفارسي رضي الله عنه صحابي من بلاد فارس، وتذكر المصادر بحثه عن الحق حتى لقي النبي ﷺ. بعض تفاصيل رحلته تحتاج مراجعة الأسانيد قبل السرد الجازم.'),
('muadh-ibn-jabal','معاذ بن جبل رضي الله عنه من الأنصار وأهل العلم، وتذكر المصادر بعثه للتعليم والقضاء. راجع لفظ الرواية ودرجتها ولا تحول التلخيص إلى نص حديثي.'))
UPDATE public.companions c SET metadata=COALESCE(c.metadata,'{}'::jsonb)||jsonb_build_object('editorial_draft_bio_ar',i.bio_ar,'draft_review_status','human_review_required','content_expansion_version','2026-10-30'),updated_at=now()
FROM incoming i WHERE c.slug=i.slug AND COALESCE(c.metadata->>'content_expansion_version','')<>'2026-10-30';

UPDATE public.battles b SET metadata=COALESCE(b.metadata,'{}'::jsonb)||jsonb_build_object('editorial_draft_description_ar','توسعة تحريرية مقترحة: اشرح خلفية الحدث وسياقه، وحدد نوع الرواية ومصدرها، وافصل الخبر القرآني أو الحديثي عن السرد التاريخي. لا تضف تاريخًا أو عددًا أو موقعًا دون إحالة دقيقة. احفظ الروايات المختلف فيها كاختلافات ولا تحولها إلى حقيقة واحدة.','draft_review_status','historical_source_review_required','content_expansion_version','2026-10-30'),updated_at=now()
WHERE b.slug IN ('badr','uhud','khandaq','khaybar','hunayn','tabuk','taif','banu-qurayza','banu-nadir','banu-qaynuqa','muraysi','dhat-riqa','mu-tah','safwan','sawiq','ushayra','buwat','waddan','qarqarat-kudr','dumat-al-jandal','dhat-salasil') AND COALESCE(b.metadata->>'content_expansion_version','')<>'2026-10-30';
UPDATE public.conquests c SET metadata=COALESCE(c.metadata,'{}'::jsonb)||jsonb_build_object('editorial_draft_description_ar','توسعة تحريرية مقترحة: قسم الحدث إلى مراحل جغرافية وزمنية، وحدد مصادر كل محطة، وافصل بين التحرك العسكري والصلح وتسلم المدن والتنظيم الإداري. لا تسقط الحدود الحديثة على الجغرافيا القديمة ولا تقدم اختلاف الروايات كحقيقة محسومة.','draft_review_status','historical_source_review_required','content_expansion_version','2026-10-30'),updated_at=now()
WHERE c.slug IN ('mecca','jerusalem-early','sham','iraq','persia','north-africa','cyprus','armenia','khurasan','sindh','andalus','constantinople-umayyad','egypt-expansion','maghreb','transoxiana') AND COALESCE(c.metadata->>'content_expansion_version','')<>'2026-10-30';

WITH incoming(slug,title_ar,title_en,age_group,content_ar,content_en,summary_ar,summary_en,age_min,age_max,moral_ar) AS (VALUES ('story-kind-word','الكلمة الطيبة في ساحة المدرسة','A Kind Word at School','6-8','في ساحة المدرسة لاحظت ليلى أن زميلتها تجلس وحدها، فدعتها للمشاركة وشرحت لها قواعد اللعبة بهدوء. بعد قليل شاركت المجموعة كلها.','Laila invited a classmate who was sitting alone to join the game and patiently explained the rules.','قصة أصلية تعليمية: قصة عن التعاطف والترحيب.','Original child-safe story.',6,8,'قصة عن التعاطف والترحيب.'),
('story-return-book','الكتاب الذي عاد إلى مكتبته','The Book Returned to Its Shelf','3-5','انتهى سامي من قراءة كتاب الصور ثم تذكر أن لكل شيء مكانًا. أعاد الكتاب إلى الرف وساعدته أخته في ترتيب الأقلام.','Sami returned his picture book to the shelf and helped tidy the pencils.','قصة أصلية تعليمية: قصة عن المحافظة على الأشياء.','Original child-safe story.',3,5,'قصة عن المحافظة على الأشياء.'),
('story-sharing-water','زجاجة الماء المشتركة','Sharing Water Kindly','6-8','لاحظت مريم أن صديقتها نسيت زجاجة الماء، فسألت المعلمة عن طريقة مشاركة آمنة. استخدم الأطفال أكوابًا نظيفة وتعلموا أن المساعدة تراعي النظافة والاستئذان.','Maryam asked the teacher how to help a friend who forgot her water bottle. They used clean cups.','قصة أصلية تعليمية: قصة عن المساعدة والنظافة.','Original child-safe story.',6,8,'قصة عن المساعدة والنظافة.'),
('story-honest-mistake','الخطأ الذي أصلحته نور','Noor Fixes a Mistake','9-12','كتبت نور اسم زميلتها بطريقة خاطئة على لوحة الفصل. اعترفت واعتذرت ثم صححت البطاقة وراجعت الأسماء مع المجموعة.','Noor admitted that she had misspelled a classmate’s name, apologized and corrected the display.','قصة أصلية تعليمية: قصة عن الاعتذار وإصلاح الخطأ.','Original child-safe story.',9,12,'قصة عن الاعتذار وإصلاح الخطأ.'),
('story-neighbor-garden','حديقة الجيران الصغيرة','The Neighbours’ Little Garden','6-8','اجتمع أطفال الحي لتنظيف مساحة صغيرة باستخدام أدوات آمنة وبإشراف الكبار. ابتعدوا عن الأسلاك والأدوات الحادة وتعلموا العمل الجماعي.','Children tidied a shared garden with adult supervision and avoided unsafe tools and hazards.','قصة أصلية تعليمية: قصة عن التعاون والسلامة.','Original child-safe story.',6,8,'قصة عن التعاون والسلامة.'),
('story-listening-friend','صديق يحتاج إلى من يسمعه','A Friend Who Needs Listening','9-12','عاد عمر صامتًا، فسأله ياسين إن كان يريد الحديث أو يحتاج وقتًا. استمع إليه دون نشر ما سمعه وشجعه على التحدث إلى شخص بالغ يثق به عند الحاجة.','Yassin listened to Omar without sharing private details and encouraged him to speak with a trusted adult.','قصة أصلية تعليمية: قصة عن الاستماع والخصوصية.','Original child-safe story.',9,12,'قصة عن الاستماع والخصوصية.'))
INSERT INTO public.kids_content(title_ar,title_en,slug,type,content_ar,content_en,age_group,summary_ar,summary_en,age_min,age_max,featured,published,is_active,metadata)
SELECT i.title_ar,i.title_en,i.slug,'story',i.content_ar,i.content_en,i.age_group,i.summary_ar,i.summary_en,i.age_min,i.age_max,false,false,false,jsonb_build_object('content_origin','original_zikr_editorial','review_status','parent_and_educator_review_required','publish_blocked_until_review',true,'moral_ar',i.moral_ar,'content_expansion_version','2026-10-30')
FROM incoming i WHERE NOT EXISTS(SELECT 1 FROM public.kids_content k WHERE k.slug=i.slug) ON CONFLICT(slug) DO NOTHING;

WITH incoming(slug,description_ar,objectives) AS (VALUES ('zikr-runner','رحلة منصات لتدريب الانتباه والتوقيت واتخاذ القرار.','الانتباه|تقدير المسافة|التعلم من المحاولة'),
('zikr-memory','مطابقة بطاقات تربط المواقف اليومية بالسلوكيات الطيبة.','الذاكرة البصرية|ربط الموقف بالسلوك|احترام الدور'),
('wudu-challenge','نشاط ترتيب خطوات الوضوء من مادة تعتمد مراجعة ولي الأمر أو المعلم.','ترتيب الخطوات|التطبيق الهادئ|ترشيد الماء'),
('verse-puzzle','ترتيب كلمات آية من مصدر قرآني موثق مع التحقق الحرفي من النص.','مطابقة النص القرآني|ترتيب الكلمات|الرجوع للمصدر'),
('zikr-quiz','اختبارات قصيرة مع تفسير الإجابة ومصدرها في الأسئلة الدينية.','استرجاع المعرفة|فهم الإجابة|التحقق من المصدر'),
('mosque-adventure','مغامرة استكشاف آمنة عن التعاون وآداب المكان.','الاستكشاف|التعاون|احترام المكان'),
('zikr-road','مسار حركة يعتمد الانتباه واختيار المسار وإدارة السرعة.','التركيز|اتخاذ القرار|إدارة السرعة'),
('zikr-jump','تحديات قفز متدرجة للتوقيت والتركيز والتعلم من المحاولة.','التوقيت|التوازن البصري|المثابرة'),
('good-deeds','مهمات تربوية اختيارية للمساعدة والرفق بإشراف الأسرة ودون بيانات شخصية.','التعاطف|المساعدة بإشراف|الخصوصية'),
('hilal-fly','تحكم تدريجي لتقدير المسافة والتوقيت وتجنب العوائق.','التوافق البصري الحركي|توقع العوائق|التدرج'),
('mosque-cleanup','فرز وترتيب افتراضي يعلم التصنيف والنظافة مع إشراف بالغ.','التصنيف|النظافة|السلامة'),
('letter-lab','تعرف تفاعلي إلى شكل الحرف العربي وصوته وموقعه في الكلمة.','شكل الحرف|الصوت|التمييز'),
('zikr-coloring','مجموعة تلوين أصلية دون صور مجهولة الحقوق أو بيانات شخصية.','الإبداع|تمييز الألوان|المهارات الدقيقة'))
UPDATE public.kids_games g SET metadata=COALESCE(g.metadata,'{}'::jsonb)||jsonb_build_object('editorial_draft_description_ar',i.description_ar,'editorial_draft_learning_objectives_ar',string_to_array(i.objectives,'|'),'draft_review_status','parent_and_educator_review_required','content_expansion_version','2026-10-30'),updated_at=now()
FROM incoming i WHERE g.slug=i.slug AND COALESCE(g.metadata->>'content_expansion_version','')<>'2026-10-30';

UPDATE public.tawasheeh t SET metadata=COALESCE(t.metadata,'{}'::jsonb)||jsonb_build_object('editorial_draft_description_ar','مادة صوتية بعنوان «'||t.title_ar||'» ضمن مكتبة ذِكر. بيانات المؤدي الحالية: '||COALESCE(NULLIF(t.artist_ar,''),'غير محدد في السجل')||'. يجب مراجعة المصدر والحقوق قبل اعتماد الوصف.','draft_review_status','media_rights_and_editorial_review_required','content_expansion_version','2026-10-30'),updated_at=now()
WHERE t.published=true AND t.audio_url IS NOT NULL AND COALESCE(t.metadata->>'content_expansion_version','')<>'2026-10-30';

UPDATE public.article_categories SET description_ar=CASE slug WHEN 'aqeedah' THEN COALESCE(NULLIF(description_ar,''),'مواد تعليمية في أصول الإيمان ومناهج فهم الدليل.') WHEN 'quran' THEN COALESCE(NULLIF(description_ar,''),'مواد في سياق الآيات والتفسير والحفظ مع الإحالة إلى المصادر.') ELSE description_ar END,updated_at=now() WHERE slug IN ('aqeedah','quran');
COMMIT;