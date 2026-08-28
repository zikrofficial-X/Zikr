// سور القرآن الكريم مع معلوماتها الكاملة
export interface QuranSurah {
  id: number;
  number: number;
  name_ar: string;
  name_en: string;
  name_transliteration: string;
  verses_count: number;
  period: 'مكي' | 'مدني';
  meaning_ar: string;
  meaning_en: string;
  description_ar: string;
  description_en: string;
  revelation_order: number;
  bismillah: boolean;
  // Tafsir information
  tafsir_short_ar: string;
  tafsir_short_en: string;
  // Important themes
  themes: string[];
  // Key verses numbers
  key_verses: number[];
}

export const QURAN_SURAHS: QuranSurah[] = [
  {
    id: 1,
    number: 1,
    name_ar: 'الفاتحة',
    name_en: 'Al-Fatihah',
    name_transliteration: 'al-Fātiḥah',
    verses_count: 7,
    period: 'مكي',
    meaning_ar: 'فاتحة، البداية',
    meaning_en: 'The Opening',
    description_ar: 'سورة الفاتحة هي أعظم سور القرآن الكريم، وتسمى أم القرآن. تتضمن الحمد لله رب العالمين والدعاء بالهداية والاستقامة.',
    description_en: 'Al-Fatihah is the greatest chapter of the Quran and is called the Mother of the Quran. It encompasses praise to Allah and supplication for guidance and steadfastness.',
    revelation_order: 5,
    bismillah: true,
    tafsir_short_ar: 'تضمنت السورة الدعاء بالهداية والاستقامة وتتألف من سبع آيات كريمات',
    tafsir_short_en: 'The chapter contains a supplication for guidance and consists of seven noble verses',
    themes: ['التوحيد', 'الدعاء', 'الهداية'],
    key_verses: [1, 2, 5, 6, 7]
  },
  {
    id: 2,
    number: 2,
    name_ar: 'البقرة',
    name_en: 'Al-Baqarah',
    name_transliteration: 'al-Baqarah',
    verses_count: 286,
    period: 'مدني',
    meaning_ar: 'البقرة (الدابة)',
    meaning_en: 'The Cow',
    description_ar: 'أطول سور القرآن الكريم تشتمل على أحكام فقهية وقصص الأنبياء والمؤمنين والكافرين',
    description_en: 'The longest chapter of the Quran containing jurisprudential rulings and stories of prophets, believers and disbelievers',
    revelation_order: 87,
    bismillah: true,
    tafsir_short_ar: 'تتناول أحكام الصيام والزكاة والحج وقصة البقرة بني إسرائيل',
    tafsir_short_en: 'Contains rulings on fasting, charity, pilgrimage and the story of the cow of Banu Israel',
    themes: ['الأحكام الفقهية', 'القصص', 'الإيمان'],
    key_verses: [183, 185, 196, 255, 286]
  },
  {
    id: 3,
    number: 3,
    name_ar: 'آل عمران',
    name_en: 'Al Imran',
    name_transliteration: 'Āl ʿImrān',
    verses_count: 200,
    period: 'مدني',
    meaning_ar: 'عمران (الاسم)',
    meaning_en: 'Family of Imran',
    description_ar: 'سورة مدنية تركز على العقيدة والجهاد وقصص الأنبياء والعلماء',
    description_en: 'A Medinan chapter focusing on creed, jihad and stories of prophets and scholars',
    revelation_order: 89,
    bismillah: true,
    tafsir_short_ar: 'تحتوي على قصة مريم وعيسى وآل عمران والجهاد في سبيل الله',
    tafsir_short_en: 'Contains the story of Mary, Jesus and the family of Imran, and jihad in the way of Allah',
    themes: ['التوحيد', 'الجهاد', 'أهل الكتاب'],
    key_verses: [19, 26, 102, 139, 200]
  },
  {
    id: 4,
    number: 4,
    name_ar: 'النساء',
    name_en: 'An-Nisa',
    name_transliteration: 'an-Nisāʾ',
    verses_count: 176,
    period: 'مدني',
    meaning_ar: 'النساء (الجمع)',
    meaning_en: 'The Women',
    description_ar: 'تتناول حقوق النساء والأحكام الشرعية المتعلقة بهن والمواريث',
    description_en: 'Addresses the rights of women and Islamic jurisprudential rulings related to them and inheritance',
    revelation_order: 92,
    bismillah: true,
    tafsir_short_ar: 'تركز على حقوق النساء والمواريث والنفقة والأحكام الشرعية',
    tafsir_short_en: 'Focuses on women\'s rights, inheritance, maintenance and Islamic rulings',
    themes: ['حقوق النساء', 'المواريث', 'الأحكام الاجتماعية'],
    key_verses: [1, 11, 32, 34, 176]
  },
  {
    id: 5,
    number: 5,
    name_ar: 'المائدة',
    name_en: 'Al-Maidah',
    name_transliteration: 'al-Māʾidah',
    verses_count: 120,
    period: 'مدني',
    meaning_ar: 'المائدة (الطعام)',
    meaning_en: 'The Table',
    description_ar: 'سورة مدنية تتحدث عن الحلال والحرام والعهود والمعاهدات',
    description_en: 'A Medinan chapter discussing lawful and unlawful matters, covenants and treaties',
    revelation_order: 112,
    bismillah: true,
    tafsir_short_ar: 'تناول الحلال والحرام والعهد والمواثيق والأحكام الشرعية',
    tafsir_short_en: 'Addresses lawful and unlawful food, covenants and Islamic jurisprudence',
    themes: ['الحلال والحرام', 'العهود', 'أهل الكتاب'],
    key_verses: [1, 3, 8, 32, 120]
  },
];

export const QURAN_STATISTICS = {
  total_surahs: 114,
  total_verses: 6236,
  total_words: 77934,
  total_letters: 330709,
  makki_surahs: 86,
  madani_surahs: 28,
  longest_surah: 'البقرة (286 آية)',
  shortest_surah: 'الكوثر (3 آيات)',
};
