/**
 * Enhanced Kids Games with Level System - v1.1.0
 * Improved graphics, levels, difficulty progression, and visual feedback
 * Optimized for children 4-15 years old
 */

export interface GameLevel {
  levelNumber: number;
  titleAr: string;
  titleEn: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  description: string;
  objectives: string[];
  rewards: number;
  timeLimit?: number;
  requirements?: {
    minScore?: number;
    maxTime?: number;
    collectibles?: number;
  };
  visualSettings: {
    speed: number;
    enemyCount: number;
    collectibleCount: number;
    obstacleCount: number;
    colorScheme: 'light' | 'dark' | 'vibrant';
  };
}

export interface EnhancedGameConfig {
  gameId: string;
  titleAr: string;
  titleEn: string;
  description: string;
  icon: string;
  ageGroup: string;
  totalLevels: number;
  levels: GameLevel[];
  graphics: {
    primaryColors: string[];
    secondaryColors: string[];
    accentColors: string[];
    characterDesigns: string[];
    animations: string[];
    particleEffects: string[];
  };
  soundEffects: {
    collectSound: string;
    victorySound: string;
    failureSound: string;
    levelUpSound: string;
    backgroundMusic: string;
  };
  achievements: {
    speedRunner: string;
    perfectScore: string;
    collector: string;
    levelMaster: string;
    timeKeeper: string;
  };
}

// Enhanced Games with Full Level Systems

