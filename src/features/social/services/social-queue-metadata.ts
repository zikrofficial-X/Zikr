import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";

type SocialQueueMetadataRow = {
  id: string;
  status: string;
  video_url: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string | null;
};

type SocialQueueMetadataRequest = typeof supabaseServerAdminRequest;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeSocialQueueMetadata(
  current: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const merged = { ...(isRecord(current) ? current : {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (key === "platformDeletions" && isRecord(value)) {
      const existing = isRecord(merged[key]) ? merged[key] as Record<string, unknown> : {};
      const next = { ...existing };
      for (const [platform, result] of Object.entries(value)) {
        const prior = isRecord(existing[platform]) ? existing[platform] as Record<string, unknown> : {};
        const incoming = isRecord(result) ? result : {};
        // A confirmed remote deletion is terminal; a stale failure must not
        // overwrite it after another request has already persisted success.
        if (prior.status === "deleted" && incoming.status !== "deleted") continue;
        next[platform] = { ...prior, ...incoming };
      }
      merged[key] = next;
    } else if (isRecord(value)) {
      const existing = isRecord(merged[key]) ? merged[key] as Record<string, unknown> : {};
      merged[key] = { ...existing, ...value };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

/**
 * Produce a strictly newer row revision for metadata-only compare-and-set writes.
 * PostgREST timestamps supplied by JavaScript have millisecond precision; a
 * second write in the same millisecond must still advance the CAS token.
 */
export function buildNextSocialQueueMetadataUpdatedAt(
  previousUpdatedAt: string | null,
  now: Date = new Date(),
): string {
  return buildNextRowVersionUpdatedAt(previousUpdatedAt, now);
}

/** Build the exact row-version filter used for safe metadata-only queue updates. */
export function buildSocialQueueMetadataCasFilter(
  id: string,
  expectedStatus: string,
  expectedUpdatedAt: string,
  expectedVideoUrl?: string | null,
): string {
  if (!id.trim()) throw new Error("Social queue metadata update requires a queue item ID.");
  if (!expectedStatus.trim()) throw new Error("Social queue metadata update requires an expected status.");
  if (!Number.isFinite(Date.parse(expectedUpdatedAt))) {
    throw new Error("Social queue metadata update requires a valid updated_at timestamp.");
  }
  return [
    `id=eq.${encodeURIComponent(id)}`,
    `status=eq.${encodeURIComponent(expectedStatus)}`,
    ...(expectedVideoUrl === undefined
      ? []
      : [expectedVideoUrl === null
        ? "video_url=is.null"
        : `video_url=eq.${encodeURIComponent(expectedVideoUrl)}`]),
    `updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
  ].join("&");
}

/**
 * Merge a metadata patch into the latest queue row with bounded compare-and-set
 * retries. This prevents worker cleanup and admin remote-deletion writes from
 * replacing each other's platformDeletions, insights, or retention markers.
 */
export async function patchSocialQueueMetadataWithCas(
  input: {
    id: string;
    expectedStatus: string;
    expectedVideoUrl?: string | null;
    patch: Record<string, unknown>;
    maxAttempts?: number;
  },
  request: SocialQueueMetadataRequest = supabaseServerAdminRequest,
): Promise<boolean> {
  const maxAttempts = input.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 5) {
    throw new Error("Social queue metadata update requires between one and five CAS attempts.");
  }
  if (!input.id.trim()) throw new Error("Social queue metadata update requires a queue item ID.");
  if (!input.expectedStatus.trim()) throw new Error("Social queue metadata update requires an expected status.");

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const lookupFilter = [
      `id=eq.${encodeURIComponent(input.id)}`,
      `status=eq.${encodeURIComponent(input.expectedStatus)}`,
      ...(input.expectedVideoUrl === undefined
        ? []
        : [input.expectedVideoUrl === null
          ? "video_url=is.null"
          : `video_url=eq.${encodeURIComponent(input.expectedVideoUrl)}`]),
      "select=id,status,video_url,metadata,updated_at&limit=2",
    ].join("&");
    const rows = await request<SocialQueueMetadataRow[]>(
      `/rest/v1/social_publish_queue?${lookupFilter}`,
    );
    if (!Array.isArray(rows)) {
      throw new Error("Social queue metadata lookup returned an invalid row set.");
    }
    if (rows.length !== 1) return false;

    const row = rows[0];
    if (
      row.status !== input.expectedStatus ||
      (input.expectedVideoUrl !== undefined && row.video_url !== input.expectedVideoUrl) ||
      typeof row.updated_at !== "string" ||
      !Number.isFinite(Date.parse(row.updated_at))
    ) {
      return false;
    }

    const updated = await request<Array<{ id: string }>>(
      `/rest/v1/social_publish_queue?${buildSocialQueueMetadataCasFilter(
        input.id,
        input.expectedStatus,
        row.updated_at,
        input.expectedVideoUrl,
      )}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          metadata: mergeSocialQueueMetadata(row.metadata, input.patch),
          updated_at: buildNextSocialQueueMetadataUpdatedAt(row.updated_at),
        }),
      },
    );
    if (!Array.isArray(updated)) {
      throw new Error("Social queue metadata update returned an invalid row set.");
    }
    if (updated[0]) return true;
  }

  return false;
}
