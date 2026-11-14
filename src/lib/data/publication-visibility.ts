import "server-only";

import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import type { DatabasePublicationState, PublicContentTable } from "./publication-visibility-contract";

const CACHE_TTL_MS = 30_000;
const UNKNOWN_CACHE_TTL_MS = 5_000;
type CacheEntry = { state: DatabasePublicationState; expiresAt: number };
const publicationStateCache = new Map<string, CacheEntry>();
const inFlightLookups = new Map<string, Promise<DatabasePublicationState>>();

/**
 * Resolve an authoritative publication state for a known offline/static slug.
 * Callers must first confirm that a fallback record exists; the bounded cache
 * and in-flight map prevent repeated public misses from amplifying service-role reads.
 */
export async function getDatabasePublicationState(
  table: PublicContentTable,
  slug: string,
): Promise<DatabasePublicationState> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return "missing";

  const cacheKey = table + ":" + cleanSlug;
  const cached = publicationStateCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.state;
  const pending = inFlightLookups.get(cacheKey);
  if (pending) return pending;

  const lookup = (async (): Promise<DatabasePublicationState> => {
    try {
      const rows = await supabaseServerAdminRequest<Array<{ published: boolean | null }>>(
        `/rest/v1/${table}?select=published&slug=eq.${encodeURIComponent(cleanSlug)}&limit=1`,
        { cache: "no-store", timeoutMs: 5000, retries: 0 },
      );
      if (!rows.length) return "missing";
      return rows[0].published === true ? "published" : "unpublished";
    } catch (error) {
      console.error(`[publication-visibility] Failed to verify ${table} slug:`, error);
      return "unknown";
    }
  })();

  inFlightLookups.set(cacheKey, lookup);
  try {
    const state = await lookup;
    const ttl = state === "unknown" ? UNKNOWN_CACHE_TTL_MS : CACHE_TTL_MS;
    publicationStateCache.set(cacheKey, { state, expiresAt: Date.now() + ttl });
    return state;
  } finally {
    inFlightLookups.delete(cacheKey);
  }
}
