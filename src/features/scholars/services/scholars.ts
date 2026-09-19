import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { ServiceError } from "@/lib/types/common";
import type { Scholar } from "@/features/scholars/types/scholars";
import { FALLBACK_SCHOLARS } from "@/features/scholars/data/fallback";

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

function hasSupabaseConfig(): boolean {
  const env = getPublicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function isExpectedNetworkFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("fetch failed") ||
    message.includes("EAI_AGAIN") ||
    message.includes("AbortError") ||
    message.includes("This operation was aborted")
  );
}

const CACHE_TTL = 10 * 60 * 1000;
let cachedScholars: { data: Scholar[]; timestamp: number } | null = null;

export async function getAllScholars(): Promise<Scholar[]> {
  if (cachedScholars && Date.now() - cachedScholars.timestamp < CACHE_TTL) {
    return cachedScholars.data;
  }

  if (!hasSupabaseConfig()) {
    cachedScholars = { data: FALLBACK_SCHOLARS, timestamp: Date.now() };
    return FALLBACK_SCHOLARS;
  }

  try {
    const response = await supabaseServerAnonRequest<ScholarRow[]>(
      "/rest/v1/scholars?select=id,slug,name_ar,name_en,bio_ar,bio_en,thumbnail_url,website_url,youtube_url,published,created_at,updated_at,metadata&published=eq.true&limit=100&order=created_at.desc",
      { cache: "force-cache", next: { revalidate: 3600 } },
    );

    if (!Array.isArray(response) || response.length === 0) {
      cachedScholars = { data: FALLBACK_SCHOLARS, timestamp: Date.now() };
      return FALLBACK_SCHOLARS;
    }

    const validated = response.filter(isScholarRow);
    if (validated.length === 0) {
      cachedScholars = { data: FALLBACK_SCHOLARS, timestamp: Date.now() };
      return FALLBACK_SCHOLARS;
    }

    const mapped = validated.map(mapScholarRow);
    cachedScholars = { data: mapped, timestamp: Date.now() };
    return mapped;
  } catch (error) {
    if (!isExpectedNetworkFallback(error) && error instanceof ServiceError) {
      console.error("[scholars] Service error:", error.code, error.statusCode);
    } else if (!isExpectedNetworkFallback(error)) {
      console.error("[scholars] Failed to fetch scholars:", error);
    }
    return FALLBACK_SCHOLARS;
  }
}

export async function getScholarBySlug(slug: string): Promise<Scholar | null> {
  const safeSlug = slug?.trim();
  if (!safeSlug) return null;

  const scholars = await getAllScholars();
  return scholars.find(scholar => scholar.slug === safeSlug) ?? null;
}

export async function searchScholars(query: string): Promise<Scholar[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scholars = await getAllScholars();
  return scholars.filter(scholar =>
    [scholar.nameAr, scholar.nameEn, scholar.slug, scholar.bioAr ?? "", scholar.bioEn ?? ""]
      .some(value => value.toLowerCase().includes(q)),
  );
}

export async function getScholarsByIds(ids: string[]): Promise<Scholar[]> {
  if (ids.length === 0) return [];
  const wanted = new Set(ids);
  return (await getAllScholars()).filter(scholar => wanted.has(scholar.id));
}
