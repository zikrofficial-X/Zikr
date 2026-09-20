import { supabaseServerAnonRequest } from "@/lib/supabase/server";

export type ContentSource = {
  name: string;
  reference: string | null;
  author: string | null;
  publisher: string | null;
  license: string | null;
  attribution: string | null;
};

export type PublicContentLibraryItem = {
  id: string;
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
    name: String(row.name ?? ""),
    reference: typeof row.reference === "string" ? row.reference : null,
    author: typeof row.author === "string" ? row.author : null,
    publisher: typeof row.publisher === "string" ? row.publisher : null,
    license: typeof row.license === "string" ? row.license : null,
    attribution:
      typeof row.attribution === "string" ? row.attribution : null,
  };
}

function mapItem(row: RawItem): PublicContentLibraryItem {
  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? ""),
    title_ar: String(row.title_ar ?? ""),
    title_en: typeof row.title_en === "string" ? row.title_en : null,
    summary_ar:
      typeof row.summary_ar === "string" ? row.summary_ar : null,
    summary_en:
      typeof row.summary_en === "string" ? row.summary_en : null,
    body_ar: typeof row.body_ar === "string" ? row.body_ar : null,
    body_en: typeof row.body_en === "string" ? row.body_en : null,
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
  "id,slug,title_ar,title_en,summary_ar,summary_en,body_ar,body_en,content_type,category,tags,author,published_at,source_id,content_sources(name,reference,author,publisher,license,attribution)";

export async function getPublicContentLibrary(
  limit = 60,
): Promise<PublicContentLibraryItem[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));

  try {
    const rows = await supabaseServerAnonRequest<RawItem[]>(
      `/rest/v1/content_library?select=${SELECT_LIST}&published=eq.true&review_status=eq.approved&order=published_at.desc&limit=${safeLimit}`,
      { cache: "force-cache", next: { revalidate: 1800 } },
    );

    return rows
      .map(mapItem)
      .filter((item) => item.slug && item.title_ar);
  } catch (error) {
    console.error("[content-library] Failed to load public library:", error);
    return [];
  }
}

export async function getPublicContentBySlug(
  slug: string,
): Promise<PublicContentLibraryItem | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  try {
    const rows = await supabaseServerAnonRequest<RawItem[]>(
      `/rest/v1/content_library?select=${SELECT_LIST}&slug=eq.${encodeURIComponent(cleanSlug)}&published=eq.true&review_status=eq.approved&limit=1`,
      { cache: "force-cache", next: { revalidate: 1800 } },
    );

    return rows[0] ? mapItem(rows[0]) : null;
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
