import { createClient } from '@/lib/supabase/server';

export type SiteSettingValue = {
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  youtubeChannelUrl?: string | null;
  pinnedMessage?: string | null;
  showQuran?: boolean;
  showHadith?: boolean;
  showProphets?: boolean;
  showCompanions?: boolean;
  showKids?: boolean;
  showPoetry?: boolean;
  showPrayerTimes?: boolean;
  showMemorization?: boolean;
  facebookPageUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  audioSettings?: {
    prayer?: string | null;
    dhikr?: string | null;
    salawat?: string | null;
  } | null;
};

export type PinnedMessage = {
  id: string;
  title: string | null;
  body: string | null;
  type: string | null;
  is_active: boolean;
  priority: number;
};

export type Competition = {
  id: string;
  title: string;
  description: string | null;
  prize: string | null;
  starts_at: string | null;
  ends_at: string | null;
  metadata: { imageUrl?: string | null; rules?: string | null } | null;
};

export type MemorizationPlan = {
  id: string;
  title: string;
  cadence: string;
  target_ref: string | null;
  prompt: string | null;
  tajweed_focus: string | null;
};

const FALLBACK_COMPETITIONS: Competition[] = [
  {
    id: 'fallback-quiz-quran',
    title: 'تحدي القرآن الأسبوعي',
    description: 'مسابقة تعليمية مفتوحة للتدريب على السور والمعاني والمعلومات الأساسية في علوم القرآن. يمكن للمستخدم أن يختبر نفسه من خلال أسئلة قصيرة، ثم يراجع الإجابات والمراجع قبل الانتقال إلى مستوى جديد.',
    prize: 'شارة إنجاز رقمية داخل الحساب',
    starts_at: null,
    ends_at: null,
    metadata: { rules: 'أجب بنفسك أولاً، ثم راجع الإجابة من المصدر. الهدف هو التعلم لا مجرد جمع النقاط.' },
  },
  {
    id: 'fallback-seerah',
    title: 'مسابقة السيرة النبوية',
    description: 'برنامج مراجعة متدرج لأحداث السيرة النبوية، يبدأ بالمرحلة المكية والهجرة وبناء المجتمع في المدينة ثم ينتقل إلى الغزوات والصلح وفتح مكة وحجة الوداع. كل مرحلة مصممة لتشجيع القراءة قبل الإجابة.',
    prize: 'شهادة إكمال للمتعلم',
    starts_at: null,
    ends_at: null,
    metadata: { rules: 'تعتمد الأسئلة على مصادر السيرة والحديث المعتبرة، وتُعرض المعلومة مع توضيح ما هو مشهور وما يحتاج إلى مراجعة.' },
  },
  {
    id: 'fallback-adhkar',
    title: 'تحدي الثبات على الذكر',
    description: 'مبادرة لتثبيت عادة الأذكار اليومية من خلال جدول بسيط للمتابعة والمراجعة. لا تقوم المسابقة على المفاضلة بين الأشخاص، بل على مساعدة كل مستخدم في بناء عادة عبادية قابلة للاستمرار.',
    prize: 'شارة الثبات + سجل إنجاز شخصي',
    starts_at: null,
    ends_at: null,
    metadata: { rules: 'الإنجاز الشخصي أهم من مقارنة الأرقام؛ راجع نص الذكر ومصدره، ثم سجل إتمامك اليومي.' },
  },
];

