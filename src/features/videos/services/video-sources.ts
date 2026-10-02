import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { getServerEnv } from "@/lib/env";
import { PRIMARY_STORY_SOURCES } from "@/features/stories/data/fallback";

export type VideoSourceCategory =
  "quran" | "hadith" | "story" | "dua" | "adhkar";

export type VideoSource = {
  id: string;
  category: VideoSourceCategory;
  title: string;
  text: string;
  sourceLabel: string;
  sourceUrl: string;
  audioUrl?: string | null;
  grade?: string | null;
  additionalSources?: Array<{ label: string; url: string }>;
};

type QuranRow = {
  surah_id: number;
  ayah_number: number;
  text_ar: string;
  text_uthmani: string | null;
};

type HadithRow = {
  id: string;
  hadith_number: string | null;
  text_ar: string;
  grade_ar: string | null;
  ref: string | null;
  published: boolean;
};

type DuaRow = {
  id: string;
  slug: string;
  title_ar: string;
  text_ar: string;
  occasion_ar: string | null;
  source_ar: string | null;
  published: boolean;
};

type StoryRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  published: boolean;
};

const QURAN_BASE = "https://quran.com";
const HADITH_BASE = "https://sunnah.com";
const SITE_BASE = getServerEnv().NEXT_PUBLIC_SITE_URL;

function clean(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

async function quranSource(
  surahId: number,
  ayahNumber: number
): Promise<VideoSource | null> {
  if (
    !Number.isInteger(surahId) ||
    surahId < 1 ||
    surahId > 114 ||
    !Number.isInteger(ayahNumber) ||
    ayahNumber < 1
  )
    return null;
  const rows = await supabaseServerAdminRequest<QuranRow[]>(
    `/rest/v1/quran_ayahs?surah_id=eq.${surahId}&ayah_number=eq.${ayahNumber}&select=surah_id,ayah_number,text_ar,text_uthmani&limit=1`
  );
  const row = rows?.[0];
  const text = row?.text_uthmani || row?.text_ar;
  if (!row || !clean(text)) return null;
  const nameRows = await supabaseServerAdminRequest<Array<{ name_ar: string }>>(
    `/rest/v1/quran_surahs?id=eq.${surahId}&select=name_ar&limit=1`
  );
  const surahName = nameRows?.[0]?.name_ar || `السورة ${surahId}`;
  return {
    id: `quran:${surahId}:${ayahNumber}`,
    category: "quran",
    title: `آية من سورة ${surahName}`,
    text,
    sourceLabel: `القرآن الكريم — سورة ${surahName}، الآية ${ayahNumber}`,
    sourceUrl: `${QURAN_BASE}/${surahId}/${ayahNumber}`,
    audioUrl: null,
  };
}

async function hadithSource(
  id: string,
  category: "hadith" | "adhkar" = "hadith"
): Promise<VideoSource | null> {
  const rows = await supabaseServerAdminRequest<HadithRow[]>(
    `/rest/v1/hadiths?id=eq.${encodeURIComponent(id)}&published=eq.true&select=id,hadith_number,text_ar,grade_ar,ref,published&limit=1`
  );
  const row = rows?.[0];
  if (!row || !clean(row.text_ar) || !clean(row.grade_ar)) return null;
  if (
    category === "adhkar" &&
    !/(ذِكْر|ذِكْرُ|ذِكْرَ|اذْكُر|سُبْحَانَ|الْحَمْدُ لِلَّه|لَا إِلَهَ إِلَّا اللَّه|أَذْكَار|الاستغفار|الاستغفار)/u.test(
      row.text_ar
    )
  )
    return null;
  if (row.text_ar.length > 360) return null;
  const number = clean(row.hadith_number);
  const reference =
    clean(row.ref) || (number ? `رقم ${number}` : "مرجع الحديث في مكتبة ذِكر");
  return {
    id: row.id,
    category,
    title:
      category === "adhkar"
        ? `ذكر مأثور — ${reference}`
        : `حديث منشور — ${reference}`,
    text: row.text_ar,
    sourceLabel: `الحديث الشريف — ${reference} — الدرجة المسجلة: ${clean(row.grade_ar)}`,
    sourceUrl: HADITH_BASE,
    grade: row.grade_ar,
  };
}

async function duaSource(id: string): Promise<VideoSource | null> {
  const rows = await supabaseServerAdminRequest<DuaRow[]>(
    `/rest/v1/duas?id=eq.${encodeURIComponent(id)}&published=eq.true&select=id,slug,title_ar,text_ar,occasion_ar,source_ar,published&limit=1`
  );
  const row = rows?.[0];
  if (
    !row ||
    !clean(row.text_ar) ||
    row.text_ar.length > 360 ||
    !clean(row.source_ar)
  )
    return null;
  return {
    id: row.id,
    category: "dua",
    title: row.title_ar,
    text: row.text_ar,
    sourceLabel: clean(row.source_ar),
    sourceUrl: `${SITE_BASE}/dua/${encodeURIComponent(row.slug)}`,
  };
}

async function storySource(slug: string): Promise<VideoSource | null> {
  const sources = PRIMARY_STORY_SOURCES[slug] ?? [];
  if (!sources.length) return null;
  let rows: StoryRow[] | null = null;
  try {
    rows = await supabaseServerAdminRequest<StoryRow[]>(
      `/rest/v1/stories?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=id,slug,title,summary,content,published&limit=1`
    );
  } catch {
    rows = await supabaseServerAdminRequest<StoryRow[]>(
      `/rest/v1/stories?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=id,slug,title,content,published&limit=1`
    );
  }
  const story = rows?.[0];
  const text = clean(story?.summary || story?.content);
  const primary = sources[0];
  if (!story || !text || text.length > 360 || !primary?.url || !primary.label)
    return null;
  return {
    id: `story:${story.slug}`,
    category: "story",
    title: story.title,
    text,
    sourceLabel: primary.label,
    sourceUrl: primary.url,
    additionalSources: sources
      .slice(1)
      .map(item => ({ label: item.label, url: item.url })),
  };
}

export async function resolveVideoSource(
  category: string,
  sourceId: string
): Promise<VideoSource | null> {
  if (!sourceId) return null;
  if (category === "quran") {
    const match = sourceId.match(/^quran:(\d+):(\d+)$/);
    return match ? quranSource(Number(match[1]), Number(match[2])) : null;
  }
  if (category === "hadith" || category === "adhkar") {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sourceId)) {
      return null;
    }
    return hadithSource(sourceId, category);
  }
  if (category === "dua") return duaSource(sourceId);
  if (category === "story" && sourceId.startsWith("story:"))
    return storySource(sourceId.slice("story:".length));
  return null;
}

