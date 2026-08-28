-- Verified content pack for companions and scholars.
-- Content is inserted as unpublished until a human editor reviews every source locator.

insert into public.companions (
  name_ar, name_en, slug, bio_ar, bio_en, category, order_num, published, metadata
) values
(
  'أبو هريرة رضي الله عنه',
  'Abu Hurairah',
  'abu-huraira',
  'صحابي جليل من قبيلة دوس، عُرف بكثرة ملازمته للنبي ﷺ وروايته للحديث. تُعرض سيرته هنا بوصفها مدخلًا إلى دراسة حفظ السنة والرواية، مع إحالة كل معلومة إلى مصادرها وعدم اعتماد الروايات غير المحددة.',
  'A companion from the Daws tribe, known for his close companionship with the Prophet ﷺ and extensive transmission of hadith. This entry introduces the study of hadith preservation while requiring source-level verification for every claim.',
  'sahaba',
  120, false,
  jsonb_build_object(
    'source_verified', false,
    'review_status', 'human_review_required',
    'references', jsonb_build_array(
      jsonb_build_object('title_ar','صحيح البخاري — كتاب العلم، حديث 118','url','https://sunnah.com/bukhari:118','source_type','hadith','locator','Sahih al-Bukhari 118'),
      jsonb_build_object('title_ar','مادة تعليمية عن أبي هريرة — مع تنبيه إلى مراجعة النص','url','https://yaqeeninstitute.org/watch/series/the-firsts/abu-huraira-ra-the-preserver-of-hadith-the-firsts','source_type','secondary','locator','The Firsts: Abu Huraira')
    )
  )
),
(
  'سلمان الفارسي رضي الله عنه',
  'Salman al-Farisi',
  'salman-al-farisi',
  'صحابي من بلاد فارس، عُرف برحلة البحث عن الحق حتى لقي النبي ﷺ في المدينة. تُحفظ في هذه المادة حدود الروايات الثابتة، ويُفصل بين الحديث المسند وبين التفاصيل التي تحتاج تحقيقًا تاريخيًا.',
  'A Persian companion known for his journey in search of truth before meeting the Prophet ﷺ in Madinah. This entry separates authenticated reports from historical details that require further verification.',
  'sahaba',
  121, false,
  jsonb_build_object(
    'source_verified', false,
    'review_status', 'human_review_required',
    'references', jsonb_build_array(
      jsonb_build_object('title_ar','صحيح البخاري — فضائل الأنصار، حديث 3946','url','https://sunnah.com/bukhari:3946','source_type','hadith','locator','Sahih al-Bukhari 3946'),
      jsonb_build_object('title_ar','مادة تعليمية عن سلمان الفارسي — مع تنبيه إلى مراجعة النص','url','https://yaqeeninstitute.org/watch/series/the-firsts/salman-al-farsi-ra-the-truth-seeker-the-firsts','source_type','secondary','locator','The Firsts: Salman al-Farsi')
    )
  )
),
(
  'معاذ بن جبل رضي الله عنه',
  'Muadh ibn Jabal',
  'muadh-ibn-jabal',
  'صحابي من أهل العلم والفقه، ارتبط اسمه بالتعليم والقضاء في صدر الإسلام. تُضاف هذه المادة مع ضرورة مراجعة كل رواية في مصادر الحديث قبل اعتماد التفاصيل التعليمية.',
  'A learned companion associated with teaching and judgment in the early Muslim community. Each educational detail must be checked against its hadith source before publication.',
  'sahaba',
  122, false,
  jsonb_build_object(
    'source_verified', false,
    'review_status', 'human_review_required',
    'references', jsonb_build_array(
      jsonb_build_object('title_ar','سنن الترمذي — بعث معاذ إلى اليمن','url','https://sunnah.com/tirmidhi:1327','source_type','hadith','locator','Jami at-Tirmidhi 1327'),
      jsonb_build_object('title_ar','صحيح البخاري — فضائل معاذ بن جبل','url','https://sunnah.com/bukhari:3809','source_type','hadith','locator','Sahih al-Bukhari 3809')
    )
  )
),
(
  'أسماء بنت أبي بكر رضي الله عنها',
  'Asma bint Abi Bakr',
  'asma-bint-abi-bakr',
  'صحابية من السابقين، عُرفت بثباتها وصبرها وخدمتها لأهل بيت النبي ﷺ. تُعرض سيرتها من خلال الروايات المحددة، مع منع تعميم القصص الشعبية التي لا يثبت إسنادها.',
  'An early Muslim companion known for steadfastness, patience, and service to the Prophet’s family. Her entry uses specific reports and excludes popular stories without verifiable attribution.',
  'sahaba',
  123, false,
  jsonb_build_object(
    'source_verified', false,
    'review_status', 'human_review_required',
    'references', jsonb_build_array(
      jsonb_build_object('title_ar','صحيح البخاري — أسماء بنت أبي بكر','url','https://sunnah.com/bukhari:3905','source_type','hadith','locator','Sahih al-Bukhari 3905'),
      jsonb_build_object('title_ar','صحيح مسلم — فضائل أسماء بنت أبي بكر','url','https://sunnah.com/muslim:2143','source_type','hadith','locator','Sahih Muslim 2143')
    )
  )
)
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  bio_ar = excluded.bio_ar,
  bio_en = excluded.bio_en,
  category = excluded.category,
  order_num = excluded.order_num,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.scholars (
  name_ar, name_en, slug, bio_ar, bio_en, website_url, published, metadata
) values
(
  'الإمام محمد بن إدريس الشافعي',
  'Muhammad ibn Idris al-Shafi‘i',
  'shafii',
  'فقيه ومحدث من كبار علماء الإسلام، أسس المدرسة الشافعية وأسهم في تنظيم البحث في أصول الفقه. تذكر المصادر الأكاديمية أن كتاب الرسالة من أبرز أعماله في منهج الاستدلال، وتُعرض هذه المادة بوصفها تعريفًا تاريخيًا لا فتوى.',
  'A major Muslim jurist and hadith scholar, founder of the Shafi‘i school, who contributed to the organization of legal methodology. Academic sources identify al-Risalah as a major work in legal reasoning; this is a historical profile, not a fatwa.',
  'https://www.britannica.com/biography/Abu-Abd-Allah-ash-Shafii', true,
  jsonb_build_object(
    'source_verified', true,
    'review_status', 'editorially_reviewed_source_links',
    'references', jsonb_build_array(jsonb_build_object('title_ar','موسوعة Britannica — الشافعي','url','https://www.britannica.com/biography/Abu-Abd-Allah-ash-Shafii','source_type','academic','locator','Biography and Risalah'))
  )
),
(
  'الإمام محمد بن إسماعيل البخاري',
  'Muhammad ibn Ismail al-Bukhari',
  'bukhari',
  'محدث وعالم مسلم اشتهر بجمع الحديث ونقد الروايات، وصاحب الجامع الصحيح. تُعرّف الصفحة بمنهجه وأثره العلمي مع التأكيد على قراءة كل حديث في موضعه وعدم تحويل الوصف التاريخي إلى حكم مستقل.',
  'A Muslim hadith scholar renowned for collecting and critically selecting reports and for compiling al-Jami al-Sahih. The profile explains his scholarly legacy while directing readers to each hadith in its original location.',
  'https://www.britannica.com/biography/al-Bukhari', true,
  jsonb_build_object(
    'source_verified', true,
    'review_status', 'editorially_reviewed_source_links',
    'references', jsonb_build_array(
      jsonb_build_object('title_ar','موسوعة Britannica — البخاري','url','https://www.britannica.com/biography/al-Bukhari','source_type','academic','locator','Biography and hadith compilation'),
      jsonb_build_object('title_ar','صحيح البخاري — النسخة المرجعية','url','https://sunnah.com/bukhari','source_type','hadith','locator','Collection index')
    )
  )
),
(
  'الإمام مالك بن أنس',
  'Malik ibn Anas',
  'malik-ibn-anas',
  'فقيه ومحدث من علماء المدينة، ارتبط اسمه بالمذهب المالكي وبكتاب الموطأ. يُقدّم هذا السجل أثره العلمي في الفقه والحديث مع ربط الأعمال بالمصادر بدل إضافة أقوال منسوبة بلا توثيق.',
  'A Medinan jurist and hadith scholar associated with the Maliki school and the Muwatta. This entry presents his contribution to law and hadith and links works to sources rather than attributing unverified quotations.',
  'https://www.britannica.com/biography/Malik-ibn-Anas', true,
  jsonb_build_object(
    'source_verified', true,
    'review_status', 'editorially_reviewed_source_links',
    'references', jsonb_build_array(
      jsonb_build_object('title_ar','موسوعة Britannica — مالك بن أنس','url','https://www.britannica.com/biography/Malik-ibn-Anas','source_type','academic','locator','Biography and legal school'),
      jsonb_build_object('title_ar','الموطأ — فهرس الروايات','url','https://sunnah.com/malik','source_type','hadith','locator','Muwatta Malik index')
    )
  )
),
(
  'الإمام أحمد بن حنبل',
  'Ahmad ibn Hanbal',
  'ahmad-ibn-hanbal',
  'عالم ومحدث وفقيه عُرف بعنايته بالحديث، ونُسب إليه تأسيس المدرسة الحنبلية. تُعرض سيرته تاريخيًا مع إحالات إلى مصادر مستقلة، دون نقل عبارات وعظية أو فتاوى بلا نص موثق.',
  'A scholar, hadith specialist, and jurist known for his attention to hadith and associated with the Hanbali school. His profile is historical and source-linked, without unattributed devotional sayings or legal rulings.',
  'https://www.britannica.com/biography/Ahmad-ibn-Hanbal', true,
  jsonb_build_object(
    'source_verified', true,
    'review_status', 'editorially_reviewed_source_links',
    'references', jsonb_build_array(jsonb_build_object('title_ar','موسوعة Britannica — أحمد بن حنبل','url','https://www.britannica.com/biography/Ahmad-ibn-Hanbal','source_type','academic','locator','Biography and legal school'))
  )
)
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en,
  bio_ar = excluded.bio_ar,
  bio_en = excluded.bio_en,
  website_url = excluded.website_url,
  metadata = excluded.metadata,
  updated_at = now();

-- Companion biography records remain unpublished until human verification of every locator.