export const ENHANCED_GAMES_WITH_LEVELS: EnhancedGameConfig[] = [
  {
    gameId: 'zikr-runner',
    titleAr: 'عداء الذكر',
    titleEn: 'Zikr Runner',
    description: 'أسرع لعبة للأطفال - اركض واجمع الأذكار مع مستويات متزايدة الصعوبة',
    icon: '🏃',
    ageGroup: '6-12',
    totalLevels: 6,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: حديقة المسجد',
        titleEn: 'Beginner: Mosque Garden',
        difficulty: 'easy',
        description: 'اركض ببطء في حديقة المسجد الهادئة',
        objectives: ['جمع 20 حرف', 'تجنب 5 عوائق', 'الوصول للنهاية'],
        rewards: 50,
        timeLimit: 60,
        requirements: { minScore: 20 },
        visualSettings: {
          speed: 150,
          enemyCount: 0,
          collectibleCount: 20,
          obstacleCount: 5,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: طريق الحصى',
        titleEn: 'Intermediate: Stone Path',
        difficulty: 'easy',
        description: 'اركض على طريق الحصى مع عدد أكثر من الأذكار',
        objectives: ['جمع 35 حرف', 'تجنب 10 عوائق', 'سرعة محدودة'],
        rewards: 75,
        timeLimit: 60,
        requirements: { minScore: 35 },
        visualSettings: {
          speed: 180,
          enemyCount: 0,
          collectibleCount: 35,
          obstacleCount: 10,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: حديقة النخيل',
        titleEn: 'Expert: Palm Garden',
        difficulty: 'medium',
        description: 'اركض بسرعة وسط أشجار النخيل والأزهار',
        objectives: ['جمع 50 حرف', 'تجنب 15 عائق', 'حافظ على التركيز'],
        rewards: 100,
        timeLimit: 90,
        requirements: { minScore: 50 },
        visualSettings: {
          speed: 220,
          enemyCount: 2,
          collectibleCount: 50,
          obstacleCount: 15,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'المحترف: السماء الزرقاء',
        titleEn: 'Master: Blue Sky',
        difficulty: 'medium',
        description: 'اركض تحت السماء الزرقاء مع تحديات أكثر',
        objectives: ['جمع 70 حرف', 'تجنب 20 عائق', 'اجمع النجوم'],
        rewards: 150,
        timeLimit: 120,
        requirements: { minScore: 70 },
        visualSettings: {
          speed: 260,
          enemyCount: 3,
          collectibleCount: 70,
          obstacleCount: 20,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 5,
        titleAr: 'الصعب جداً: الليل المضاء',
        titleEn: 'Hard: Illuminated Night',
        difficulty: 'hard',
        description: 'اركض في الليل مع مستويات عالية من الصعوبة',
        objectives: ['جمع 100 حرف', 'تجنب 30 عائق', 'اصطد جميع النجوم'],
        rewards: 200,
        timeLimit: 150,
        requirements: { minScore: 100 },
        visualSettings: {
          speed: 300,
          enemyCount: 4,
          collectibleCount: 100,
          obstacleCount: 30,
          colorScheme: 'dark',
        },
      },
      {
        levelNumber: 6,
        titleAr: 'النهائي: مسار القمة',
        titleEn: 'Ultimate: Peak Path',
        difficulty: 'expert',
        description: 'تحدي نهائي مع سرعة عالية جداً وعوائق كثيرة',
        objectives: ['جمع 150 حرف', 'تجنب 50 عائق', 'وقت محدود جداً'],
        rewards: 300,
        timeLimit: 180,
        requirements: { minScore: 150 },
        visualSettings: {
          speed: 380,
          enemyCount: 5,
          collectibleCount: 150,
          obstacleCount: 50,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#d7b56d', '#f3c969', '#ffd700'],
      secondaryColors: ['#9cc9a5', '#66bb6a', '#4caf50'],
      accentColors: ['#f8f3e7', '#ffeb99', '#ffd54f'],
      characterDesigns: [
        'طفل بملابس إسلامية زرقاء',
        'فتاة بحجاب وردي',
        'صبي بقبعة بيضاء',
        'فتاة بملابس خضراء',
      ],
      animations: [
        'الركض السريع',
        'القفزة العالية',
        'الانزلاق الجانبي',
        'الدوران',
      ],
      particleEffects: [
        'نجوم متلألئة',
        'براق ذهبي',
        'دخان أبيض',
        'ضوء أزرق',
      ],
    },
    soundEffects: {
      collectSound: 'chime-collect.mp3',
      victorySound: 'victory-fanfare.mp3',
      failureSound: 'gentle-fail.mp3',
      levelUpSound: 'level-up-bell.mp3',
      backgroundMusic: 'adventure-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ عداء البرق',
      perfectScore: '💯 درجة كاملة',
      collector: '🏆 جامع الأذكار',
      levelMaster: '👑 سيد المستويات',
      timeKeeper: '⏱️ حارس الوقت',
    },
  },

  {
    gameId: 'zikr-memory',
    titleAr: 'لعبة الذاكرة الإسلامية',
    titleEn: 'Islamic Memory Game',
    description: 'ابحث عن الأزواج المتطابقة مع مستويات متزايدة',
    icon: '🧠',
    ageGroup: '5-12',
    totalLevels: 5,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: أزواج قليلة',
        titleEn: 'Beginner: Few Pairs',
        difficulty: 'easy',
        description: 'ابحث عن 4 أزواج من البطاقات',
        objectives: ['ابحث عن 4 أزواج', 'وقت غير محدود', 'لا عقوبات'],
        rewards: 50,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 8,
          obstacleCount: 0,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: بطاقات أكثر',
        titleEn: 'Intermediate: More Cards',
        difficulty: 'easy',
        description: 'ابحث عن 6 أزواج من البطاقات',
        objectives: ['ابحث عن 6 أزواج', 'وقت محدود', 'تحسين السرعة'],
        rewards: 75,
        timeLimit: 120,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 12,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: شبكة 4x4',
        titleEn: 'Expert: 4x4 Grid',
        difficulty: 'medium',
        description: 'ابحث عن 8 أزواج في شبكة 4x4',
        objectives: ['ابحث عن 8 أزواج', 'وقت محدود', 'محاولات محدودة'],
        rewards: 100,
        timeLimit: 180,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 16,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'الصعب: شبكة 5x4',
        titleEn: 'Hard: 5x4 Grid',
        difficulty: 'hard',
        description: 'ابحث عن 10 أزواج في شبكة كبيرة',
        objectives: ['ابحث عن 10 أزواج', 'وقت قصير', 'دقة عالية'],
        rewards: 150,
        timeLimit: 240,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 20,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
      {
        levelNumber: 5,
        titleAr: 'النهائي: شبكة 6x4',
        titleEn: 'Ultimate: 6x4 Grid',
        difficulty: 'expert',
        description: 'ابحث عن 12 زوج في أكبر شبكة',
        objectives: ['ابحث عن 12 زوج', 'وقت محدود جداً', 'ذاكرة قوية جداً'],
        rewards: 250,
        timeLimit: 300,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 24,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#d7b56d', '#4a7c59', '#2e7d32'],
      secondaryColors: ['#ffeb99', '#a5d6a7', '#66bb6a'],
      accentColors: ['#ffd54f', '#c8e6c9', '#4caf50'],
      characterDesigns: [
        'فتاة تركز على البطاقات',
        'صبي يتذكر الألوان',
        'طفل ذكي يحل اللغز',
      ],
      animations: [
        'قلب البطاقة',
        'توهج النجوم',
        'رقص الحرف',
      ],
      particleEffects: [
        'نجوم ذهبية',
        'براق أخضر',
        'دوامة ملونة',
      ],
    },
    soundEffects: {
      collectSound: 'card-flip.mp3',
      victorySound: 'memory-victory.mp3',
      failureSound: 'card-mismatch.mp3',
      levelUpSound: 'memory-levelup.mp3',
      backgroundMusic: 'memory-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ سريع الذاكرة',
      perfectScore: '💯 ذاكرة حديدية',
      collector: '🏆 جامع الأزواج',
      levelMaster: '👑 خبير الذاكرة',
      timeKeeper: '⏱️ محترف السرعة',
    },
  },

  {
    gameId: 'wudu-challenge',
    titleAr: 'تحدي الوضوء',
    titleEn: 'Wudu Challenge',
    description: 'تعلم خطوات الوضوء بالترتيب الصحيح مع مستويات تعليمية',
    icon: '💧',
    ageGroup: '5-10',
    totalLevels: 4,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: الخطوات الأساسية',
        titleEn: 'Beginner: Basic Steps',
        difficulty: 'easy',
        description: 'رتب 3 خطوات من الوضوء بشكل صحيح',
        objectives: ['رتب 3 خطوات', 'لا وقت محدود', 'تعليمات واضحة'],
        rewards: 50,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 3,
          obstacleCount: 0,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: كل الخطوات',
        titleEn: 'Intermediate: All Steps',
        difficulty: 'easy',
        description: 'رتب جميع 7 خطوات من الوضوء',
        objectives: ['رتب 7 خطوات', 'وقت محدود', 'اتبع الترتيب الصحيح'],
        rewards: 100,
        timeLimit: 120,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 7,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: الوضوء السريع',
        titleEn: 'Expert: Quick Wudu',
        difficulty: 'medium',
        description: 'رتب 7 خطوات بسرعة مع توقيت محدود',
        objectives: ['رتب 7 خطوات بسرعة', 'وقت قصير', 'دقة عالية'],
        rewards: 150,
        timeLimit: 90,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 7,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'المعلم: الخبير الكامل',
        titleEn: 'Master: Full Expert',
        difficulty: 'hard',
        description: 'اجتاز اختبار الوضوء الكامل مع خطوات إضافية',
        objectives: ['اجتز الاختبار', 'وقت محدود', 'بدون أخطاء'],
        rewards: 200,
        timeLimit: 120,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 10,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#00bfff', '#87ceeb', '#87cefa'],
      secondaryColors: ['#4db8ff', '#87d4f7', '#b3e5fc'],
      accentColors: ['#e0f6ff', '#c0ebff', '#a2d5ff'],
      characterDesigns: [
        'شخص يتوضأ بخطوات صحيحة',
        'يد تغسل الوجه',
        'قطرات ماء نظيفة',
      ],
      animations: [
        'تدفق الماء',
        'الغسيل اللطيف',
        'الرش المرئي',
      ],
      particleEffects: [
        'قطرات ماء زرقاء',
        'بخار ماء',
        'توهج نظافة',
      ],
    },
    soundEffects: {
      collectSound: 'water-splash.mp3',
      victorySound: 'wudu-complete.mp3',
      failureSound: 'step-error.mp3',
      levelUpSound: 'wudu-levelup.mp3',
      backgroundMusic: 'water-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ وضوء سريع',
      perfectScore: '💯 وضوء صحيح',
      collector: '🏆 متقن الوضوء',
      levelMaster: '👑 خبير الطهارة',
      timeKeeper: '⏱️ وضوء محترف',
    },
  },

  {
    gameId: 'verse-puzzle',
    titleAr: 'لغز الآية',
    titleEn: 'Verse Puzzle',
    description: 'رتب كلمات الآيات القرآنية مع مستويات متزايدة الصعوبة',
    icon: '📖',
    ageGroup: '7-13',
    totalLevels: 5,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: آيات قصيرة',
        titleEn: 'Beginner: Short Verses',
        difficulty: 'easy',
        description: 'رتب آيات قصيرة من سورة الإخلاص',
        objectives: ['رتب 3 آيات', 'كلمات قليلة', 'تعليمات واضحة'],
        rewards: 50,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 3,
          obstacleCount: 0,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: آيات متوسطة',
        titleEn: 'Intermediate: Medium Verses',
        difficulty: 'easy',
        description: 'رتب آيات متوسطة من الفاتحة',
        objectives: ['رتب 5 آيات', 'كلمات أكثر', 'وقت محدود'],
        rewards: 75,
        timeLimit: 120,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 5,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: آيات طويلة',
        titleEn: 'Expert: Long Verses',
        difficulty: 'medium',
        description: 'رتب آيات طويلة من سورة البقرة',
        objectives: ['رتب 5 آيات طويلة', 'كلمات كثيرة', 'دقة عالية'],
        rewards: 100,
        timeLimit: 180,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 8,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'الصعب: آيات معقدة',
        titleEn: 'Hard: Complex Verses',
        difficulty: 'hard',
        description: 'رتب آيات معقدة مع كلمات متشابهة',
        objectives: ['رتب آيات صعبة', 'تركيز عالي', 'بدون أخطاء'],
        rewards: 150,
        timeLimit: 240,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 10,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
      {
        levelNumber: 5,
        titleAr: 'النهائي: حافظ القرآن',
        titleEn: 'Ultimate: Quranic Master',
        difficulty: 'expert',
        description: 'كن حافظاً للقرآن - رتب آيات عديدة معقدة',
        objectives: ['رتب آيات متعددة', 'ذاكرة قوية', 'فهم عميق'],
        rewards: 250,
        timeLimit: 300,
        requirements: { minScore: 0 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 15,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#d4af37', '#ffd700', '#ffed4e'],
      secondaryColors: ['#b8860b', '#daa520', '#ffa500'],
      accentColors: ['#f4e4c1', '#ffe680', '#fffacd'],
      characterDesigns: [
        'حافظ قرآن يقرأ',
        'يد تكتب الآية',
        'نور القرآن',
      ],
      animations: [
        'ظهور الكلمات',
        'التلألؤ الذهبي',
        'انزلاق الآية',
      ],
      particleEffects: [
        'نور ذهبي',
        'نجوم قرآنية',
        'براق إسلامي',
      ],
    },
    soundEffects: {
      collectSound: 'quran-ding.mp3',
      victorySound: 'verse-complete.mp3',
      failureSound: 'verse-error.mp3',
      levelUpSound: 'quran-levelup.mp3',
      backgroundMusic: 'quran-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ قراءة سريعة',
      perfectScore: '💯 آية صحيحة',
      collector: '🏆 جامع الآيات',
      levelMaster: '👑 حافظ القرآن',
      timeKeeper: '⏱️ قارئ محترف',
    },
  },

  {
    gameId: 'zikr-quiz',
    titleAr: 'اختبار الذكر',
    titleEn: 'Zikr Quiz',
    description: 'اختبر معلوماتك الإسلامية مع مستويات من السهل للصعب',
    icon: '📚',
    ageGroup: '7-15',
    totalLevels: 5,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: الأساسيات',
        titleEn: 'Beginner: Basics',
        difficulty: 'easy',
        description: 'أسئلة سهلة عن العقائد الأساسية',
        objectives: ['أجب على 5 أسئلة', 'أسئلة سهلة', '80% نجاح'],
        rewards: 50,
        requirements: { minScore: 4 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 5,
          obstacleCount: 0,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: الفقه الإسلامي',
        titleEn: 'Intermediate: Islamic Jurisprudence',
        difficulty: 'easy',
        description: 'أسئلة متوسطة عن الفقه والأحكام',
        objectives: ['أجب على 8 أسئلة', 'أسئلة متوسطة', '75% نجاح'],
        rewards: 75,
        timeLimit: 180,
        requirements: { minScore: 6 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 8,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: السيرة النبوية',
        titleEn: 'Expert: Prophetic Biography',
        difficulty: 'medium',
        description: 'أسئلة معقدة عن السيرة النبوية',
        objectives: ['أجب على 10 أسئلة', 'أسئلة صعبة', '70% نجاح'],
        rewards: 100,
        timeLimit: 240,
        requirements: { minScore: 7 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 10,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'الصعب: علوم القرآن',
        titleEn: 'Hard: Quranic Sciences',
        difficulty: 'hard',
        description: 'أسئلة متقدمة عن علوم القرآن الكريم',
        objectives: ['أجب على 12 سؤال', 'أسئلة متقدمة جداً', '65% نجاح'],
        rewards: 150,
        timeLimit: 300,
        requirements: { minScore: 8 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 12,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
      {
        levelNumber: 5,
        titleAr: 'النهائي: الخبير الإسلامي',
        titleEn: 'Ultimate: Islamic Scholar',
        difficulty: 'expert',
        description: 'أسئلة نهائية شاملة عن كل العلوم الإسلامية',
        objectives: ['أجب على 15 سؤال', 'أسئلة نهائية', '60% نجاح'],
        rewards: 250,
        timeLimit: 360,
        requirements: { minScore: 9 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 15,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#8b5a3c', '#d2b48c', '#cd853f'],
      secondaryColors: ['#daa520', '#f0e68c', '#bdb76b'],
      accentColors: ['#ffe066', '#ffeb3b', '#fdd835'],
      characterDesigns: [
        'معلم حكيم',
        'طالب يفكر',
        'عالم إسلامي',
      ],
      animations: [
        'ظهور السؤال',
        'توهج الإجابة',
        'نجاح الدرجة',
      ],
      particleEffects: [
        'نقاط ذهبية',
        'نجوم صفراء',
        'براق معرفة',
      ],
    },
    soundEffects: {
      collectSound: 'quiz-select.mp3',
      victorySound: 'quiz-victory.mp3',
      failureSound: 'quiz-wrong.mp3',
      levelUpSound: 'quiz-levelup.mp3',
      backgroundMusic: 'quiz-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ إجابة سريعة',
      perfectScore: '💯 إجابات صحيحة',
      collector: '🏆 جامع العلم',
      levelMaster: '👑 خبير إسلامي',
      timeKeeper: '⏱️ عالم محترف',
    },
  },

  {
    gameId: 'good-deeds',
    titleAr: 'الأعمال الصالحة',
    titleEn: 'Good Deeds',
    description: 'اكمل الأعمال الصالحة اليومية مع نظام تتبع شامل',
    icon: '💚',
    ageGroup: '5-15',
    totalLevels: 4,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: أعمال بسيطة',
        titleEn: 'Beginner: Simple Tasks',
        difficulty: 'easy',
        description: 'اكمل 3 أعمال صالحة بسيطة يومياً',
        objectives: ['اكمل 3 مهام', 'أعمال بسيطة', 'كل يوم'],
        rewards: 50,
        requirements: { minScore: 3 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 3,
          obstacleCount: 0,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: أعمال متنوعة',
        titleEn: 'Intermediate: Varied Tasks',
        difficulty: 'easy',
        description: 'اكمل 5 أعمال صالحة متنوعة يومياً',
        objectives: ['اكمل 5 مهام', 'أعمال متنوعة', 'كل يوم'],
        rewards: 75,
        requirements: { minScore: 5 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 5,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: أعمال متقدمة',
        titleEn: 'Expert: Advanced Tasks',
        difficulty: 'medium',
        description: 'اكمل 7 أعمال صالحة متقدمة يومياً',
        objectives: ['اكمل 7 مهام', 'أعمال متقدمة', 'كل يوم'],
        rewards: 150,
        requirements: { minScore: 7 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 7,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'المعلم: أسطورة الخير',
        titleEn: 'Master: Legend of Goodness',
        difficulty: 'hard',
        description: 'اكمل 10 أعمال صالحة عليا يومياً',
        objectives: ['اكمل 10 مهام', 'أعمال عليا', 'كل يوم'],
        rewards: 250,
        requirements: { minScore: 10 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 10,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#2e7d32', '#66bb6a', '#4caf50'],
      secondaryColors: ['#c8e6c9', '#a5d6a7', '#81c784'],
      accentColors: ['#f1f8e9', '#dcedc8', '#c5e1a5'],
      characterDesigns: [
        'طفل يساعد الآخرين',
        'عائلة سعيدة',
        'مجتمع متراحم',
      ],
      animations: [
        'قلب متلألئ',
        'يد تساعد',
        'انتشار الخير',
      ],
      particleEffects: [
        'قلوب خضراء',
        'نجوم خضراء',
        'براق رحمة',
      ],
    },
    soundEffects: {
      collectSound: 'deed-complete.mp3',
      victorySound: 'goodness-victory.mp3',
      failureSound: 'deed-reminder.mp3',
      levelUpSound: 'deed-levelup.mp3',
      backgroundMusic: 'goodness-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ عمل سريع',
      perfectScore: '💯 أعمال كاملة',
      collector: '🏆 جامع الخير',
      levelMaster: '👑 أسطورة الخير',
      timeKeeper: '⏱️ متابع الأعمال',
    },
  },

  {
    gameId: 'mosque-cleanup',
    titleAr: 'تنظيف المسجد',
    titleEn: 'Mosque Cleanup',
    description: 'نظف المسجد مع مستويات متزايدة من التنظيف',
    icon: '🕌',
    ageGroup: '5-12',
    totalLevels: 4,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: صحن المسجد',
        titleEn: 'Beginner: Mosque Courtyard',
        difficulty: 'easy',
        description: 'نظف صحن المسجد بلطف',
        objectives: ['نظف 10 عناصر', 'لا وقت محدود', 'بدون عجلة'],
        rewards: 50,
        requirements: { minScore: 10 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 10,
          obstacleCount: 0,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: ممرات المسجد',
        titleEn: 'Intermediate: Mosque Corridors',
        difficulty: 'easy',
        description: 'نظف جميع ممرات المسجد',
        objectives: ['نظف 15 عنصر', 'وقت محدود', 'كفاءة عالية'],
        rewards: 75,
        timeLimit: 120,
        requirements: { minScore: 15 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 15,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: المسجد كاملاً',
        titleEn: 'Expert: Entire Mosque',
        difficulty: 'medium',
        description: 'نظف المسجد كاملاً مع تفاصيل دقيقة',
        objectives: ['نظف 25 عنصر', 'دقة عالية', 'سرعة معقولة'],
        rewards: 150,
        timeLimit: 180,
        requirements: { minScore: 25 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 25,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'المعلم: نظافة مثالية',
        titleEn: 'Master: Perfect Cleanliness',
        difficulty: 'hard',
        description: 'حقق نظافة مثالية للمسجد كاملاً',
        objectives: ['نظف 40 عنصر', 'بدون أخطاء', 'سرعة عالية'],
        rewards: 250,
        timeLimit: 240,
        requirements: { minScore: 40 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 40,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#388e3c', '#66bb6a', '#4caf50'],
      secondaryColors: ['#81c784', '#a5d6a7', '#c8e6c9'],
      accentColors: ['#e8f5e9', '#f1f8e9', '#dcedc8'],
      characterDesigns: [
        'طفل مع مكنسة',
        'عامل نظافة',
        'حارس المسجد',
      ],
      animations: [
        'مسح الأرضية',
        'تلميع الزجاج',
        'تنظيف الجدران',
      ],
      particleEffects: [
        'نجوم نظافة',
        'براق تلميع',
        'دخان تنظيف',
      ],
    },
    soundEffects: {
      collectSound: 'clean-swoosh.mp3',
      victorySound: 'mosque-clean.mp3',
      failureSound: 'cleanup-reminder.mp3',
      levelUpSound: 'cleanup-levelup.mp3',
      backgroundMusic: 'cleanup-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ تنظيف سريع',
      perfectScore: '💯 نظافة مثالية',
      collector: '🏆 جامع النظافة',
      levelMaster: '👑 سيد التنظيف',
      timeKeeper: '⏱️ محترف النظافة',
    },
  },

  {
    gameId: 'zikr-coloring',
    titleAr: 'تلوين الأذكار',
    titleEn: 'Zikr Coloring',
    description: 'لون الرسومات الإسلامية بإبداع مع رسومات متنوعة',
    icon: '🎨',
    ageGroup: '4-12',
    totalLevels: 5,
    levels: [
      {
        levelNumber: 1,
        titleAr: 'المبتدئ: رسومات بسيطة',
        titleEn: 'Beginner: Simple Drawings',
        difficulty: 'easy',
        description: 'لون رسومات بسيطة وجميلة',
        objectives: ['لون 3 رسومات', 'ألوان قليلة', 'بدون ضغوط'],
        rewards: 50,
        requirements: { minScore: 3 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 3,
          obstacleCount: 0,
          colorScheme: 'light',
        },
      },
      {
        levelNumber: 2,
        titleAr: 'المتقدم: رسومات متوسطة',
        titleEn: 'Intermediate: Medium Drawings',
        difficulty: 'easy',
        description: 'لون رسومات إسلامية متوسطة التعقيد',
        objectives: ['لون 5 رسومات', 'ألوان متعددة', 'إبداعية'],
        rewards: 75,
        requirements: { minScore: 5 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 5,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 3,
        titleAr: 'الخبير: رسومات معقدة',
        titleEn: 'Expert: Complex Drawings',
        difficulty: 'medium',
        description: 'لون رسومات معقدة وتفصيلية',
        objectives: ['لون 7 رسومات', 'تفاصيل دقيقة', 'توافق ألواني'],
        rewards: 100,
        requirements: { minScore: 7 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 7,
          obstacleCount: 0,
          colorScheme: 'vibrant',
        },
      },
      {
        levelNumber: 4,
        titleAr: 'الصعب: فن إسلامي',
        titleEn: 'Hard: Islamic Art',
        difficulty: 'hard',
        description: 'لون أعمال فنية إسلامية متقدمة',
        objectives: ['لون 10 رسومات', 'فن إسلامي', 'أسلوب فريد'],
        rewards: 150,
        requirements: { minScore: 10 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 10,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
      {
        levelNumber: 5,
        titleAr: 'النهائي: فنان الأذكار',
        titleEn: 'Ultimate: Zikr Artist',
        difficulty: 'expert',
        description: 'احقق تحفة فنية من خلال التلوين الحر',
        objectives: ['لون 15 رسمة', 'إبداع حر', 'أسلوب شخصي'],
        rewards: 250,
        requirements: { minScore: 15 },
        visualSettings: {
          speed: 0,
          enemyCount: 0,
          collectibleCount: 15,
          obstacleCount: 0,
          colorScheme: 'dark',
        },
      },
    ],
    graphics: {
      primaryColors: ['#ff6f00', '#ff9100', '#ffa726'],
      secondaryColors: ['#ffb74d', '#ffcc80', '#ffe0b2'],
      accentColors: ['#fff9e6', '#ffecb3', '#ffe082'],
      characterDesigns: [
        'فنان صغير يرسم',
        'يد تلون الرسمة',
        'ألوان متفرقة',
      ],
      animations: [
        'الرش اللوني',
        'التلوين السلس',
        'ظهور الألوان',
      ],
      particleEffects: [
        'قطرات ألوان',
        'براق فني',
        'دوامة ملونة',
      ],
    },
    soundEffects: {
      collectSound: 'color-splash.mp3',
      victorySound: 'art-complete.mp3',
      failureSound: 'color-reminder.mp3',
      levelUpSound: 'art-levelup.mp3',
      backgroundMusic: 'art-theme.mp3',
    },
    achievements: {
      speedRunner: '⚡ تلوين سريع',
      perfectScore: '💯 لوحة مثالية',
      collector: '🏆 جامع الألوان',
      levelMaster: '👑 فنان الأذكار',
      timeKeeper: '⏱️ فنان محترف',
    },
  },
];

export function getEnhancedGameConfig(gameId: string): EnhancedGameConfig | undefined {
  return ENHANCED_GAMES_WITH_LEVELS.find(game => game.gameId === gameId);
}

export function getGameLevel(gameId: string, levelNumber: number): GameLevel | undefined {
  const game = getEnhancedGameConfig(gameId);
  return game?.levels.find(level => level.levelNumber === levelNumber);
}

export function getAllEnhancedGames(): EnhancedGameConfig[] {
  return ENHANCED_GAMES_WITH_LEVELS;
}

export function getGameStats(gameId: string): {
  totalLevels: number;
  totalRewards: number;
  totalAchievements: number;
} {
  const game = getEnhancedGameConfig(gameId);
  if (!game) return { totalLevels: 0, totalRewards: 0, totalAchievements: 0 };
  
  const totalRewards = game.levels.reduce((sum, level) => sum + level.rewards, 0);
  const achievements = Object.keys(game.achievements).length;
  
  return {
    totalLevels: game.totalLevels,
    totalRewards,
    totalAchievements: achievements,
  };
}
