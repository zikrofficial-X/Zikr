export type VerifiedVideoContent = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  learningPoints: string[];
  sources: Array<{ label: string; url: string }>;
};

/** تحرير أصلي تعليمي؛ الاقتباسات الدينية لا تُعاد صياغتها هنا، بل تُربط بمصادرها الأصلية. */
export const VERIFIED_VIDEO_CONTENT: VerifiedVideoContent[] = [
  {
    slug: 'quran-reflection-al-fatiha',
    title: 'تدبر سورة الفاتحة: خريطة العبودية والهداية',
    category: 'القرآن وعلومه',
    summary: 'مسار تعليمي يربط بين الحمد والرحمة والعبادة والاستعانة وطلب الهداية، مع تنبيه إلى أن الشرح تدبر تعليمي لا يغني عن كتب التفسير.',
    learningPoints: ['بنية السورة في سبع آيات', 'معنى الانتقال من الثناء إلى الدعاء', 'كيف تتحول الهداية إلى سلوك يومي'],
    sources: [{ label: 'سورة الفاتحة — القرآن الكريم', url: 'https://quran.com/1' }, { label: 'التفسير الميسر — الفاتحة', url: 'https://quran.com/1:1/tafsirs/ar-tafsir-muyassar' }],
  },
  {
    slug: 'quran-reflection-al-asr',
    title: 'سورة العصر: رأس مال الوقت والعمل الصالح',
    category: 'القرآن وعلومه',
    summary: 'شرح موجز لمفاهيم الإيمان والعمل والتواصي بالحق والصبر، مع أمثلة عملية لتنظيم اليوم دون اختزال السورة في عبارات تحفيزية.',
    learningPoints: ['دلالة القسم بالزمن', 'النجاة الجماعية بالتواصي', 'خطوة عملية أسبوعية قابلة للقياس'],
    sources: [{ label: 'سورة العصر — القرآن الكريم', url: 'https://quran.com/103' }, { label: 'التفسير الميسر — العصر', url: 'https://quran.com/103:1/tafsirs/ar-tafsir-muyassar' }],
  },
  {
    slug: 'hadith-intention',
    title: 'حديث إنما الأعمال بالنيات: فهم النية بلا شعارات',
    category: 'السنة والسيرة',
    summary: 'مادة تعليمية تشرح موضع الحديث في تهذيب العمل، وتفرق بين صحة القصد وبين صحة الفعل، مع إحالة مباشرة إلى نص الحديث.',
    learningPoints: ['النية ليست بديلًا عن العمل الصحيح', 'تجديد القصد قبل المهام اليومية', 'تجنب الحكم على نيات الآخرين'],
    sources: [{ label: 'صحيح البخاري 1', url: 'https://sunnah.com/bukhari:1' }, { label: 'صحيح مسلم 1907', url: 'https://sunnah.com/muslim:1907a' }],
  },
  {
    slug: 'hadith-mercy',
    title: 'الرحمة في السنة: من المعنى إلى الممارسة',
    category: 'السنة والسيرة',
    summary: 'حلقة تربوية عن الرحمة بوصفها خلقًا يظهر في البيت والعمل والاختلاف، مع إبقاء النص النبوي منسوبًا إلى مصدره دون إعادة إنتاج غير موثق.',
    learningPoints: ['الرحمة قوة ضبط لا ضعف', 'الرفق في الحوار العائلي', 'مراجعة أثر الكلمة قبل نشرها'],
    sources: [{ label: 'صحيح البخاري 6013', url: 'https://sunnah.com/bukhari:6013' }, { label: 'صحيح مسلم 2594', url: 'https://sunnah.com/muslim:2594a' }],
  },
  {
    slug: 'story-yusuf-patience',
    title: 'قصة يوسف عليه السلام: الصبر الذي لا يبرر الخطأ',
    category: 'قصص موثقة',
    summary: 'قراءة متسلسلة لمراحل الرؤيا والجب والابتلاء والسجن والتمكين، مع الفصل بين نص السورة وبين الدروس التربوية المستنبطة.',
    learningPoints: ['تغير المكان لا يغير الاستقامة', 'العفة عند القدرة على الخلوة', 'العفو بعد التمكين'],
    sources: [{ label: 'سورة يوسف — القرآن الكريم', url: 'https://quran.com/12' }, { label: 'تفسير السعدي — سورة يوسف', url: 'https://quran.com/12:1/tafsirs/ar-tafseer-al-saddi' }],
  },
  {
    slug: 'story-musa-courage',
    title: 'قصة موسى عليه السلام: الخوف مع أداء الأمانة',
    category: 'قصص موثقة',
    summary: 'سرد تعليمي يجمع المواضع القرآنية الأساسية لقصة موسى، ويركز على طلب العون، ومواجهة الطغيان، وتربية الجماعة بعد النجاة.',
    learningPoints: ['طلب شرح الصدر والاستعانة', 'الحق لا يتوقف على غياب الخوف', 'النجاة بداية مسؤولية جديدة'],
    sources: [{ label: 'سورة القصص — القرآن الكريم', url: 'https://quran.com/28' }, { label: 'سورة طه — القرآن الكريم', url: 'https://quran.com/20' }, { label: 'سورة الشعراء — القرآن الكريم', url: 'https://quran.com/26' }],
  },
  {
    slug: 'adhkar-morning-evidence',
    title: 'أذكار الصباح: بناء ورد ثابت مع التثبت',
    category: 'الأذكار',
    summary: 'دليل عملي لاختيار ورد الصباح وفهم عدد التكرار وربط الذكر ببداية اليوم، مع عرض النصوص من كتب السنة لا من الذاكرة.',
    learningPoints: ['البدء بالقليل الثابت', 'فهم العدد الوارد دون تحويله إلى منافسة', 'الرجوع إلى الحديث عند اختلاف اللفظ'],
    sources: [{ label: 'سيد الاستغفار — صحيح البخاري 6306', url: 'https://sunnah.com/bukhari:6306' }, { label: 'سبحان الله وبحمده — صحيح البخاري 6405', url: 'https://sunnah.com/bukhari:6405' }, { label: 'القرآن — الأحزاب 41–42', url: 'https://quran.com/33/41-42' }],
  },
  {
    slug: 'adhkar-after-prayer',
    title: 'الأذكار بعد الصلاة: ترتيب هادئ بلا استعجال',
    category: 'الأذكار',
    summary: 'مادة تشرح الذكر بعد الصلاة ومكانه في اليوم، وتؤكد أن العداد أداة تذكير وليس حكمًا على الخشوع أو القبول.',
    learningPoints: ['الاستغفار وختم الصلاة', 'التسبيح والتحميد والتكبير', 'استعمال العداد دون تشتيت'],
    sources: [{ label: 'صحيح مسلم 591', url: 'https://sunnah.com/muslim/5/171' }, { label: 'صحيح مسلم 597', url: 'https://sunnah.com/muslim:597a' }],
  },
  {
    slug: 'general-verify-before-sharing',
    title: 'رسالة عامة: تثبت قبل أن تشارك',
    category: 'رسالة عامة',
    summary: 'رسالة توعوية أصلية تشرح ثلاث أسئلة قبل نشر أي نص ديني: ما المصدر؟ ما درجة الثبوت؟ وهل نُقل السياق كاملًا؟',
    learningPoints: ['الانتشار لا يساوي الصحة', 'تمييز النص الديني عن التعليق الشخصي', 'تصحيح الخطأ بوضوح بعد اكتشافه'],
    sources: [{ label: 'منهج التثبت في ذِكر', url: '/articles/verify-religious-information-before-sharing' }, { label: 'بوابة الحديث — السنة', url: 'https://sunnah.com' }],
  },
  {
    slug: 'general-digital-worship',
    title: 'رسالة عامة: اجعل التقنية خادمة للعبادة',
    category: 'رسالة عامة',
    summary: 'فيديو توعوي أصيل عن تقليل الإشعارات، واختيار ورد واحد، وإبقاء التطبيق وسيلة مساعدة لا بديلًا عن العبادة نفسها.',
    learningPoints: ['تحديد هدف واحد للجلسة', 'تقليل التنبيهات غير الضرورية', 'التمييز بين التعليم والفتوى'],
    sources: [{ label: 'دليل الاستخدام الهادئ في ذِكر', url: '/articles/digital-discipline-and-worship' }, { label: 'القرآن — طه 14', url: 'https://quran.com/20/14' }],
  },
];
