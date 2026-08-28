import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { ServiceError } from "@/lib/types/common";

export interface Scholar {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  bioAr?: string;
  bioEn?: string;
  thumbnailUrl?: string;
  websiteUrl?: string;
  youtubeUrl?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export const FALLBACK_SCHOLARS: Scholar[] = [
  {
    id: "1",
    slug: "ibn-taymiyyah",
    nameAr: "شيخ الإسلام ابن تيمية",
    nameEn: "Ibn Taymiyyah",
    bioAr: "أحد أعظم علماء الإسلام، برع في الفقه والحديث والعقيدة والتفسير. له مؤلفات كثيرة أشهرها مجموع الفتاوى.",
    published: true,
  },
  {
    id: "2",
    slug: "ibn-qayyim",
    nameAr: "ابن القيم الجوزية",
    nameEn: "Ibn Qayyim Al-Jawziyyah",
    bioAr: "تلميذ ابن تيمية النجيب، من أعظم علماء الإسلام في التزكية والسلوك والفقه.",
    published: true,
  },
  {
    id: "3",
    slug: "nawawi",
    nameAr: "الإمام النووي",
    nameEn: "Imam An-Nawawi",
    bioAr: "من أشهر علماء الحديث والفقه الشافعي، صاحب الأربعين النووية وشرح صحيح مسلم.",
    published: true,
  },
  {
    id: "4",
    slug: "ibn-baz",
    nameAr: "الشيخ عبد العزيز بن باز",
    nameEn: "Sheikh Ibn Baz",
    bioAr: "المفتي العام للمملكة العربية السعودية، من أبرز علماء العصر الحديث.",
    published: true,
  },
  {
    id: "5",
    slug: "uthaymin",
    nameAr: "الشيخ محمد بن صالح العثيمين",
    nameEn: "Sheikh Ibn Uthaymin",
    bioAr: "من أبرز علماء المملكة العربية السعودية، له شروحات قيمة في الفقه والعقيدة.",
    published: true,
  },
  {
    id: "6",
    slug: "albani",
    nameAr: "الشيخ محمد ناصر الدين الألباني",
    nameEn: "Sheikh Al-Albani",
    bioAr: "محدث العصر، صحح وضعف آلاف الأحاديث وله جهود عظيمة في خدمة السنة النبوية.",
    published: true,
  },
  {
    id: "7",
    slug: "shaarawi",
    nameAr: "الشيخ محمد متولي الشعراوي",
    nameEn: "Sheikh Al-Shaarawi",
    bioAr: "من أشهر المفسرين المعاصرين، له خواطر في تفسير القرآن الكريم انتشرت في العالم العربي.",
    published: true,
  },
  {
    id: "8",
    slug: "qaradawi",
    nameAr: "الشيخ يوسف القرضاوي",
    nameEn: "Sheikh Al-Qaradawi",
    bioAr: "من أبرز علماء الفقه المعاصر، له اجتهادات كثيرة في القضايا المعاصرة.",
    published: true,
  },
];

interface ScholarRow {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string;
  bio_ar?: string;
  bio_en?: string;
  thumbnail_url?: string;
  website_url?: string;
  youtube_url?: string;
  published?: boolean;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown>;
}

function mapScholarRow(row: ScholarRow): Scholar {
  return {
    id: row.id,
    slug: row.slug,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    bioAr: row.bio_ar,
    bioEn: row.bio_en,
    thumbnailUrl: row.thumbnail_url,
    websiteUrl: row.website_url,
    youtubeUrl: row.youtube_url,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata,
  };
}

function isScholarRow(item: unknown): item is ScholarRow {
  if (!item || typeof item !== "object") return false;
  const row = item as Partial<ScholarRow>;
  return Boolean(row.id && row.slug && row.name_ar && row.name_en);
}

function hasSupabaseConfig() {
  const env = getPublicEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
let cachedScholars: { data: Scholar[]; timestamp: number } | null = null;

function isExpectedNetworkFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("fetch failed") ||
    message.includes("EAI_AGAIN") ||
    message.includes("AbortError") ||
    message.includes("This operation was aborted")
  );
}

