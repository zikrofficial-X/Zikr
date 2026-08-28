-- ZIKR Kids Adventure Library
-- Original educational content for stories, values, safe games, and family activities.

INSERT INTO public.kids_content (
  id, title_ar, title_en, slug, content_ar, content_en, type,
  age_group, published, is_active, metadata
)
VALUES
(
  gen_random_uuid(),
  'لقمان والكلمة الطيبة',
  'Luqman and the Kind Word',
  'story-luqman-kind-words',
  $$كان ياسر يحب أن يكون أول من يجيب في الصف، لكنه كان يقاطع أصدقاءه أحيانًا ويضحك على أخطائهم.

في يوم النشاط، طلبت المعلمة من كل طفل أن يكتب كلمة تشجّع زميلًا. كتب ياسر: "أنت تستطيع أن تتعلم، وأنا أساعدك".

فرح صديقه عمر بالكلمة، ثم طلب ياسر منه أن يعلّمه المسألة التي لم يفهمها. اكتشف ياسر أن الكلمة الطيبة لا تجعل الآخرين سعداء فقط، بل تجعل صاحبها ألطف وأقوى.

الدرس: فكّر قبل أن تتكلم، واجعل كلماتك عونًا لا أذى.$$,
  'A story about kind words, respect, and encouraging friends.',
  'story', '9-12',
  true, true,
  '{"category":"الأخلاق","value":"الرفق واحترام الآخرين","reward":"وسام الكلمة الطيبة","familyPrompt":"كل فرد يقول كلمة تقدير حقيقية لشخص آخر اليوم.","objective":"تحويل الكلام الجميل إلى عادة يومية."}'::jsonb
),
(
  gen_random_uuid(),
  'أنس وحديقة الحي',
  'Anas and the Neighborhood Garden',
  'story-anas-clean-planet',
  $$كان أنس يحب اللعب في الحديقة، لكنه لاحظ أوراقًا وأكوابًا ملقاة على الأرض. قال: "هذه الحديقة بيتنا الصغير، ويجب أن نحافظ عليها".

طلب أنس مساعدة والده، ثم جمعا النفايات ووضعاها في سلالها. في اليوم التالي أحضر أنس زجاجة ماء قابلة لإعادة الاستخدام، وشجّع أصدقاءه على ترك المكان أجمل مما وجدوه.

الدرس: النظافة مسؤولية، والاهتمام بالمخلوقات والبيئة من الشكر على النعم.$$,
  'A story about caring for shared spaces and thanking Allah for blessings.',
  'story', '6-8',
  true, true,
  '{"category":"البيئة والسلوك","value":"الأمانة والعناية بالنعم","reward":"وسام حارس الحديقة","activitySteps":["اختر مكانًا صغيرًا","اجمع المخلفات بأمان مع ولي الأمر","اترك المكان أجمل"],"familyPrompt":"نفّذوا مهمة نظافة قصيرة مع إشراف كبير."}'::jsonb
),
(
  gen_random_uuid(),
  'صفاء وعلبة الطعام',
  'Safaa and the Lunch Box',
  'story-safaa-sharing-lunch',
  $$حضرت صفاء إلى المدرسة بعلبة طعام جميلة. رأت صديقتها نورة تنظر إلى طعامها لأنها نسيت علبتها في البيت.

قسمت صفاء طعامها نصفين، ثم تذكرت أن تسأل والدتها قبل مشاركة أي طعام بسبب الحساسية.

الدرس: المشاركة جميلة، ومعها ننتبه دائمًا إلى السلامة وإذن الكبار.$$,
  'A gentle story about sharing safely and caring for friends.',
  'story', '3-5',
  true, true,
  '{"category":"الرحمة والمشاركة","value":"الكرم والانتباه لسلامة الآخرين","reward":"قلب العطاء","familyPrompt":"اختاروا شيئًا آمنًا يمكن مشاركته بعد سؤال ولي الأمر."}'::jsonb
),
(
  gen_random_uuid(),
  'ذاكرة الأذكار اليومية',
  'Daily Dhikr Memory',
  'game-memory-dhikr-cards',
  $$لعبة بطاقات الذاكرة: اقلب البطاقات وابحث عن كل موقف والذكر المناسب له.

الأزواج المقترحة: قبل النوم / باسمك اللهم أموت وأحيا، قبل الطعام / بسم الله، بعد الطعام / الحمد لله، عند العطاس / الحمد لله، عند دخول البيت / السلام على الأهل.

طريقة اللعب: اقلب بطاقتين في كل دور. إذا لم تجد الزوج، أعد البطاقتين مكانهما وتعلم من دورك التالي. الهدف هو التذكر والهدوء، لا السرعة.$$,
  'A safe memory game that connects daily moments with simple adhkar.',
  'game', '6-8',
  true, true,
  '{"category":"ألعاب الذاكرة","gameType":"memory","value":"ربط الذكر بالموقف","reward":"وسام الذاكرة","activitySteps":["اصنع البطاقات مع كبير","اقلب بطاقتين","اذكر المناسبة","احتفل بالتعلم"],"safetyNote":"لعبة منزلية بإشراف ولي الأمر."}'::jsonb
),
(
  gen_random_uuid(),
  'عجلة أعمال الخير',
  'Kindness Spinner',
  'game-kindness-spinner',
  $$اختر مهمة خير من القائمة: ابتسم لأخيك، ساعد في ترتيب الألعاب، اسقِ نباتًا، قل شكرًا، أو ادعُ بالخير لشخص تحبه.

يمكن لولي الأمر كتابة المهام على دوائر ورقية، ثم تدوير قلم في الوسط. لا توجد خسارة في هذه اللعبة؛ كل مهمة منجزة تصنع نجمة في شجرة الخير.$$,
  'A family kindness challenge with no losing outcome.',
  'game', '3-5',
  true, true,
  '{"category":"مهام يومية","gameType":"daily-challenge","value":"الرحمة والتعاون","reward":"حديقة الخير","durationDays":7,"activitySteps":["اختر مهمة","نفذها بأمان","أخبر أسرتك","أضف نجمة"],"familyPrompt":"شارِكوا مهمة واحدة يوميًا دون نشر بيانات الأطفال."}'::jsonb
),
(
  gen_random_uuid(),
  'ماذا ستفعل؟ مدينة الاختيارات',
  'What Would You Do?',
  'game-scenario-smart-choice',
  $$أنت في مدينة الاختيارات. اقرأ الموقف واختر التصرف الأقرب إلى الخُلُق الحسن.

المواقف: رسالة من مجهول يطلب صورتك، خطأ في حق صديق، قلم ليس لك، خسارة في لعبة، وخبر غير مؤكد عن زميل.

الدرس: الشجاعة ليست في الصراخ، بل في اختيار الصواب وطلب المساعدة عند الحاجة.$$,
  'Scenario game about good choices, digital safety, and asking trusted adults for help.',
  'game', '9-12',
  true, true,
  '{"category":"السلامة والقرارات","gameType":"scenario","value":"الأمانة والحدود الرقمية وطلب المساعدة","reward":"وسام الاختيار الحكيم","familyPrompt":"تحدثوا عن شخص بالغ موثوق يمكن الرجوع إليه عند القلق."}'::jsonb
),
(
  gen_random_uuid(),
  'اختبار أبطال الأخلاق',
  'Heroes of Good Character Quiz',
  'quiz-akhlaq-adventure',
  'رحلة قصيرة من خمسة مواقف. فكر في أثر كل اختيار على نفسك والآخرين، ثم ناقش خلقًا واحدًا مع أسرتك.',
  'A five-question quiz about kindness, patience, honesty, and wise choices.',
  'quiz', '9-12',
  true, true,
  '{"category":"الأخلاق والمهارات","gameType":"quiz","value":"التثبت والتعاون وضبط الغضب","reward":"تاج الخُلُق الجميل","familyPrompt":"اختاروا خلقًا واحدًا لتجربته طوال اليوم."}'::jsonb
),
(
  gen_random_uuid(),
  'دفتر نعمتي اليوم',
  'My Gratitude Journal',
  'activity-family-shukr-journal',
  $$ارسم ثلاث نعم تفرح بها اليوم، ثم اكتب أو أخبر ولي أمرك لماذا تشكر الله عليها. في أسفل الصفحة أكمل الجملة: "سأستخدم هذه النعمة في ...".

لا نقارن رسوماتنا برسومات الآخرين؛ لكل طفل طريقته الجميلة في التعبير.$$,
  'A gratitude drawing and reflection activity.',
  'game', '6-8',
  true, true,
  '{"category":"التأمل والشكر","gameType":"drawing","value":"الشكر والتعبير عن المشاعر","reward":"وسام القلب الشاكر","activitySteps":["ارسم نعمة","اكتب سبب الشكر","حدد استخدامًا نافعًا","شارك مع الأسرة إن أحببت"],"familyPrompt":"اكتبوا أنتم أيضًا نعمة واحدة في دفتر الأسرة دون إجبار الطفل على مشاركة مشاعره."}'::jsonb
),
(
  gen_random_uuid(),
  'مختبر الماء والنظافة',
  'Water and Cleanliness Lab',
  'activity-wudu-science-safe',
  $$ضع ثلاث كميات مختلفة من الماء في أكواب آمنة، ثم قارن كيف يمكن للإنسان أن ينظف يديه بكمية معتدلة بدل الإسراف.

اكتب ملاحظتك: متى يكون الماء ضروريًا؟ وكيف نحافظ عليه؟ نفذ النشاط مع ولي الأمر ولا تستخدم ماءً ساخنًا أو أدوات زجاجية.$$,
  'A supervised activity about wudu, cleanliness, moderation, and water safety.',
  'wudu', '9-12',
  true, true,
  '{"category":"الوضوء والبيئة","value":"الطهارة والاعتدال وعدم الإسراف","reward":"وسام أمين الماء","activitySteps":["جهز أكوابًا آمنة","قارن الكميات","اكتب ملاحظة","نظف المكان"],"familyPrompt":"نفذوا النشاط بجانب حوض مناسب وتحت إشراف كبير.","safetyNote":"لا تستخدم الزجاج أو الماء الساخن، ولا تترك الطفل وحده قرب الماء."}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  title_en = EXCLUDED.title_en,
  content_ar = EXCLUDED.content_ar,
  content_en = EXCLUDED.content_en,
  type = EXCLUDED.type,
  age_group = EXCLUDED.age_group,
  published = true,
  is_active = true,
  metadata = EXCLUDED.metadata,
  updated_at = now();
