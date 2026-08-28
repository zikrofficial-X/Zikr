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
  'battle-of-badr-story': [
    { label: 'سورة الأنفال — القرآن الكريم', url: 'https://quran.com/8', type: 'quran' },
    { label: 'صحيح البخاري — أحداث بدر', url: 'https://sunnah.com/bukhari:2915', type: 'hadith' },
  ],
  'andalus-civilization': [
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
    summary: "الصبر والتوكل على الله في مواجهة فرعون وقومه.",
    category: "prophets",
    published: true,
  },
  {
    id: "2",
    slug: "abu-bakr-siddiq",
    title: "أبو بكر الصديق رضي الله عنه",
    summary: "الصاحب الأول ورفيق الهجرة والخليفة الراشد.",
    category: "sahaba",
    published: true,
  },
  {
    id: "3",
    slug: "andalus-documentary",
    title: "الأندلس: حضارة خالدة",
    summary: "رحلة في تاريخ الحضارة الإسلامية في الأندلس.",
    category: "documentaries",
    published: true,
  },
  {
    id: "4",
    slug: "story-of-yusuf",
    title: "قصة يوسف عليه السلام",
    summary: "أحسن القصص - من الجب إلى عرش مصر.",
    category: "prophets",
    published: true,
  },
  {
    id: "5",
    slug: "omar-ibn-khattab",
    title: "عمر بن الخطاب رضي الله عنه",
    summary: "الفاروق الذي فرق الله به بين الحق والباطل.",
    category: "sahaba",
    published: true,
  },
  {
    id: "6",
    slug: "battle-of-badr",
    title: "غزوة بدر الكبرى",
    summary: "أول معركة فاصلة في تاريخ الإسلام.",
    category: "history",
    published: true,
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

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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
    // Use cache if fresh
    if (cachedStories && Date.now() - cachedStories.timestamp < CACHE_TTL) {
      return cachedStories.data;
    }

    if (!hasSupabaseConfig()) {
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    // Try fetching with summary first, fall back to without if column doesn't exist
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

    // Type validation
    if (!Array.isArray(response)) {
      console.warn(
        "[stories] Invalid response type from Supabase, got:",
        typeof response
      );
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    if (response.length === 0) {
      console.warn("[stories] Supabase returned empty array, using fallback");
      cachedStories = { data: FALLBACK_STORIES, timestamp: Date.now() };
      return FALLBACK_STORIES;
    }

    // Validate response shape and map snake_case to camelCase
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
      console.error(
        "[stories] Service error code:",
        error.code,
        "Status:",
        error.statusCode
      );
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
