import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { getPublicEnv } from "@/lib/env";
import { ServiceError } from "@/lib/types/common";
import type { Scholar } from "@/features/scholars/types/scholars";
import { FALLBACK_SCHOLARS } from "@/features/scholars/data/fallback";

export async function getAllScholars(): Promise<Scholar[]> {
  try {
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
    if (isExpectedNetworkFallback(error)) return FALLBACK_SCHOLARS;

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