export async function listVideoSources(
  category: string
): Promise<VideoSource[]> {
  if (category === "quran") return [];
  if (category === "hadith" || category === "adhkar") {
    const rows = await supabaseServerAdminRequest<HadithRow[]>(
      "/rest/v1/hadiths?published=eq.true&grade_ar=not.is.null&select=id,hadith_number,text_ar,grade_ar,ref,published&order=created_at.desc&limit=200"
    );
    return (rows ?? [])
      .filter(
        row =>
          clean(row.text_ar).length > 0 &&
          row.text_ar.length <= 360 &&
          clean(row.grade_ar).length > 0
      )
      .filter(
        row =>
          category !== "adhkar" ||
          /(ذِكْر|ذِكْرُ|ذِكْرَ|اذْكُر|سُبْحَانَ|الْحَمْدُ لِلَّه|لَا إِلَهُ إِلَّا اللَّه|أَذْكَار|الاستغفار)/u.test(
            row.text_ar
          )
      )
      .slice(0, 60)
      .map(row => {
        const number = clean(row.hadith_number);
        const reference =
          clean(row.ref) ||
          (number ? `رقم ${number}` : "مرجع الحديث في مكتبة ذِكر");
        return {
          id: row.id,
          category: category as "hadith" | "adhkar",
          title:
            category === "adhkar"
              ? `ذكر مأثور — ${reference}`
              : `حديث منشور — ${reference}`,
          text: row.text_ar,
          sourceLabel: `الحديث الشريف — ${reference} — الدرجة المسجلة: ${clean(row.grade_ar)}`,
          sourceUrl: HADITH_BASE,
          grade: row.grade_ar,
        };
      });
  }
  if (category === "dua") {
    const rows = await supabaseServerAdminRequest<DuaRow[]>(
      "/rest/v1/duas?published=eq.true&source_ar=not.is.null&select=id,slug,title_ar,text_ar,occasion_ar,source_ar,published&order=created_at.desc&limit=60"
    );
    return (rows ?? [])
      .filter(
        row =>
          clean(row.text_ar).length > 0 &&
          clean(row.source_ar).length > 0 &&
          row.text_ar.length <= 360
      )
      .map(row => ({
        id: row.id,
        category: "dua" as const,
        title: row.title_ar,
        text: row.text_ar,
        sourceLabel: row.source_ar!,
        sourceUrl: `${SITE_BASE}/dua/${encodeURIComponent(row.slug)}`,
      }));
  }
  if (category === "story") {
    let stories: StoryRow[] | null = null;
    try {
      stories = await supabaseServerAdminRequest<StoryRow[]>(
        "/rest/v1/stories?published=eq.true&select=id,slug,title,summary,content,published&order=created_at.desc&limit=100"
      );
    } catch {
      stories = await supabaseServerAdminRequest<StoryRow[]>(
        "/rest/v1/stories?published=eq.true&select=id,slug,title,content,published&order=created_at.desc&limit=100"
      );
    }
    return stories
      ?.filter(
        story =>
          story.published &&
          (story.summary || story.content) &&
          PRIMARY_STORY_SOURCES[story.slug]?.length
      )
      .map(story => ({
        story,
        sources: PRIMARY_STORY_SOURCES[story.slug],
        primary: PRIMARY_STORY_SOURCES[story.slug][0],
      }))
      .filter(({ primary }) => Boolean(primary.url && primary.label))
      .map(({ story, sources, primary }) => ({
        id: `story:${story.slug}`,
        category: "story" as const,
        title: story.title,
        text: clean(story.summary || story.content),
        sourceLabel: primary.label,
        sourceUrl: primary.url,
        additionalSources: sources
          .slice(1)
          .map(item => ({ label: item.label, url: item.url })),
      }))
      .filter(item => item.text.length > 0 && item.text.length <= 360);
  }
  return [];
}
