const DIRECT_CRISIS_PATTERNS = [
  'انتحار', 'أنتحر', 'عايز أنتحر', 'عاوز أنتحر', 'نفسي أنتحر', 'أفكر في الانتحار',
  'أقتل نفسي', 'اقتُل نفسي', 'أؤذي نفسي', 'ايذاء نفسي', 'إيذاء نفسي',
  'مش عايز أعيش', 'لا أريد أن أعيش', 'لن أعيش', 'مش عايز أصحى', 'لا أريد أن أستيقظ',
  'أختفي للأبد', 'اختفي للأبد', 'أنهي حياتي', 'أنهي كل شيء', 'وداعا للأبد',
];
const DEATH_WISH_PATTERNS = [
  'عايز أموت', 'عاوز أموت', 'نفسي أموت', 'أتمنى أموت', 'أريد أن أموت', 'أريد الموت', 'أتمنى الموت',
];
const NON_LITERAL_DEATH_CONTEXTS = [
  'اموت من الضحك', 'اموت من الجوع', 'اموت من العطش', 'اموت من الحر',
  'اموت من البرد', 'اموت من النعاس', 'اموت من النوم', 'اموت من الكسل',
  'اموت من الفرح', 'اموت من الفرحة',
];

function normalizeCrisisText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const NORMALIZED_DIRECT_CRISIS_PATTERNS = DIRECT_CRISIS_PATTERNS.map(normalizeCrisisText);
const NORMALIZED_DEATH_WISH_PATTERNS = DEATH_WISH_PATTERNS.map(normalizeCrisisText);
const NORMALIZED_NON_LITERAL_DEATH_CONTEXTS = NON_LITERAL_DEATH_CONTEXTS.map(normalizeCrisisText);

export function isCrisisMessage(text: string): boolean {
  const normalized = normalizeCrisisText(text);

  // Explicit self-harm intent always takes precedence over colloquial context.
  if (NORMALIZED_DIRECT_CRISIS_PATTERNS.some(pattern => normalized.includes(pattern))) return true;

  // Common "I could die from ..." expressions are not, by themselves, a wish
  // to self-harm. Pain and other distress contexts remain safety-sensitive.
  if (NORMALIZED_NON_LITERAL_DEATH_CONTEXTS.some(context => normalized.includes(context))) return false;

  // Keep an isolated "I am dying" statement safety-sensitive.
  const isolatedDeathStatement = /^(?:انا\s+)?اموت[.!؟?]*$/u.test(normalized);
  return isolatedDeathStatement || NORMALIZED_DEATH_WISH_PATTERNS.some(pattern => normalized.includes(pattern));
}

export function classifyQuestion(text: string): 'fatwa' | 'spiritual' | 'dhikr' | 'general' {
  const t = text;

  const fatwaIntentKeywords = [
    'حلال', 'حرام', 'جائز', 'يجوز', 'لا يجوز', 'مباح', 'مكروه', 'فرض', 'واجب',
    'فتوى', 'حكم', 'شرعي', 'إسلام يقول', 'ما حكم', 'هل يجوز', 'هل يحل',
    'هل حرام', 'هل حلال',
  ];

  const fatwaTopicKeywords = [
    'الصلاة', 'الزكاة', 'الصيام', 'الحج', 'الربا', 'الطلاق', 'الميراث',
    'النكاح', 'الزواج الشرعي', 'المهر', 'العدة', 'العقيدة', 'التوحيد',
    'الإيمان', 'الكفر', 'الشرك', 'التفسير', 'حديث نبوي', 'الحديث النبوي',
    'حديث صحيح', 'حديث شريف', 'السنة النبوية', 'سنة النبي',
    'السيرة النبوية', 'سيرة النبي', 'المذاهب', 'الوضوء', 'الغسل', 'الحجاب',
  ];

  const dhikrKeywords = [
    'ذكر', 'دعاء', 'أذكار', 'تسبيح', 'استغفار', 'صلاة على النبي',
    'ذكر الصباح', 'ذكر المساء', 'دعاء النوم', 'دعاء الاستيقاظ',
  ];

  const spiritualKeywords = [
    'حزين', 'قلق', 'خائف', 'وحيد', 'مكتئب', 'تعبان', 'أشعر', 'أحتاج',
    'ابتلاء', 'صبر', 'ذنب', 'توبة', 'مرض', 'وفاة', 'رزق', 'ضيق',
    'واسيني', 'ادعيلي', 'أنا خايف', 'أنا زعلان',
  ];

  if (fatwaIntentKeywords.some((k) => t.includes(k))) return 'fatwa';
  if (dhikrKeywords.some((k) => t.includes(k))) return 'dhikr';
  if (spiritualKeywords.some((k) => t.includes(k))) return 'spiritual';
  if (fatwaTopicKeywords.some((k) => t.includes(k))) return 'fatwa';
  return 'general';
}

export function detectEmotion(text: string): string {
  const map: Record<string, string[]> = {
    حزن: ['حزين', 'حزن', 'مكتئب', 'ضيق', 'فقدان', 'وحيد', 'يأس', 'محبط', 'تعبان'],
    قلق: ['قلق', 'توتر', 'متوتر', 'مرتبك', 'وسواس', 'أرق', 'خايف من المستقبل'],
    فرح: ['سعيد', 'فرحان', 'مبسوط', 'نجحت', 'اتخطبت', 'اتجوزت'],
    خوف: ['خوف', 'خائف', 'رعب', 'فزع', 'خايف'],
    غضب: ['غاضب', 'غضب', 'عصبي', 'زعلان', 'ظلمني'],
    شكر: ['شاكر', 'ممتن', 'الحمد لله'],
    صبر: ['ابتلاء', 'محنة', 'بلاء', 'مرض', 'مريض', 'وفاة', 'مات'],
    ذنب: ['ذنب', 'معصية', 'توبة', 'أتوب', 'ندم', 'غلطت'],
    رزق: ['رزق', 'فلوس', 'دين', 'ديون', 'عاطل', 'فقر'],
    زواج: ['زواج', 'عنوسة', 'نصيب', 'طلاق', 'انفصال'],
  };
  for (const [emotion, keywords] of Object.entries(map)) {
    if (keywords.some((k) => text.includes(k))) return emotion;
  }
  return 'عام';
}
