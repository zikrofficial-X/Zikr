import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { ServiceError } from "@/lib/types/common";

export type StoryCategory = "prophets" | "sahaba" | "documentaries" | "history";

export interface StorySourceReference {
  label: string;
  url: string;
  type: 'quran' | 'hadith' | 'history';
}

const PRIMARY_STORY_SOURCES: Record<string, StorySourceReference[]> = {
  'story-of-yusuf': [
    { label: 'سورة يوسف كاملة — القرآن الكريم (السورة 12)', url: 'https://quran.com/12', type: 'quran' },
  ],
  'story-of-musa': [
    { label: 'سورة القصص — القرآن الكريم (السورة 28)', url: 'https://quran.com/28', type: 'quran' },
    { label: 'سورة طه — القرآن الكريم (السورة 20)', url: 'https://quran.com/20', type: 'quran' },
    { label: 'سورة الشعراء — القرآن الكريم (السورة 26)', url: 'https://quran.com/26', type: 'quran' },
  ],
  'story-of-ibrahim': [
    { label: 'سورة إبراهيم — القرآن الكريم (السورة 14)', url: 'https://quran.com/14', type: 'quran' },
    { label: 'سورة الأنعام — القرآن الكريم (السورة 6)', url: 'https://quran.com/6', type: 'quran' },
    { label: 'سورة مريم — القرآن الكريم (السورة 19)', url: 'https://quran.com/19', type: 'quran' },
  ],
  'abu-bakr-siddiq': [
    { label: 'صحيح البخاري — وفاة النبي ﷺ وموقف أبي بكر', url: 'https://sunnah.com/bukhari:1241', type: 'hadith' },
    { label: 'صحيح البخاري — فضائل أبي بكر الصديق', url: 'https://sunnah.com/bukhari/62', type: 'hadith' },
  ],
  'omar-ibn-khattab': [
    { label: 'صحيح البخاري — فضائل عمر بن الخطاب', url: 'https://sunnah.com/bukhari:3683', type: 'hadith' },
    { label: 'صحيح مسلم — فضائل عمر', url: 'https://sunnah.com/muslim:2398', type: 'hadith' },
  ],
  'khalid-ibn-walid': [
    { label: 'صحيح البخاري — فضائل خالد بن الوليد', url: 'https://sunnah.com/bukhari:3757', type: 'hadith' },
    { label: 'صحيح البخاري — أخبار خالد في الجهاد', url: 'https://sunnah.com/bukhari:3069', type: 'hadith' },
  ],
  'battle-of-badr': [
    { label: 'سورة الأنفال — القرآن الكريم', url: 'https://quran.com/8', type: 'quran' },
    { label: 'صحيح البخاري — أحداث بدر', url: 'https://sunnah.com/bukhari:2915', type: 'hadith' },
  ],
  'andalus-documentary': [
    { label: 'الموسوعة البريطانية — تاريخ الأندلس', url: 'https://www.britannica.com/place/Andalusia', type: 'history' },
  ],
};

