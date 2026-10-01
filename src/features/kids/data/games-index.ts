/**
 * Kids Games Index - Complete Registry with Metadata
 * v1.1.0 - September 29, 2026
 * 
 * This file provides a complete index of all available kids games
 * with metadata, categories, and content descriptions.
 */

export interface GameMetadata {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  category: 'action' | 'educational' | 'memory' | 'puzzle' | 'creativity' | 'learning';
  ageMin: number;
  ageMax: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  duration: number; // in minutes
  levels: number;
  isEnabled: boolean;
  hasArabic: boolean;
  hasEnglish: boolean;
  contentRating: 'G' | 'PG';
  islamicValues: string[];
  skillsDeveloped: string[];
  rewards: {
    perLevel: number;
    perCompletion: number;
    perAchievement: number;
  };
}

export const GAMES_REGISTRY: GameMetadata[] = [
  {
    id: 'zikr-runner',
    nameAr: 'عداء الذكر',
    nameEn: 'Zikr Runner',
    descriptionAr: 'لعبة ركض مثيرة - اركض واجمع الأذكار الإسلامية مع مستويات متزايدة الصعوبة',
    descriptionEn: 'Exciting runner game - Run and collect Islamic phrases with increasing difficulty levels',
    icon: '🏃',
    category: 'action',
    ageMin: 6,
    ageMax: 12,
    difficulty: 'medium',
    duration: 15,
    levels: 6,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 50,
      perCompletion: 300,
      perAchievement: 100,
    },
  },
  {
    id: 'zikr-memory',
    nameAr: 'لعبة الذاكرة الإسلامية',
    nameEn: 'Islamic Memory Game',
    descriptionAr: 'ابحث عن أزواج من الآيات والأحاديث والأذكار المتطابقة',
    descriptionEn: 'Find matching pairs of verses, hadith, and Islamic phrases',
    icon: '🧠',
    category: 'memory',
    ageMin: 5,
    ageMax: 12,
    difficulty: 'easy',
    duration: 10,
    levels: 5,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 50,
      perCompletion: 250,
      perAchievement: 75,
    },
  },
  {
    id: 'wudu-challenge',
    nameAr: 'تحدي الوضوء',
    nameEn: 'Wudu Challenge',
    descriptionAr: 'تعلم خطوات الوضوء الصحيحة ورتبها بالترتيب الصحيح',
    descriptionEn: 'Learn correct ablution steps and arrange them in the right order',
    icon: '💧',
    category: 'educational',
    ageMin: 5,
    ageMax: 10,
    difficulty: 'easy',
    duration: 12,
    levels: 4,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 50,
      perCompletion: 200,
      perAchievement: 80,
    },
  },
  {
    id: 'verse-puzzle',
    nameAr: 'لغز الآية',
    nameEn: 'Verse Puzzle',
    descriptionAr: 'اجمع كلمات الآيات القرآنية وأكملها بالترتيب الصحيح',
    descriptionEn: 'Assemble Quranic verses by arranging words correctly',
    icon: '📖',
    category: 'puzzle',
    ageMin: 7,
    ageMax: 13,
    difficulty: 'medium',
    duration: 15,
    levels: 5,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 75,
      perCompletion: 375,
      perAchievement: 120,
    },
  },
  {
    id: 'zikr-quiz',
    nameAr: 'اختبار الذكر',
    nameEn: 'Zikr Quiz',
    descriptionAr: 'اختبر معلوماتك الإسلامية من خلال أسئلة ممتعة',
    descriptionEn: 'Test your Islamic knowledge through fun questions',
    icon: '📚',
    category: 'learning',
    ageMin: 7,
    ageMax: 15,
    difficulty: 'medium',
    duration: 12,
    levels: 5,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 50,
      perCompletion: 250,
      perAchievement: 90,
    },
  },
  {
    id: 'good-deeds',
    nameAr: 'الأعمال الصالحة',
    nameEn: 'Good Deeds',
    descriptionAr: 'اكمل الأعمال الصالحة اليومية واجمع نقاط المكافآت',
    descriptionEn: 'Complete daily good deeds and earn reward points',
    icon: '💚',
    category: 'educational',
    ageMin: 5,
    ageMax: 15,
    difficulty: 'easy',
    duration: 20,
    levels: 4,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 50,
      perCompletion: 200,
      perAchievement: 75,
    },
  },
  {
    id: 'mosque-cleanup',
    nameAr: 'تنظيف المسجد',
    nameEn: 'Mosque Cleanup',
    descriptionAr: 'نظف المسجد بلطف واعتني بهذا البيت المقدس',
    descriptionEn: 'Gently clean the mosque and take care of this sacred place',
    icon: '🕌',
    category: 'educational',
    ageMin: 5,
    ageMax: 12,
    difficulty: 'easy',
    duration: 10,
    levels: 4,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 50,
      perCompletion: 200,
      perAchievement: 70,
    },
  },
  {
    id: 'zikr-coloring',
    nameAr: 'تلوين الأذكار',
    nameEn: 'Zikr Coloring',
    descriptionAr: 'لون الرسومات الإسلامية بألوانك المفضلة وأظهر الإبداع',
    descriptionEn: 'Color Islamic drawings with your favorite colors and show creativity',
    icon: '🎨',
    category: 'creativity',
    ageMin: 4,
    ageMax: 12,
    difficulty: 'easy',
    duration: 15,
    levels: 5,
    isEnabled: true,
    hasArabic: true,
    hasEnglish: true,
    contentRating: 'G',
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
    rewards: {
      perLevel: 50,
      perCompletion: 250,
      perAchievement: 85,
    },
  },
];

// Statistics and helper functions

export function getGameById(gameId: string): GameMetadata | undefined {
  return GAMES_REGISTRY.find(game => game.id === gameId);
}

export function getEnabledGames(): GameMetadata[] {
  return GAMES_REGISTRY.filter(game => game.isEnabled);
}

export function getGamesByCategory(category: string): GameMetadata[] {
  return GAMES_REGISTRY.filter(game => game.category === category);
}

export function getGamesByAgeGroup(minAge: number, maxAge: number): GameMetadata[] {
  return GAMES_REGISTRY.filter(
    game => game.ageMin <= maxAge && game.ageMax >= minAge
  );
}

export function getGamesStatistics() {
  const registry = GAMES_REGISTRY;
  const enabledCount = registry.filter(g => g.isEnabled).length;
  const totalLevels = registry.reduce((sum, g) => sum + g.levels, 0);
  const totalRewards = registry.reduce(
    (sum, g) => sum + (g.rewards.perLevel * g.levels + g.rewards.perCompletion),
    0
  );
  const categories = [...new Set(registry.map(g => g.category))].length;
  const ageRange = {
    min: Math.min(...registry.map(g => g.ageMin)),
    max: Math.max(...registry.map(g => g.ageMax)),
  };

  return {
    totalGames: registry.length,
    enabledGames: enabledCount,
    totalLevels,
    totalRewards,
    uniqueCategories: categories,
    ageRange,
    arabicSupported: registry.filter(g => g.hasArabic).length,
    englishSupported: registry.filter(g => g.hasEnglish).length,
  };
}

export function validateGameId(gameId: string): boolean {
  return GAMES_REGISTRY.some(game => game.id === gameId);
}

export function getGamesByLanguage(language: 'ar' | 'en'): GameMetadata[] {
  if (language === 'ar') {
    return GAMES_REGISTRY.filter(game => game.hasArabic);
  }
  return GAMES_REGISTRY.filter(game => game.hasEnglish);
}
