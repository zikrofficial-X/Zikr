import "server-only";

import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import type { DatabasePublicationState, PublicContentTable } from "./publication-visibility-contract";

/**
 * Read the authoritative row state only after the public published-only lookup
 * succeeded but returned no row. This distinguishes an explicitly unpublished
 * record from a static-only fallback slug without exposing service credentials.
 */
export async function getDatabasePublicationState(
  table: PublicContentTable,
  slug: string,
): Promise<DatabasePublicationState> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return "missing";

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
}