export interface Story {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  category: StoryCategory;
  metadata?: Record<string, unknown>;
  primarySources?: StorySourceReference[];
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const FALLBACK_STORIES: Story[] = [
  {
    id: "1",
    slug: "story-of-musa",
    title: "قصة موسى عليه السلام",
    summary: "قصة نبي الله موسى عليه السلام كما تتكرر مشاهدها في القرآن: الخوف في الطفولة، ثم الرسالة، ومواجهة فرعون، ونجاة بني إسرائيل.",
    category: "prophets",
    published: true,
    content: `تتناول قصة موسى عليه السلام في القرآن مراحل متتابعة من حياته، مع تكرار التأكيد على عناية الله به وثباته أمام التكليف.

بدأت القصة بإلقاء موسى رضيعاً في اليم بإذن الله، ثم عاد إلى أمه في صورة فيها طمأنينة بعد خوف. وبعد أن بلغ أشده خرج من مصر، ثم عاد برسالة من الله ومعه أخوه هارون عليه السلام. أُرسل الاثنان إلى فرعون ودُعيا إلى توحيد الله وترك الاستكبار.

اشتد الصراع بين الحق والباطل، وظهر سحر السحرة ثم بطل أمام آيات الله، فآمن السحرة بعد أن عرفوا أن ما جاء به موسى ليس من جنس السحر. واستمر موسى عليه السلام في دعوة قومه مع الصبر على أذى فرعون ومن معه.

جاء الفرج عندما أمر الله موسى أن يضرب بعصاه البحر، فانفلق ونجا موسى ومن معه، وأُغرق فرعون وجنوده. وتستكمل السور أحداث بني إسرائيل بعد النجاة، بما فيها مواقف من ضعف اليقين والعهد والعبادة والانقياد.

المغزى المركزي في هذه القصة هو أن النصر لا يرتبط بكثرة الأسباب وحدها، بل بطاعة الله والثبات وحسن التوكل، وأن طغيان القوة مهما بدا عظيماً لا يمنع نفاذ أمر الله.`
  },
  {
    id: "2",
    slug: "abu-bakr-siddiq",
    title: "أبو بكر الصديق رضي الله عنه",
    summary: "مواقف من حياة أبي بكر الصديق رضي الله عنه، وصدقه وصحبته للنبي ﷺ وثباته في المواقف الكبرى.",
    category: "sahaba",
    published: true,
    content: `أبو بكر الصديق رضي الله عنه من أجل أصحاب رسول الله ﷺ، واشتهر بالصدق والصحبة والنصرة والإنفاق. كان قريباً من النبي ﷺ في مراحل الدعوة، ورافقه في الهجرة، وذكر القرآن صحبة النبي ﷺ لأبي بكر في الغار عند اشتداد الخطر.

بعد وفاة النبي ﷺ ظهر أثر ثبات أبي بكر في حفظ جماعة المسلمين من التفرق. ومن أشهر مواقفه خطبته التي قرر فيها أن العبادة لله وحده وأن وفاة النبي ﷺ لا تعني انتهاء الدين. ثم تولى الخلافة فواجه اضطرابات شديدة، وثبت على حماية جماعة المسلمين وإقامة ما رآه حقاً.

اشتهر أيضاً بعنايته بالقرآن، وبمساندة كبار الصحابة، وبالإنفاق في سبيل الله. وتظهر سيرته قيمة الصدق والثبات والحكمة في أوقات الأزمات، مع بقاء المرجع في تفاصيل سيرته هو النصوص الصحيحة والمصادر المعتبرة.

يمكن للقارئ مراجعة المصادر المرفقة للرجوع إلى الأحاديث الأصلية، وعدم الاكتفاء بالملخصات المختصرة عند دراسة السيرة.`
  },
  {
    id: "3",
    slug: "andalus-documentary",
    title: "الأندلس: حضارة خالدة",
    summary: "رحلة تعريفية في تاريخ الأندلس، مع التركيز على التحولات السياسية والعلمية والحضارية دون اختزال التاريخ في رواية واحدة.",
    category: "documentaries",
    published: true,
    content: `الأندلس اسم ارتبط بتاريخ طويل ومعقد في شبه الجزيرة الإيبيرية، وشهدت المنطقة مراحل سياسية متتابعة منذ دخول المسلمين إليها، ثم قيام دول وإمارات متعددة، ثم تغير موازين القوى حتى انتهى الوجود السياسي الإسلامي في غرناطة.

لم تكن الأندلس فترة واحدة متجانسة؛ فقد عرفت عصوراً مختلفة من الحكم والصراع السياسي والتنافس بين المراكز المحلية، كما عرفت فترات ازدهار في العلم والطب والفلسفة والأدب والهندسة والزراعة والعمران. وكانت قرطبة وإشبيلية وغرناطة وغيرها مراكز حضارية مهمة في فترات مختلفة.

ومن المهم عند عرض تاريخ الأندلس التمييز بين النصوص التاريخية الموثقة، والروايات اللاحقة التي قد تبالغ في الأرقام أو التفاصيل. لذلك تعتمد هذه الصفحة على مصادر تعريفية وتدعو القارئ إلى مراجعة المصادر الأصلية والمراجع المتخصصة.

الهدف هنا تقديم مدخل منظم للتاريخ، لا إصدار حكم شامل على كل مرحلة أو اختزال قرون من التحولات في مشهد واحد.`
  },
  {
    id: "4",
    slug: "story-of-yusuf",
    title: "قصة يوسف عليه السلام",
    summary: "من الرؤيا إلى الابتلاء ثم التمكين، كما عرضت سورة يوسف أحداث القصة بصورة متتابعة.",
    category: "prophets",
    published: true,
    content: `تتميز قصة يوسف عليه السلام في سورة يوسف بوحدة سردية واضحة تبدأ برؤياه في صغره، ثم ما تعرض له من كيد إخوته، ثم انتقاله من مرحلة إلى أخرى حتى وصل إلى التمكين.

أُلقي يوسف في الجب، ثم بيع وانتقل إلى مصر. تعرض لابتلاء شديد، ودخل السجن بغير ذنب، لكنه ظل يدعو إلى الله ويحسن التعامل مع من حوله. ثم جاء الفرج عندما فسر رؤيا الملك وربط التفسير بخطة للتعامل مع سنوات الرخاء والشدة.

تولى يوسف مسؤولية من شؤون مصر في مرحلة الأزمة، ثم اجتمعت به إخوته دون أن يعرفوه في البداية. وتدرجت الأحداث حتى انكشفت الحقيقة، وظهر في نهاية القصة معنى العفو والصفح، وتحولت الرؤيا الأولى إلى واقع يصدقها.

القصة تبين أثر الصبر وحسن الظن بالله، وأن تقلب الأحوال لا يمنع تحقق الخير الذي يقدره الله، مع التأكيد على الرجوع إلى السورة نفسها لفهم تسلسل الأحداث والتفاصيل.`
  },
  {
    id: "5",
    slug: "omar-ibn-khattab",
    title: "عمر بن الخطاب رضي الله عنه",
    summary: "سيرة مختصرة لعمر بن الخطاب رضي الله عنه، أحد الخلفاء الراشدين وممن اشتهروا بالعدل والحزم وتحمل المسؤولية.",
    category: "sahaba",
    published: true,
    content: `عمر بن الخطاب رضي الله عنه من كبار أصحاب رسول الله ﷺ، وأسلم بعد مرحلة من الشدة في صدر الدعوة، ثم كان من أنصار النبي ﷺ ومن أصحاب الهجرة والمواقف الكبرى.

تولى الخلافة بعد أبي بكر رضي الله عنه، وفي عهده اتسعت الدولة الإسلامية ونشأت تنظيمات إدارية وقضائية ومالية مهمة. واشتهر بالشدة على نفسه، ومحاسبتها، والعناية بأحوال الناس، مع حضور واضح لمبدأ المسؤولية أمام الله.

تروي كتب الحديث والتاريخ مواقف كثيرة لعمر، لكن ليست كل الروايات في درجتها واحدة؛ لذلك تظل النصوص الصحيحة هي الأساس عند الاستشهاد بفضائله وأخباره. ومن أشهر ما ورد في فضله الأحاديث الصحيحة التي تتحدث عن مكانته وموافقته للحق في مواقف متعددة.

تقدم هذه الصفحة مدخلاً مختصراً، بينما تساعد المصادر المرفقة على التوسع في سيرته ومراجعة النصوص الأصلية.`
  },
  {
    id: "6",
    slug: "battle-of-badr",
    title: "غزوة بدر الكبرى",
    summary: "غزوة بدر كما عرضتها سورة الأنفال والآثار الصحيحة، مع التركيز على السياق والثبات والابتلاء.",
    category: "history",
    published: true,
    content: `وقعت غزوة بدر في السنة الثانية للهجرة، وكانت من أبرز الأحداث العسكرية في السيرة النبوية. خرج المسلمون في سياق معروف من التوتر والصراع مع قريش، ثم انتهى الأمر إلى مواجهة عند بدر بين المسلمين وقريش.

تتناول سورة الأنفال جوانب متعددة من الحدث: طاعة الله ورسوله، والثبات، وتقسيم الغنائم، وما وقع في الميدان من أسباب ودروس. وتظهر في القصة أهمية الأخذ بالأسباب مع التوكل على الله، وعدم الاغترار بالقوة أو العدد.

كان للغزوة أثر كبير في مسار الدولة الإسلامية في المدينة، وبرز بعدها عدد من المواقف السياسية والعسكرية والاجتماعية التي أثرت في العلاقات داخل الجزيرة العربية.

تتعمد هذه الصفحة الاختصار، وتربط القارئ بالمصادر الأصلية حتى يكون تناول التفاصيل منضبطاً بالنصوص، خاصة عند اختلاف الروايات في بعض الجزئيات.`
  },
];

interface StoryRow {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  category: string;
  mood?: string;
  published?: boolean;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

function mapStoryRow(row: StoryRow): Story {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    content: row.content,
    category: row.category as StoryCategory,
    metadata: row.metadata,
    primarySources: PRIMARY_STORY_SOURCES[row.slug] ?? [],
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isStoryRow(item: unknown): item is StoryRow {
  if (!item || typeof item !== "object") return false;
  const row = item as Partial<StoryRow>;
  return Boolean(row.id && row.slug && row.title && row.category);
}

function hasSupabaseConfig() {
  const env = getPublicEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const CACHE_TTL = 5 * 60 * 1000;
let cachedStories: { data: Story[]; timestamp: number } | null = null;

function isExpectedNetworkFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("fetch failed") ||
    message.includes("EAI_AGAIN") ||
    message.includes("AbortError") ||
    message.includes("This operation was aborted")
  );
}

export async function getStories(limit = 100): Promise<Story[]> {
  try {
    if (cachedStories && Date.now() - cachedStories.timestamp < CACHE_TTL) {
      return cachedStories.data;
    }

    if (!hasSupabaseConfig()) {
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    let response: StoryRow[] | undefined;
    try {
      response = await supabaseServerAnonRequest<StoryRow[]>(
        `/rest/v1/stories?select=id,slug,title,summary,content,category,mood,metadata,published,created_at,updated_at&published=eq.true&limit=${limit}&order=created_at.desc`,
        { cache: "force-cache", next: { revalidate: 1800 } }
      );
    } catch (summaryError) {
      if (isExpectedNetworkFallback(summaryError)) {
        cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
        return FALLBACK_STORIES;
      }

      console.warn("[stories] Summary column may not exist, trying without it:", summaryError);
      response = await supabaseServerAnonRequest<StoryRow[]>(
        `/rest/v1/stories?select=id,slug,title,category,published,created_at,updated_at&published=eq.true&limit=${limit}&order=created_at.desc`,
        { cache: "force-cache", next: { revalidate: 1800 } }
      );
    }

    if (!Array.isArray(response)) {
      console.warn("[stories] Invalid response type from Supabase, got:", typeof response);
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    if (response.length === 0) {
      console.warn("[stories] Supabase returned empty array, using fallback");
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    const validated = response.every(isStoryRow);

    if (!validated) {
      console.warn("[stories] Response validation failed, using fallback");
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    const mapped = response.map(mapStoryRow);
    cachedStories = { data: mapped, timestamp: Date.now() };
    return mapped;
  } catch (error) {
    if (isExpectedNetworkFallback(error)) {
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[stories] Failed to fetch from Supabase:", errorMsg);

    if (error instanceof ServiceError) {
      console.error("[stories] Service error code:", error.code, "Status:", error.statusCode);
    }

    return FALLBACK_STORIES;
  }
}

export async function getStoryBySlug(slug: string): Promise<Story | null> {
  const stories = await getStories();
  const story = stories.find(s => s.slug === slug);
  return story || null;
}

export async function getStoriesByCategory(
  category: StoryCategory
): Promise<Story[]> {
  const stories = await getStories();
  return stories.filter(s => s.category === category);
}

export async function getStoriesByIds(ids: string[]): Promise<Story[]> {
  if (!ids || ids.length === 0) return [];
  const stories = await getStories();
  return stories.filter(s => ids.includes(s.id));
}
