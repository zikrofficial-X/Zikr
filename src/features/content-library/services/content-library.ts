import { supabaseServerAnonRequest } from "@/lib/supabase/server";

export type ContentSource = {
  nameAr: string;
  nameEn: string;
  reference: string | null;
  author: string | null;
  publisher: string | null;
  license: string | null;
  attribution: string | null;
};

export type PublicContentLibraryItem = {
  id: string;
  title: string;
  summary: string | null;
  body: string | null;
  slug: string;
  title_ar: string;
  title_en: string | null;
  summary_ar: string | null;
  summary_en: string | null;
  body_ar: string | null;
  body_en: string | null;
  content_type: string;
  category: string;
  tags: string[] | null;
  author: string | null;
  published_at: string | null;
  source_id: string | null;
  content_sources: ContentSource | ContentSource[] | null;
};

type RawItem = Record<string, unknown>;

function mapSource(value: unknown): ContentSource | ContentSource[] | null {
  if (Array.isArray(value)) {
    return value.map((row) => mapSource(row)).flatMap((item) =>
      item ? (Array.isArray(item) ? item : [item]) : [],
    );
  }

  if (!value || typeof value !== "object") return null;
  const row = value as RawItem;

  return {
    nameAr: String(row.name_ar ?? ""),
    nameEn: String(row.name_en ?? row.name_ar ?? ""),
    reference: typeof row.url === "string" ? row.url : null,
    author: typeof row.author === "string" ? row.author : null,
    publisher: null,
    license: typeof row.license === "string" ? row.license : null,
    attribution:
      typeof row.attribution === "string" ? row.attribution : null,
  };
}

function mapItem(row: RawItem): PublicContentLibraryItem {
  const titleAr = String(row.title_ar ?? "");
  const titleEn = typeof row.title_en === "string" ? row.title_en : null;
  const summaryAr = typeof row.summary_ar === "string" ? row.summary_ar : null;
  const summaryEn = typeof row.summary_en === "string" ? row.summary_en : null;
  const bodyAr = typeof row.body_ar === "string" ? row.body_ar : null;
  const bodyEn = typeof row.body_en === "string" ? row.body_en : null;

  return {
    id: String(row.id ?? ""),
    title: titleAr,
    summary: summaryAr,
    body: bodyAr,
    slug: String(row.slug ?? ""),
    title_ar: String(row.title_ar ?? ""),
    title_en: titleEn,
    summary_ar: summaryAr,
    summary_en: summaryEn,
    body_ar: bodyAr,
    body_en: bodyEn,
    content_type: String(row.content_type ?? ""),
    category: String(row.category ?? ""),
    tags: Array.isArray(row.tags)
      ? row.tags.filter((tag): tag is string => typeof tag === "string")
      : null,
    author: typeof row.author === "string" ? row.author : null,
    published_at:
      typeof row.published_at === "string" ? row.published_at : null,
    source_id: typeof row.source_id === "string" ? row.source_id : null,
    content_sources: mapSource(row.content_sources),
  };
}

const SELECT_LIST =
  "id,slug,title_ar,title_en,summary_ar,summary_en,body_ar,body_en,content_type,category,tags,author,published_at,source_id,content_sources(name_ar,name_en,url,license,attribution,authority_level,notes,verified)";

export async function getPublicContentLibrary(
  limit = 60,
  locale: "ar" | "en" = "ar",
): Promise<PublicContentLibraryItem[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));

  try {
    const rows = await supabaseServerAnonRequest<RawItem[]>(
      `/rest/v1/content_library?select=${SELECT_LIST}&published=eq.true&review_status=eq.approved&order=published_at.desc&limit=${safeLimit}`,
      { cache: "force-cache", next: { revalidate: 1800 } },
    );

    return rows
      .map(mapItem)
      .map((item) => ({
        ...item,
        title: locale === "en" ? (item.title_en ?? "") : item.title_ar,
        summary: locale === "en" ? item.summary_en ?? null : item.summary_ar,
        body: locale === "en" ? item.body_en ?? null : item.body_ar,
      }))
      .filter((item) => item.slug && item.title);
  } catch (error) {
    console.error("[content-library] Failed to load public library:", error);
    return [];
  }
}

export async function getPublicContentBySlug(
  slug: string,
  locale: "ar" | "en" = "ar",
): Promise<PublicContentLibraryItem | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  try {
    const rows = await supabaseServerAnonRequest<RawItem[]>(
      `/rest/v1/content_library?select=${SELECT_LIST}&slug=eq.${encodeURIComponent(cleanSlug)}&published=eq.true&review_status=eq.approved&limit=1`,
      { cache: "force-cache", next: { revalidate: 1800 } },
    );

    if (!rows[0]) return null;
    const item = mapItem(rows[0]);
    return {
      ...item,
      title: locale === "en" ? (item.title_en ?? "") : item.title_ar,
      summary: locale === "en" ? item.summary_en ?? null : item.summary_ar,
      body: locale === "en" ? item.body_en ?? null : item.body_ar,
    };
  } catch (error) {
    console.error("[content-library] Failed to load content item:", error);
    return null;
  }
}

export function getPrimaryContentSource(
  sources: PublicContentLibraryItem["content_sources"],
): ContentSource | null {
  if (Array.isArray(sources)) return sources[0] ?? null;
  return sources;
}
