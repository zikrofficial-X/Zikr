/**
 * Enhanced Kids Games Content - v1.1.0
 * Improved graphics, scenarios, narratives, and educational value
 * All content is free-tier compatible with AI-generated audio
 */

export interface GameScenario {
  gameId: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ageGroup: string;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: {
    backgroundColor: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };
  narrative: {
    intro: string;
    challenge: string;
    victory: string;
    defeat: string;
  };
  graphics: {
    mainCharacter: string;
    enemyTypes: string[];
    collectibleTypes: string[];
    backgrounds: string[];
    soundTheme: 'adventure' | 'learning' | 'night' | 'active';
  };
  educational: {
    islamicValues: string[];
    skillsDeveloped: string[];
    objectives: string[];
    lessonPlan: string[];
  };
  freeTierSettings: {
    noVideoGeneration: boolean;
    useTextToSpeech: boolean;
    audioMaxDuration: number;
    graphicsQuality: 'low' | 'medium' | 'high';
  };
}

export const ENHANCED_GAMES: GameScenario[] = [
  {
    gameId: 'zikr-runner',
    titleAr: 'عداء الذكر',
    titleEn: 'Zikr Runner',
    descriptionAr: 'اركض عبر حديقة المسجد وتجنب العوائق واجمع الحروف لتكوين أذكار إسلامية',
    descriptionEn: 'Run through the mosque garden, avoid obstacles, and collect letters to form Islamic phrases',
    ageGroup: '6-12',
    difficulty: 'medium',
    theme: {
      backgroundColor: '#1a3a3a',
      primaryColor: '#d7b56d',
      secondaryColor: '#9cc9a5',
      accentColor: '#f8f3e7',
    },
    narrative: {
      intro: 'مرحباً! أنت في حديقة المسجد الجميلة. ساعد في جمع أحرف الأذكار!',
      challenge: 'تجنب العوائق واجمع كل الحروف قبل نهاية اللعبة',
      victory: 'أحسنت! لقد أكملت الذكر بنجاح! 🎉',
      defeat: 'لا تقلق، حاول مرة أخرى! كل محاولة تقربك من النجاح 💪',
    },
    graphics: {
      mainCharacter: 'طفل يرتدي ملابس إسلامية بسيطة مع بسمة مشرقة',
      enemyTypes: [
        'سحابات رمادية (عوائق)',
        'أوراق سقطت (عوائق متحركة)',
        'رياح خفيفة (مسحات)',
      ],
      collectibleTypes: [
        'نقاط ذهبية (حروف)',
        'نجوم مضيئة (مكافآت إضافية)',
        'قلوب حمراء (صحة إضافية)',
      ],
      backgrounds: [
        'حديقة المسجد الخضراء',
        'طريق مرصوف بالحصى',
        'أشجار نخيل وأزهار',
        'سماء زرقاء صافية',
      ],
      soundTheme: 'adventure',
    },
    educational: {
      islamicValues: [
        'الاستمرار في الذكر',
        'التركيز على الهدف',
        'عدم الاستسلام',
        'السعي للخير',
      ],
      skillsDeveloped: [
        'سرعة البديهة',
        'التركيز والانتباه',
        'التنسيق بين اليد والعين',
        'حفظ الأذكار',
      ],
      objectives: [
        'جمع 50 حرف لتكوين ذكر كامل',
        'تجنب 20 عائق',
        'الوصول لأعلى نقطة ممكنة',
      ],
      lessonPlan: [
        'الدرس 1: تعلم أذكار الصباح',
        'الدرس 2: أذكار المساء',
        'الدرس 3: أذكار يومية',
        'الدرس 4: دعاء قبل النوم',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 60,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'zikr-memory',
    titleAr: 'لعبة الذاكرة الإسلامية',
    titleEn: 'Islamic Memory Game',
    descriptionAr: 'ابحث عن أزواج الآيات والأحاديث والأذكار المتطابقة',
    descriptionEn: 'Find matching pairs of verses, hadith, and duas',
    ageGroup: '5-12',
    difficulty: 'easy',
    theme: {
      backgroundColor: '#0f1419',
      primaryColor: '#d7b56d',
      secondaryColor: '#4a7c59',
      accentColor: '#ffeb99',
    },
    narrative: {
      intro: 'اختبر ذاكرتك! ابحث عن الأزواج المتطابقة من الآيات والأذكار',
      challenge: 'اجد كل الأزواج المتطابقة بأسرع وقت ممكن',
      victory: 'ما شاء الله! ذاكرة قوية جداً! 🧠✨',
      defeat: 'قريب جداً! حاول مرة أخرى وستحصل على وقت أفضل',
    },
    graphics: {
      mainCharacter: 'فتاة صغيرة تركز على الخريطة',
      enemyTypes: [],
      collectibleTypes: [
        'بطاقات مرسومة بألوان زاهية',
        'نجوم تظهر عند النجاح',
      ],
      backgrounds: [
        'مكتبة بها رفوف كتب',
        'حديقة مزهرة',
        'غرفة بها وسائد ملونة',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'تقوية الحفظ',
        'الحكمة والتركيز',
        'الصبر والمثابرة',
      ],
      skillsDeveloped: [
        'تحسين الذاكرة',
        'التركيز البصري',
        'القدرات الإدراكية',
        'سرعة البديهة',
      ],
      objectives: [
        'العثور على 5 أزواج في وقت',
        'تحسين أفضل وقت',
        'مستويات متزايدة الصعوبة',
      ],
      lessonPlan: [
        'المستوى 1: آيات قصيرة',
        'المستوى 2: أذكار يومية',
        'المستوى 3: أحاديث مهمة',
        'المستوى 4: أدعية متنوعة',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 45,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'wudu-challenge',
    titleAr: 'تحدي الوضوء',
    titleEn: 'Wudu Challenge',
    descriptionAr: 'تعلم خطوات الوضوء بشكل صحيح ورتبها بالترتيب الصحيح',
    descriptionEn: 'Learn and arrange the correct steps of ablution',
    ageGroup: '5-10',
    difficulty: 'easy',
    theme: {
      backgroundColor: '#001f3f',
      primaryColor: '#00bfff',
      secondaryColor: '#87ceeb',
      accentColor: '#e0f6ff',
    },
    narrative: {
      intro: 'هيا بنا نتعلم الوضوء الصحيح! رتب الخطوات بالترتيب الصحيح',
      challenge: 'اسحب كل خطوة في المكان الصحيح',
      victory: 'ممتاز! تعلمت الوضوء بشكل صحيح! 💧✨',
      defeat: 'تحقق من الخطوات مرة أخرى وحاول',
    },
    graphics: {
      mainCharacter: 'صورة شخص يتوضأ مع الخطوات مرسومة',
      enemyTypes: [],
      collectibleTypes: [
        'علامات اختيار خضراء',
        'نجوم للإنجاز',
      ],
      backgrounds: [
        'حمام مسجد نظيف',
        'ميضأة المسجد',
        'ماء صافي وأزرق',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'الطهارة والنظافة',
        'أهمية الوضوء للصلاة',
        'اتباع السنة النبوية',
      ],
      skillsDeveloped: [
        'الترتيب والتنظيم',
        'الحفظ والتذكر',
        'الفهم والإدراك',
      ],
      objectives: [
        'فهم 7 خطوات من الوضوء',
        'ترتيبها بشكل صحيح',
        'تطبيقها عملياً',
      ],
      lessonPlan: [
        'الخطوة 1: النية والبسملة',
        'الخطوة 2: غسل الوجه',
        'الخطوة 3: غسل اليدين',
        'الخطوة 4: مسح الرأس',
        'الخطوة 5: غسل الرجلين',
        'الخطوة 6: الدعاء',
        'الخطوة 7: التطبيق العملي',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 120,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'verse-puzzle',
    titleAr: 'لغز الآية',
    titleEn: 'Verse Puzzle',
    descriptionAr: 'اجمع كلمات الآيات القرآنية وأكملها بالترتيب الصحيح',
    descriptionEn: 'Assemble Quranic verses by arranging words correctly',
    ageGroup: '7-13',
    difficulty: 'medium',
    theme: {
      backgroundColor: '#1a1a2e',
      primaryColor: '#d4af37',
      secondaryColor: '#9b6b47',
      accentColor: '#f4e4c1',
    },
    narrative: {
      intro: 'اختبر معرفتك بالقرآن الكريم! رتب كلمات الآيات بالترتيب الصحيح',
      challenge: 'اسحب الكلمات لتكوين الآية الكاملة',
      victory: 'بارك الله فيك! أكملت الآية بشكل صحيح! 📖✨',
      defeat: 'حاول مرة أخرى، تذكر الآية القرآنية',
    },
    graphics: {
      mainCharacter: 'صبي يقرأ المصحف',
      enemyTypes: [],
      collectibleTypes: [
        'كلمات مضيئة',
        'نجوم ذهبية',
      ],
      backgrounds: [
        'مكتبة بمصاحف',
        'صفحة مصحف مفتوحة',
        'خطوط عربية جميلة',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'تعلم القرآن الكريم',
        'احترام كلام الله',
        'حفظ الآيات',
      ],
      skillsDeveloped: [
        'الحفظ القرآني',
        'الترتيب المنطقي',
        'القراءة والفهم',
      ],
      objectives: [
        'تعلم 10 آيات مهمة',
        'حفظ الآيات الكاملة',
        'فهم معاني الآيات',
      ],
      lessonPlan: [
        'آيات من سورة الفاتحة',
        'آيات من سورة الإخلاص',
        'آيات قصيرة سهلة',
        'آيات متوسطة الطول',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 90,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'zikr-jump',
    titleAr: 'قفزة الذكر',
    titleEn: 'Zikr Jump',
    descriptionAr: 'قفز عبر السحب واجمع الحروف لتكوين دعاء كامل',
    descriptionEn: 'Jump over clouds and collect letters to form a complete dua',
    ageGroup: '6-12',
    difficulty: 'medium',
    theme: {
      backgroundColor: '#87ceeb',
      primaryColor: '#ffd700',
      secondaryColor: '#ff69b4',
      accentColor: '#ffffff',
    },
    narrative: {
      intro: 'اقفز عالياً في السماء وجمع أحرف الدعاء!',
      challenge: 'تجنب الغيوم السوداء واجمع كل الأحرف',
      victory: 'رائع! اكتملت الدعاء بنجاح! 🙏✨',
      defeat: 'تابع المحاولة! ستصل أعلى مرة بمرة',
    },
    graphics: {
      mainCharacter: 'طفل يقفز بين السحب',
      enemyTypes: [
        'سحب رمادية',
        'أمطار',
        'رياح قوية',
      ],
      collectibleTypes: [
        'نجوم مضيئة',
        'فراشات ملونة',
        'أوراق ذهبية',
      ],
      backgrounds: [
        'سماء زرقاء',
        'غروب الشمس',
        'ليل مليء بالنجوم',
        'سحب بيضاء',
      ],
      soundTheme: 'adventure',
    },
    educational: {
      islamicValues: [
        'الدعاء والتضرع',
        'الآمال الكبيرة',
        'الاعتماد على الله',
      ],
      skillsDeveloped: [
        'التنسيق الحركي',
        'المهارات الحسية',
        'التركيز والانتباه',
      ],
      objectives: [
        'قفز 50 مرة بنجاح',
        'جمع كل أحرف الدعاء',
        'تحسين المسافات',
      ],
      lessonPlan: [
        'تعلم دعاء النجاح',
        'دعاء الصعوبات',
        'دعاء قبل الامتحان',
        'دعاء الشكر والرضا',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 60,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'hilal-fly',
    titleAr: 'طيران الهلال',
    titleEn: 'Hilal Fly',
    descriptionAr: 'اطر كالهلال في السماء وتجنب العوائق واجمع النجوم',
    descriptionEn: 'Fly like the crescent moon avoiding obstacles and collecting stars',
    ageGroup: '7-13',
    difficulty: 'hard',
    theme: {
      backgroundColor: '#000033',
      primaryColor: '#ffeb3b',
      secondaryColor: '#1e88e5',
      accentColor: '#ffd54f',
    },
    narrative: {
      intro: 'تحت الليل الجميل، اطر كالهلال عبر السماء!',
      challenge: 'تجنب السحب والنيازك واجمع النجوم',
      victory: 'عالي جداً! لقد وصلت للقمة! 🌙⭐',
      defeat: 'حاول مرة أخرى، ستطير أعلى',
    },
    graphics: {
      mainCharacter: 'هلال مشرق يطير',
      enemyTypes: [
        'سحب سوداء',
        'نيازك صغيرة',
        'أمطار',
      ],
      collectibleTypes: [
        'نجوم مضيئة',
        'قمر صغير',
        'مكافآت خاصة',
      ],
      backgrounds: [
        'ليل صافي',
        'سماء مليئة بالنجوم',
        'أفق البحر',
        'جبال قمراء',
      ],
      soundTheme: 'night',
    },
    educational: {
      islamicValues: [
        'جمال السماء من مخلوقات الله',
        'التأمل والتفكر',
        'رؤية عظمة الخالق',
      ],
      skillsDeveloped: [
        'سرعة البديهة',
        'التنسيق الحركي',
        'المثابرة',
      ],
      objectives: [
        'اجمع 100 نجمة',
        'تجنب 50 عائق',
        'اصل لمستوى 10',
      ],
      lessonPlan: [
        'درس عن النجوم والقمر',
        'أذكار الليل',
        'أسرار السماء',
        'معجزات الكون',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 75,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'zikr-road',
    titleAr: 'طريق الذكر',
    titleEn: 'Zikr Road',
    descriptionAr: 'اقود السيارة عبر الطريق وتجنب السيارات الأخرى واجمع الأذكار',
    descriptionEn: 'Drive the car avoiding other vehicles while collecting dhikr',
    ageGroup: '8-14',
    difficulty: 'medium',
    theme: {
      backgroundColor: '#e0e0e0',
      primaryColor: '#ff5722',
      secondaryColor: '#2196f3',
      accentColor: '#ffeb3b',
    },
    narrative: {
      intro: 'اقود الطريق بحكمة! اجمع أحرف الأذكار بعناية',
      challenge: 'تجنب السيارات الأخرى واجمع كل الأحرف',
      victory: 'قيادة آمنة وذاكرة قوية! ممتاز! 🚗✨',
      defeat: 'كن حذراً أكثر! الطريق يحتاج تركيز',
    },
    graphics: {
      mainCharacter: 'سيارة حمراء براقة',
      enemyTypes: [
        'سيارات زرقاء تتحرك',
        'سيارات صفراء',
        'عوائق',
      ],
      collectibleTypes: [
        'أحرف ذهبية',
        'مكافآت سرعة',
        'قلوب صحة',
      ],
      backgrounds: [
        'طريق سريع',
        'شارع مدينة',
        'طريق صحراوي',
        'جسر علوي',
      ],
      soundTheme: 'adventure',
    },
    educational: {
      islamicValues: [
        'الأمان والسلامة',
        'الحذر والانتباه',
        'احترام القواعد',
      ],
      skillsDeveloped: [
        'سرعة البديهة',
        'التنسيق الحركي',
        'اتخاذ القرارات السريعة',
      ],
      objectives: [
        'تجنب 30 سيارة',
        'اجمع 5 أذكار',
        'وصل لأعلى درجة',
      ],
      lessonPlan: [
        'الأمان على الطريق',
        'احترام المشاة',
        'الذكر أثناء القيادة',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 60,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'mosque-adventure',
    titleAr: 'مغامرة المسجد',
    titleEn: 'Mosque Adventure',
    descriptionAr: 'استكشف المسجد واجمع الكنوز وتعلم تاريخ الإسلام',
    descriptionEn: 'Explore the mosque, collect treasures, and learn Islamic history',
    ageGroup: '6-12',
    difficulty: 'easy',
    theme: {
      backgroundColor: '#f5e6d3',
      primaryColor: '#8b7355',
      secondaryColor: '#d4a574',
      accentColor: '#ffd700',
    },
    narrative: {
      intro: 'مرحباً بك في المسجد الكبير! استكشف أرجاءه الجميلة',
      challenge: 'اجمع الكنوز الإسلامية وتعلم عن المسجد',
      victory: 'استكشفت المسجد كاملاً! عالم إسلامي رائع! 🕌✨',
      defeat: 'يمكنك الاستمرار في الاستكشاف',
    },
    graphics: {
      mainCharacter: 'مستكشف صغير فضولي',
      enemyTypes: [],
      collectibleTypes: [
        'صور تاريخية',
        'حروف علماء',
        'كنوز ذهبية',
      ],
      backgrounds: [
        'صحن المسجد',
        'المحراب',
        'المئذنة',
        'مكتبة المسجد',
        'باب المسجد',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'احترام المسجد',
        'تعلم التاريخ الإسلامي',
        'اكتشاف العلماء',
      ],
      skillsDeveloped: [
        'المعرفة التاريخية',
        'الاستكشاف والفضول',
        'التعلم التفاعلي',
      ],
      objectives: [
        'استكشف 5 أماكن',
        'اجمع 10 حقائق تاريخية',
        'تعلم عن العلماء الأوائل',
      ],
      lessonPlan: [
        'تاريخ بناء المسجد الأول',
        'عظماء الحديث والفقه',
        'العمارة الإسلامية',
        'حكماء المسلمين',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 180,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'zikr-quiz',
    titleAr: 'اختبار الذكر',
    titleEn: 'Zikr Quiz',
    descriptionAr: 'اختبر معلوماتك الإسلامية من خلال أسئلة ممتعة',
    descriptionEn: 'Test your Islamic knowledge through fun questions',
    ageGroup: '7-15',
    difficulty: 'medium',
    theme: {
      backgroundColor: '#f3e5ab',
      primaryColor: '#8b5a3c',
      secondaryColor: '#d4af37',
      accentColor: '#ffe066',
    },
    narrative: {
      intro: 'اختبر معرفتك الإسلامية! أجب على 5 أسئلة',
      challenge: 'اختر الإجابة الصحيحة من 4 خيارات',
      victory: 'عظيم جداً! نتيجة ممتازة! 🏆✨',
      defeat: 'جرب مرة أخرى وستعرف الإجابات',
    },
    graphics: {
      mainCharacter: 'معلم حكيم',
      enemyTypes: [],
      collectibleTypes: [
        'نقاط ذهبية',
        'نجوم زرقاء',
      ],
      backgrounds: [
        'فصل دراسي',
        'مكتبة كتب',
        'لوحة بيضاء',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'المعرفة الإسلامية',
        'حب العلم',
        'الفهم الديني',
      ],
      skillsDeveloped: [
        'المعرفة العامة',
        'اتخاذ القرارات',
        'التفكير النقدي',
      ],
      objectives: [
        'إجابة 3 أسئلة صحيحة',
        'فهم المعاني الإسلامية',
        'التعلم المستمر',
      ],
      lessonPlan: [
        'أسئلة عن الصلاة',
        'أسئلة عن الزكاة',
        'أسئلة عن الصوم',
        'أسئلة عن الحج',
        'أسئلة عن الأذكار',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 90,
      graphicsQuality: 'medium',
    },
  },

  {
    gameId: 'good-deeds',
    titleAr: 'الأعمال الصالحة',
    titleEn: 'Good Deeds',
    descriptionAr: 'اكمل الأعمال الصالحة اليومية واجمع نقاط المكافآت',
    descriptionEn: 'Complete daily good deeds and earn reward points',
    ageGroup: '5-15',
    difficulty: 'easy',
    theme: {
      backgroundColor: '#c8e6c9',
      primaryColor: '#2e7d32',
      secondaryColor: '#66bb6a',
      accentColor: '#a5d6a7',
    },
    narrative: {
      intro: 'هيا نقوم بأعمال صالحة يومية! اكمل المهام واجمع النقاط',
      challenge: 'اكمل كل المهام في اليوم الواحد',
      victory: 'أحسنت! أنت شخص صالح وخيّر! 🌟💚',
      defeat: 'حاول غداً بهمة أكبر',
    },
    graphics: {
      mainCharacter: 'طفل يساعد أمه',
      enemyTypes: [],
      collectibleTypes: [
        'نقاط خضراء',
        'قلوب حمراء',
        'نجوم ذهبية',
      ],
      backgrounds: [
        'منزل دافئ',
        'حي سكني',
        'مسجد',
        'حديقة مجتمع',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'الأعمال الصالحة',
        'مساعدة الآخرين',
        'الإحسان والرحمة',
        'الصبر والمثابرة',
      ],
      skillsDeveloped: [
        'تنظيم الوقت',
        'المسؤولية',
        'التعاون',
        'الانضباط',
      ],
      objectives: [
        'اكمل 3 مهام يومياً',
        'تجمع 100 نقطة',
        'حقق مستويات جديدة',
      ],
      lessonPlan: [
        'مساعدة الوالدين',
        'نظافة البيت',
        'مساعدة الجيران',
        'العطاء والإحسان',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 120,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'mosque-cleanup',
    titleAr: 'تنظيف المسجد',
    titleEn: 'Mosque Cleanup',
    descriptionAr: 'نظف المسجد باللمس بالقرب من العناصر والنظفها',
    descriptionEn: 'Clean the mosque by tapping near items to clean them',
    ageGroup: '5-12',
    difficulty: 'easy',
    theme: {
      backgroundColor: '#e8f5e9',
      primaryColor: '#388e3c',
      secondaryColor: '#81c784',
      accentColor: '#c8e6c9',
    },
    narrative: {
      intro: 'المسجد بيت الله! ساعدنا في تنظيفه',
      challenge: 'لمس قريباً من كل عنصر لتنظيفه',
      victory: 'المسجد نظيف وجميل! شكراً لك! ✨🕌',
      defeat: 'يمكنك تنظيف أكثر',
    },
    graphics: {
      mainCharacter: 'طفل مع مكنسة صغيرة',
      enemyTypes: [],
      collectibleTypes: [
        'علامات النظافة',
        'نقاط إنجاز',
      ],
      backgrounds: [
        'صحن المسجد',
        'ممرات المسجد',
        'منطقة الوضوء',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'احترام المسجد',
        'النظافة من الإيمان',
        'خدمة بيت الله',
      ],
      skillsDeveloped: [
        'المهارات الحركية',
        'التركيز والدقة',
        'المسؤولية',
      ],
      objectives: [
        'نظف 10 عناصر',
        'اكمل المسجد كاملاً',
        'حقق درجة كاملة',
      ],
      lessonPlan: [
        'أهمية نظافة المسجد',
        'المسؤولية المجتمعية',
        'احترام الأماكن المقدسة',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 45,
      graphicsQuality: 'high',
    },
  },

  {
    gameId: 'zikr-coloring',
    titleAr: 'تلوين الأذكار',
    titleEn: 'Zikr Coloring',
    descriptionAr: 'لون الرسومات الإسلامية بألوانك المفضلة وأظهر الإبداع',
    descriptionEn: 'Color Islamic drawings with your favorite colors and show creativity',
    ageGroup: '4-12',
    difficulty: 'easy',
    theme: {
      backgroundColor: '#fff9e6',
      primaryColor: '#ff6f00',
      secondaryColor: '#ff9100',
      accentColor: '#ffb74d',
    },
    narrative: {
      intro: 'هيا نلون الرسومات الإسلامية الجميلة!',
      challenge: 'اختر الألوان وأظهر فنك الإبداعي',
      victory: 'رسمتك جميلة جداً! فنان موهوب! 🎨✨',
      defeat: 'جاري ممتع جداً الاستمرار',
    },
    graphics: {
      mainCharacter: 'فنان صغير برسم',
      enemyTypes: [],
      collectibleTypes: [
        'فرش ألوان',
        'إنجازات فنية',
      ],
      backgrounds: [
        'حائط أبيض',
        'وسادة ملونة',
        'استوديو فن',
      ],
      soundTheme: 'learning',
    },
    educational: {
      islamicValues: [
        'الإبداع الفني الإسلامي',
        'حرية التعبير',
        'فن الزخرفة الإسلامية',
      ],
      skillsDeveloped: [
        'الإبداع الفني',
        'الاختيار اللوني',
        'الحركة الدقيقة',
        'التخيل والخيال',
      ],
      objectives: [
        'لون 5 صور كاملة',
        'تعلم الألوان والتناسق',
        'إنشاء أعمال فنية',
      ],
      lessonPlan: [
        'الزخرفة الإسلامية',
        'الألوان والنقوش',
        'الفن والحضارة',
      ],
    },
    freeTierSettings: {
      noVideoGeneration: true,
      useTextToSpeech: true,
      audioMaxDuration: 60,
      graphicsQuality: 'high',
    },
  },
];

export function getGameScenario(gameId: string): GameScenario | undefined {
  return ENHANCED_GAMES.find(game => game.gameId === gameId);
}

export function getAllGameScenarios(): GameScenario[] {
  return ENHANCED_GAMES;
}