const FALLBACK_MEMORIZATION_PLANS: MemorizationPlan[] = [
  { id: 'mem-01', title: 'البداية الهادئة: 5 آيات يوميًا', cadence: 'يومي', target_ref: 'سورة قصيرة أو أول 5 آيات من المقرر', prompt: 'استمع مرة، اقرأ من المصحف عدة مرات، ثم سمّع دون نظر. سجّل مواضع الخطأ للمراجعة.', tajweed_focus: 'مخارج الحروف، المدود الأصلية، وضبط الوقف على رؤوس الآيات.' },
  { id: 'mem-02', title: 'نصف صفحة مع مراجعة يومية', cadence: '6 أيام أسبوعيًا', target_ref: 'نصف صفحة جديدة + نصف صفحة سابقة', prompt: 'قسّم المقطع إلى وحدات صغيرة واربط نهاية كل وحدة ببداية التالية.', tajweed_focus: 'الغنة، القلقلة، أحكام النون الساكنة والتنوين بحسب الآيات المقررة.' },
  { id: 'mem-03', title: 'صفحة في الأسبوع مع تثبيت', cadence: '5 أيام حفظ + يومان مراجعة', target_ref: '5 صفحات أسبوعيًا', prompt: 'كل جلسة تبدأ بمراجعة المحفوظ السابق ثم إضافة الجزء الجديد.', tajweed_focus: 'التفخيم والترقيق، المدود، وضبط أواخر الكلمات.' },
  { id: 'mem-04', title: 'خطة سور قصار للناشئين', cadence: '4 أيام أسبوعيًا', target_ref: 'سورة قصيرة واحدة في كل مرحلة', prompt: 'قراءة جماعية، شرح الكلمات الأساسية، ثم تسميع قصير بطريقة مشجعة.', tajweed_focus: 'وضوح الحروف وعدم السرعة مع تصحيح الأخطاء الأساسية.' },
  { id: 'mem-05', title: 'تثبيت المحفوظ القديم', cadence: '3 مرات أسبوعيًا', target_ref: 'جزء محفوظ سابقًا', prompt: 'اقرأ من الذاكرة ثم افتح المصحف فقط عند موضع الشك، وسجل المواضع التي تحتاج تكرارًا.', tajweed_focus: 'الوقف والابتداء وربط الآيات دون إسقاط أو تقديم.' },
  { id: 'mem-06', title: 'مراجعة مكثفة قبل الاختبار', cadence: 'أسبوعان', target_ref: '10 إلى 20 صفحة بحسب القدرة', prompt: 'قسم المقرر إلى جلسات، مع اختبار عشوائي من بدايات المقاطع وأواسطها ونهاياتها.', tajweed_focus: 'سلامة الترتيل وتثبيت المواضع المتشابهة.' },
  { id: 'mem-07', title: 'حفظ مع فهم المعنى', cadence: 'يومي', target_ref: 'آيات قليلة + معنى إجمالي', prompt: 'اقرأ التفسير المختصر الموثوق قبل التسميع، ثم حاول ربط الآيات بموضوع السورة.', tajweed_focus: 'القراءة المتأنية ومراعاة أحكام التلاوة أثناء الفهم.' },
  { id: 'mem-08', title: 'خطة نهاية الأسبوع', cadence: 'جمعة وسبت', target_ref: 'مراجعة ما تم حفظه خلال الأسبوع', prompt: 'تسميع كامل للمقطع الأسبوعي ثم إعادة المواضع التي تكثر فيها الأخطاء.', tajweed_focus: 'تصحيح الأخطاء المتكررة وبناء قائمة شخصية للملاحظات.' },
];

export async function getSiteSetting(key: string): Promise<SiteSettingValue | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .limit(1)
      .single();
    return (data?.value as SiteSettingValue) ?? null;
  } catch {
    return null;
  }
}

export async function getPinnedMessages(limit = 3): Promise<PinnedMessage[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('pinned_messages')
      .select('id, title, body, type, is_active, priority')
      .eq('is_active', true)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getCompetitions(limit = 20): Promise<Competition[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('competitions')
      .select('id, title, description, prize, starts_at, ends_at, metadata')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data?.length) return data;
  } catch {
    // Fall through to bundled editorial competitions.
  }
  return FALLBACK_COMPETITIONS.slice(0, limit);
}

export async function getMemorizationPlans(limit = 12): Promise<MemorizationPlan[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('memorization_plans')
      .select('id, title, cadence, target_ref, prompt, tajweed_focus')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (data?.length) return data;
  } catch {
    // Fall through to bundled editorial plans.
  }
  return FALLBACK_MEMORIZATION_PLANS.slice(0, limit);
}