export async function getAllScholars(): Promise<Scholar[]> {
  try {
    // Use cache if fresh
    if (cachedScholars && Date.now() - cachedScholars.timestamp < CACHE_TTL) {
      return cachedScholars.data;
    }

    if (!hasSupabaseConfig()) {
      cachedScholars = { data: FALLBACK_SCHOLARS, timestamp: Date.now() };
      return FALLBACK_SCHOLARS;
    }

    const response = await supabaseServerAnonRequest<ScholarRow[]>(
      "/rest/v1/scholars?select=*&published=eq.true&limit=100&order=created_at.desc",
      { cache: "force-cache", next: { revalidate: 3600 } }
    );

    // Type validation
    if (!Array.isArray(response)) {
      console.warn("[scholars] Invalid response type, got:", typeof response);
      cachedScholars = { data: FALLBACK_SCHOLARS, timestamp: Date.now() };
      return FALLBACK_SCHOLARS;
    }

    if (response.length === 0) {
      console.warn("[scholars] Supabase returned empty array, using fallback");
      cachedScholars = { data: FALLBACK_SCHOLARS, timestamp: Date.now() };
      return FALLBACK_SCHOLARS;
    }

    // Validate response shape and map snake_case to camelCase
    const validated = response.every(isScholarRow);

    if (!validated) {
      console.warn("[scholars] Response validation failed, using fallback");
      cachedScholars = { data: FALLBACK_SCHOLARS, timestamp: Date.now() };
      return FALLBACK_SCHOLARS;
    }

    const mapped = response.map(mapScholarRow);
    cachedScholars = { data: mapped, timestamp: Date.now() };
    return mapped;
  } catch (error) {
    if (isExpectedNetworkFallback(error)) {
      return FALLBACK_SCHOLARS;
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[scholars] Failed to fetch from Supabase:", errorMsg);

    if (error instanceof ServiceError) {
      console.error(
        "[scholars] Service error code:",
        error.code,
        "Status:",
        error.statusCode
      );
    }

    return FALLBACK_SCHOLARS;
  }
}

export async function getScholarBySlug(slug: string): Promise<Scholar | null> {
  if (!slug || typeof slug !== "string") return null;

  if (!hasSupabaseConfig()) {
    return FALLBACK_SCHOLARS.find(scholar => scholar.slug === slug) ?? null;
  }

  try {
    const response = await supabaseServerAnonRequest<ScholarRow[]>(
      `/rest/v1/scholars?slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`,
      { cache: "force-cache", next: { revalidate: 3600 } }
    );

    if (Array.isArray(response) && response[0] && isScholarRow(response[0])) {
      return mapScholarRow(response[0]);
    }
  } catch (error) {
    if (isExpectedNetworkFallback(error)) {
      return FALLBACK_SCHOLARS.find(scholar => scholar.slug === slug) ?? null;
    }

    console.error("[scholars] Error fetching by slug:", slug, error);
  }

  return FALLBACK_SCHOLARS.find(scholar => scholar.slug === slug) ?? null;
}

export async function searchScholars(query: string): Promise<Scholar[]> {
  const q = query?.trim().toLowerCase();
  if (!q) return [];

  const scholars = await getAllScholars();
  return scholars.filter(
    s =>
      s.nameAr?.toLowerCase().includes(q) ||
      s.nameEn?.toLowerCase().includes(q) ||
      s.slug?.includes(q)
  );
}

export async function getScholarsByIds(ids: string[]): Promise<Scholar[]> {
  if (!ids || ids.length === 0) return [];
  const scholars = await getAllScholars();
  return scholars.filter(s => ids.includes(s.id));
}
