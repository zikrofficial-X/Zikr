export type CatalogItem = {
  href: string;
  ar: string;
  en: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  tone: 'quran' | 'sunnah' | 'worship' | 'history' | 'media' | 'kids' | 'tools' | 'learning';
};

export type CatalogGroup = {
  id: string;
  ar: string;
  en: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  items: CatalogItem[];
};

export const SITE_CATALOG: CatalogGroup[] = [
  {
    id: 'revelation',
    ar: 'الوحي والقرآن',
    en: 'Revelation & Quran',
    descriptionAr: 'القراءة والاستماع والتفسير والحفظ في مسار واحد دون تكرار.',
    descriptionEn: 'Reading, listening, tafsir and memorization in one coherent path.',
    icon: 'BookOpenText',
    items: [
      { href: '/quran', ar: 'القرآن الكريم', en: 'Holy Quran', descriptionAr: 'سور وآيات مع القراءة والاستماع والتنقل.', descriptionEn: 'Surahs and verses with reading and listening.', icon: 'BookOpen', tone: 'quran' },
      { href: '/mushaf', ar: 'المصحف', en: 'Mushaf', descriptionAr: 'قراءة المصحف في تجربة مرجعية مريحة.', descriptionEn: 'A focused Mushaf reading experience.', icon: 'Library', tone: 'quran' },
      { href: '/tafsir', ar: 'التفسير', en: 'Tafsir', descriptionAr: 'فهم الآيات في سياقها مع الرجوع للمصادر.', descriptionEn: 'Study verses in context with source-aware references.', icon: 'SearchCheck', tone: 'quran' },
      { href: '/memorization', ar: 'الحفظ والتسميع', en: 'Memorization', descriptionAr: 'خطط حفظ ومراجعة وتسميع وتتبع التقدم.', descriptionEn: 'Memorization plans, review, recitation and progress.', icon: 'Brain', tone: 'learning' },
      { href: '/wird', ar: 'الورد اليومي', en: 'Daily Wird', descriptionAr: 'خطة يومية تجمع القراءة والمراجعة والاستمرارية.', descriptionEn: 'A daily rhythm for reading and review.', icon: 'CalendarCheck2', tone: 'learning' },
    ],
  },
  {
    id: 'remembrance',
    ar: 'السنة والذكر',
    en: 'Sunnah & Remembrance',
    descriptionAr: 'الأحاديث والأذكار والأدعية والتسبيح في منظومة واحدة.',
    descriptionEn: 'Hadith, adhkar, duas and tasbeeh in one connected space.',
    icon: 'Sparkles',
    items: [
      { href: '/hadith', ar: 'الحديث الشريف', en: 'Hadith', descriptionAr: 'قراءة الحديث مع معرفة الكتاب والمصدر.', descriptionEn: 'Hadith reading with source context.', icon: 'ScrollText', tone: 'sunnah' },
      { href: '/adhkar', ar: 'الأذكار', en: 'Adhkar', descriptionAr: 'أذكار الصباح والمساء والنوم وما بعد الصلاة.', descriptionEn: 'Morning, evening, sleep and post-prayer remembrance.', icon: 'SunMoon', tone: 'worship' },
      { href: '/dua', ar: 'الأدعية', en: 'Duas', descriptionAr: 'أدعية مرتبة بحسب المواقف والاحتياج.', descriptionEn: 'Duas organized by situation and need.', icon: 'HeartHandshake', tone: 'worship' },
      { href: '/tasbeeh', ar: 'التسبيح', en: 'Tasbeeh', descriptionAr: 'عدادات عملية مع أهداف يومية محفوظة محليًا.', descriptionEn: 'Focused counters with locally persisted goals.', icon: 'CircleDot', tone: 'worship' },
    ],
  },
  {
    id: 'daily',
    ar: 'العبادات والأدوات اليومية',
    en: 'Worship & Daily Tools',
    descriptionAr: 'أوقات الصلاة والقبلة والزكاة والتذكيرات اليومية.',
    descriptionEn: 'Prayer times, Qibla, Zakat and daily reminders.',
    icon: 'Compass',
    items: [
      { href: '/prayer-times', ar: 'مواقيت الصلاة', en: 'Prayer Times', descriptionAr: 'مواقيت اليوم والتنبيهات المرتبطة بالصلاة.', descriptionEn: 'Daily prayer times and reminders.', icon: 'Clock3', tone: 'worship' },
      { href: '/qibla', ar: 'القبلة', en: 'Qibla', descriptionAr: 'تحديد اتجاه القبلة من جهازك.', descriptionEn: 'Find the Qibla direction from your device.', icon: 'Navigation', tone: 'tools' },
      { href: '/zakat', ar: 'الزكاة', en: 'Zakat', descriptionAr: 'معلومات وأدوات مساعدة مرتبطة بالزكاة.', descriptionEn: 'Zakat information and support tools.', icon: 'Coins', tone: 'worship' },
      { href: '/settings', ar: 'الإعدادات', en: 'Settings', descriptionAr: 'اللغة والصوت والتنبيهات والمظهر.', descriptionEn: 'Language, audio, reminders and appearance.', icon: 'Settings2', tone: 'tools' },
    ],
  },
  {
    id: 'history',
    ar: 'السيرة والتاريخ',
    en: 'Seerah & History',
    descriptionAr: 'الأنبياء والصحابة والعلماء والقصص والغزوات والفتوحات.',
    descriptionEn: 'Prophets, companions, scholars, stories and history.',
    icon: 'Landmark',
    items: [
      { href: '/prophets', ar: 'الأنبياء', en: 'Prophets', descriptionAr: 'سير وقصص منظمة للقراءة والتعلم.', descriptionEn: 'Structured prophet stories and biographies.', icon: 'Star', tone: 'history' },
      { href: '/companions', ar: 'الصحابة', en: 'Companions', descriptionAr: 'تعريفات وسير ومواقف مختارة.', descriptionEn: 'Profiles and selected stories.', icon: 'Users', tone: 'history' },
      { href: '/scholars', ar: 'العلماء', en: 'Scholars', descriptionAr: 'تراجم ومسارات علمية ومصادر.', descriptionEn: 'Biographies, fields and references.', icon: 'GraduationCap', tone: 'learning' },
      { href: '/stories', ar: 'القصص الإسلامية', en: 'Islamic Stories', descriptionAr: 'قصص مرتبة مع الفصل بين النص والتاريخ.', descriptionEn: 'Stories with clear source boundaries.', icon: 'BookMarked', tone: 'history' },
      { href: '/battles', ar: 'الغزوات', en: 'Battles', descriptionAr: 'خط زمني ومادة تاريخية منظمة.', descriptionEn: 'Organized historical timelines.', icon: 'Shield', tone: 'history' },
      { href: '/conquests', ar: 'الفتوحات', en: 'Conquests', descriptionAr: 'أحداث ومراحل تاريخية مرتبة.', descriptionEn: 'Historical events and periods.', icon: 'Map', tone: 'history' },
    ],
  },
  {
    id: 'knowledge',
    ar: 'المعرفة والمحتوى',
    en: 'Knowledge & Media',
    descriptionAr: 'مقالات وفيديوهات وشعر ومساعد معرفي في تصنيف واضح.',
    descriptionEn: 'Articles, videos, poetry and knowledge tools.',
    icon: 'Layers3',
    items: [
      { href: '/articles', ar: 'المقالات', en: 'Articles', descriptionAr: 'مكتبة تحريرية موسعة للقراءة والتعلم.', descriptionEn: 'A growing editorial library.', icon: 'Newspaper', tone: 'learning' },
      { href: '/videos', ar: 'الفيديوهات', en: 'Videos', descriptionAr: 'محتوى مرئي مرتب حسب الموضوع.', descriptionEn: 'Topic-organized video content.', icon: 'Video', tone: 'media' },
      { href: '/poetry', ar: 'الشعر', en: 'Poetry', descriptionAr: 'ديوان شعري مع سياق وملاحظات المصدر.', descriptionEn: 'Poetry with context and source notes.', icon: 'Feather', tone: 'learning' },
      { href: '/spiritual-ai', ar: 'الرفيق الروحاني', en: 'Spiritual AI', descriptionAr: 'مساعد معرفي مع تنبيه إلى حدود الاستفادة.', descriptionEn: 'A source-aware knowledge assistant.', icon: 'Bot', tone: 'tools' },
    ],
  },
  {
    id: 'audio',
    ar: 'الصوتيات',
    en: 'Audio',
    descriptionAr: 'الأذان والذكر والصلاة على النبي والتلاوات في مساحة منظمة.',
    descriptionEn: 'Adhan, remembrance, salawat and recitations in one audio map.',
    icon: 'Volume2',
    items: [
      { href: '/audio', ar: 'مكتبة الصوت', en: 'Audio Library', descriptionAr: 'مشغل موحد للمقاطع مع مصدر واضح.', descriptionEn: 'Unified audio library with source labels.', icon: 'Headphones', tone: 'media' },
      { href: '/radio', ar: 'الراديو', en: 'Radio', descriptionAr: 'الاستماع المستمر للمواد الصوتية.', descriptionEn: 'Continuous audio listening.', icon: 'RadioTower', tone: 'media' },
      { href: '/reciters', ar: 'تلاوات القراء', en: 'Recitations', descriptionAr: 'مسار مخصص للقراء والتلاوات.', descriptionEn: 'Reciters and Quran recitations.', icon: 'AudioLines', tone: 'media' },
      { href: '/tawasheeh', ar: 'التواشيح', en: 'Tawasheeh', descriptionAr: 'مكتبة صوتية مستقلة.', descriptionEn: 'A dedicated devotional audio collection.', icon: 'Music2', tone: 'media' },
    ],
  },
  {
    id: 'kids',
    ar: 'عالم الأطفال',
    en: 'Kids World',
    descriptionAr: 'ألعاب وقصص وتحديات وإنجازات وتجربة صوتية مستقلة.',
    descriptionEn: 'Games, stories, challenges, achievements and audio.',
    icon: 'Gamepad2',
    items: [
      { href: '/kids', ar: 'الرئيسية', en: 'Kids Home', descriptionAr: 'مدخل واحد لمحتوى الأطفال.', descriptionEn: 'One entry point for kids content.', icon: 'Sparkle', tone: 'kids' },
      { href: '/kids/games', ar: 'الألعاب', en: 'Games', descriptionAr: 'ألعاب تعليمية وحركية بتقدم موحد.', descriptionEn: 'Educational and arcade games.', icon: 'Gamepad2', tone: 'kids' },
      { href: '/kids/adventures', ar: 'المغامرات', en: 'Adventures', descriptionAr: 'قصص تفاعلية ومسارات قصيرة.', descriptionEn: 'Interactive story adventures.', icon: 'MapPinned', tone: 'kids' },
      { href: '/kids/achievements', ar: 'الإنجازات', en: 'Achievements', descriptionAr: 'تقدم الطفل ومكافآته.', descriptionEn: 'Progress and rewards.', icon: 'Trophy', tone: 'kids' },
      { href: '/kids/audio', ar: 'صوتيات الأطفال', en: 'Kids Audio', descriptionAr: 'صوتيات مناسبة للفئة العمرية.', descriptionEn: 'Age-aware audio content.', icon: 'AudioWaveform', tone: 'kids' },
    ],
  },
  {
    id: 'platform',
    ar: 'الأدوات والمنصة',
    en: 'Tools & Platform',
    descriptionAr: 'البحث والمكتبة الأوفلاين والملف الشخصي ودليل المنصة.',
    descriptionEn: 'Search, offline library, profile and platform guidance.',
    icon: 'Wrench',
    items: [
      { href: '/search', ar: 'البحث الشامل', en: 'Search', descriptionAr: 'ابحث في محتوى المنصة من مكان واحد.', descriptionEn: 'Search the platform from one place.', icon: 'Search', tone: 'tools' },
      { href: '/offline-library', ar: 'المكتبة الأوفلاين', en: 'Offline Library', descriptionAr: 'الوصول للمحتوى المحفوظ دون اتصال.', descriptionEn: 'Saved content without a connection.', icon: 'Download', tone: 'tools' },
      { href: '/library', ar: 'المكتبة', en: 'Library', descriptionAr: 'تجميع المواد المحفوظة.', descriptionEn: 'A hub for saved material.', icon: 'LibraryBig', tone: 'tools' },
      { href: '/profile', ar: 'الملف الشخصي', en: 'Profile', descriptionAr: 'الحساب والتقدم والإعدادات الشخصية.', descriptionEn: 'Account, progress and preferences.', icon: 'UserCircle2', tone: 'tools' },
      { href: '/platform', ar: 'دليل المنصة', en: 'Platform Guide', descriptionAr: 'شرح متكامل لأقسام ذِكر وطريقة استخدامها.', descriptionEn: 'Guide to ZIKR sections and workflows.', icon: 'CircleHelp', tone: 'tools' },
    ],
  },
];

export const CATALOG_ITEMS = SITE_CATALOG.flatMap(group => group.items);

export function getCatalogItem(href: string): CatalogItem | undefined {
  return CATALOG_ITEMS.find(item => item.href === href);
}
