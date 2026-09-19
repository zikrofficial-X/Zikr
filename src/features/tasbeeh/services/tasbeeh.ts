/**
 * Tasbeeh (Islamic Counter) Service
 * Manages Dhikr counters and tracking
 */

export interface TasbeehItem {
  id: string;
  name: string;
  nameAr: string;
  text: string;
  textAr: string;
  count: number;
  targetCount?: number;
  category: 'morning' | 'evening' | 'prayer' | 'custom';
}

export interface TasbeehSession {
  id: string;
  items: TasbeehItem[];
  totalCount: number;
  startedAt: Date;
  completedAt?: Date;
}

// Default Tasbeeh items
export const DEFAULT_TASBEEH_ITEMS: TasbeehItem[] = [
  {
    id: 'subhanallah',
    name: 'SubhanAllah',
    nameAr: 'سبحان الله',
    text: 'Glory be to Allah',
    textAr: 'سُبْحَانَ اللَّهِ',
    count: 0,
    targetCount: 33,
    category: 'prayer',
  },
  {
    id: 'alhamdulillah',
    name: 'Alhamdulillah',
    nameAr: 'الحمد لله',
    text: 'All praise is due to Allah',
    textAr: 'الْحَمْدُ لِلَّهِ',
    count: 0,
    targetCount: 33,
    category: 'prayer',
  },
  {
    id: 'allahu-akbar',
    name: 'Allahu Akbar',
    nameAr: 'الله أكبر',
    text: 'Allah is the Greatest',
    textAr: 'اللَّهُ أَكْبَرُ',
    count: 0,
    targetCount: 33,
    category: 'prayer',
  },
  {
    id: 'la-ilaha-illallah',
    name: 'La ilaha illallah',
    nameAr: 'لا إله إلا الله',
    text: 'There is no god but Allah',
    textAr: 'لَا إِلَهَ إِلَّا اللَّهُ',
    count: 0,
    targetCount: 1,
    category: 'prayer',
  },
  {
    id: 'astaghfirullah',
    name: 'Astaghfirullah',
    nameAr: 'أستغفر الله',
    text: 'I seek forgiveness from Allah',
    textAr: 'أَسْتَغْفِرُ اللَّهَ',
    count: 0,
    targetCount: 100,
    category: 'morning',
  },
];

// Morning Adhkar
export const MORNING_ADHKAR: TasbeehItem[] = [
  {
    id: 'morning-1',
    name: 'Ayat Al-Kursi',
    nameAr: 'آية الكرسي',
    text: 'Ayat Al-Kursi',
    textAr: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    count: 0,
    targetCount: 1,
    category: 'morning',
  },
  {
    id: 'morning-2',
    name: 'Subhanallah',
    nameAr: 'سبحان الله',
    text: 'Glory be to Allah',
    textAr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    count: 0,
    targetCount: 100,
    category: 'morning',
  },
  {
    id: 'morning-3',
    name: 'Dua for Protection',
    nameAr: 'دعاء الحفظ',
    text: 'Dua for Protection',
    textAr: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    count: 0,
    targetCount: 3,
    category: 'morning',
  },
];

// Evening Adhkar
export const EVENING_ADHKAR: TasbeehItem[] = [
  {
    id: 'evening-1',
    name: 'Ayat Al-Kursi',
    nameAr: 'آية الكرسي',
    text: 'Ayat Al-Kursi',
    textAr: 'اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ...',
    count: 0,
    targetCount: 1,
    category: 'evening',
  },
  {
    id: 'evening-2',
    name: 'Subhanallah',
    nameAr: 'سبحان الله',
    text: 'Glory be to Allah',
    textAr: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    count: 0,
    targetCount: 100,
    category: 'evening',
  },
  {
    id: 'evening-3',
    name: 'Evening Protection Dua',
    nameAr: 'دعاء المساء',
    text: 'Evening Protection Dua',
    textAr: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ',
    count: 0,
    targetCount: 1,
    category: 'evening',
  },
];

/**
 * Increment counter for a tasbeeh item
 */
export function incrementTasbeeh(item: TasbeehItem): TasbeehItem {
  return {
    ...item,
    count: item.count + 1,
  };
}

/**
 * Reset counter for a tasbeeh item
 */
export function resetTasbeeh(item: TasbeehItem): TasbeehItem {
  return {
    ...item,
    count: 0,
  };
}

/**
 * Check if tasbeeh target is reached
 */
export function isTargetReached(item: TasbeehItem): boolean {
  if (!item.targetCount) return false;
  return item.count >= item.targetCount;
}

/**
 * Get progress percentage
 */
export function getProgress(item: TasbeehItem): number {
  if (!item.targetCount) return 0;
  return Math.min(100, (item.count / item.targetCount) * 100);
}

/**
 * Calculate total count from session
 */
export function calculateTotalCount(items: TasbeehItem[]): number {
  return items.reduce((sum, item) => sum + item.count, 0);
}

/**
 * Get all completed items
 */
export function getCompletedItems(items: TasbeehItem[]): TasbeehItem[] {
  return items.filter(isTargetReached);
}

/**
 * Get all pending items
 */
export function getPendingItems(items: TasbeehItem[]): TasbeehItem[] {
  return items.filter((item) => !isTargetReached(item));
}
