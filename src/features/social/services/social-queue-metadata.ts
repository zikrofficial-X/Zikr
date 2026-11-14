import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { buildNextRowVersionUpdatedAt } from "@/lib/supabase/row-version";
import { isSocialPlatformDeletionCurrent } from "@/features/social/services/social-deletion-visibility";

type SocialQueueMetadataRow = {
  id: string;
  status: string;
  video_url: string | null;
  metadata: Record<string, unknown> | null;
  published_at?: string | null;
  updated_at: string | null;
};

type SocialQueueMetadataRequest = typeof supabaseServerAdminRequest;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function successfulPlatformRemoteId(
  metadata: Record<string, unknown> | null | undefined,
  platform: string,
): string | null {
  const values = metadata?.platformResults;
  const candidate = Array.isArray(values)
    ? values.find(value => isRecord(value) && value.platform === platform)
    : isRecord(values)
      ? values[platform]
      : null;
  if (!isRecord(candidate) || candidate.ok !== true || typeof candidate.remoteId !== "string") {
    return null;
  }
  const remoteId = candidate.remoteId.trim();
  return remoteId || null;
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
        // A confirmed remote deletion is terminal for that exact provider ID.
        // Only a new deletion claim for a different, verified remote ID may replace it.
        const priorRemoteId = typeof prior.remoteId === "string" ? prior.remoteId.trim() : "";
        const incomingRemoteId = typeof incoming.remoteId === "string" ? incoming.remoteId.trim() : "";
        const isNewRemoteDeletionClaim =
          prior.status === "deleted" &&
          incoming.status === "deleting" &&
          Boolean(incomingRemoteId) &&
          incomingRemoteId !== priorRemoteId;
        if (prior.status === "deleted" && incoming.status !== "deleted" && !isNewRemoteDeletionClaim) continue;
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
 * Atomically reserve one remote platform deletion before making the provider call.
 * A competing request sees "deleting" or loses the row-version CAS and must not
 * send a second destructive request to the provider.
 */
export const SOCIAL_QUEUE_PLATFORM_DELETION_CLAIM_LEASE_MS = 10 * 60 * 1000;

export type SocialQueuePlatformDeletionClaim =
  | "claimed"
  | "already_deleted"
  | "in_progress"
  | "stale";

export async function claimSocialQueuePlatformDeletion(
  input: {
    id: string;
    expectedStatus: string;
    expectedVideoUrl: string | null;
    expectedRemoteId: string;
    platform: string;
    now?: Date;
  },
  request: SocialQueueMetadataRequest = supabaseServerAdminRequest,
): Promise<SocialQueuePlatformDeletionClaim> {
  if (!input.id.trim()) throw new Error("Remote social deletion requires a queue item ID.");
  if (!input.expectedStatus.trim()) throw new Error("Remote social deletion requires an expected queue status.");
  if (!input.platform.trim()) throw new Error("Remote social deletion requires a platform.");
  if (!input.expectedRemoteId.trim()) throw new Error("Remote social deletion requires the exact successful provider ID.");
  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) throw new Error("Remote social deletion requires a valid claim time.");

  const lookupFilter = [
    `id=eq.${encodeURIComponent(input.id)}`,
    `status=eq.${encodeURIComponent(input.expectedStatus)}`,
    input.expectedVideoUrl === null
      ? "video_url=is.null"
      : `video_url=eq.${encodeURIComponent(input.expectedVideoUrl)}`,
    "select=id,status,video_url,metadata,published_at,updated_at&limit=2",
  ].join("&");
  const rows = await request<SocialQueueMetadataRow[]>(
    `/rest/v1/social_publish_queue?${lookupFilter}`,
  );
  if (!Array.isArray(rows)) {
    throw new Error("Remote social deletion claim lookup returned an invalid row set.");
  }
  if (rows.length !== 1) return "stale";

  const row = rows[0];
  if (
    row.status !== input.expectedStatus ||
    row.video_url !== input.expectedVideoUrl ||
    typeof row.updated_at !== "string" ||
    !Number.isFinite(Date.parse(row.updated_at))
  ) {
    return "stale";
  }

  const metadata = isRecord(row.metadata) ? row.metadata : {};
  if (successfulPlatformRemoteId(metadata, input.platform) !== input.expectedRemoteId.trim()) {
    return "stale";
  }
  const deletions = isRecord(metadata.platformDeletions) ? metadata.platformDeletions : {};
  const previous = isRecord(deletions[input.platform])
    ? deletions[input.platform] as Record<string, unknown>
    : {};
  if (isSocialPlatformDeletionCurrent(previous, input.expectedRemoteId, row.published_at)) {
    return "already_deleted";
  }
  if (previous.status === "deleting") {
    const previousAttemptAt = typeof previous.attemptedAt === "string"
      ? Date.parse(previous.attemptedAt)
      : Number.NaN;
    const leaseExpired = Number.isFinite(previousAttemptAt) &&
      now.getTime() - previousAttemptAt >= SOCIAL_QUEUE_PLATFORM_DELETION_CLAIM_LEASE_MS;
    // Invalid/missing timestamps fail closed; only a clearly expired lease is reclaimable.
    if (!leaseExpired) return "in_progress";
  }

  const attemptedAt = now.toISOString();
  const nextMetadata = mergeSocialQueueMetadata(row.metadata, {
    platformDeletions: {
      [input.platform]: { status: "deleting", remoteId: input.expectedRemoteId.trim(), attemptedAt },
    },
  });
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
        metadata: nextMetadata,
        updated_at: buildNextSocialQueueMetadataUpdatedAt(row.updated_at, now),
      }),
    },
  );
  if (!Array.isArray(updated)) {
    throw new Error("Remote social deletion claim update returned an invalid row set.");
  }
  return updated.some((item) => item.id === input.id) ? "claimed" : "stale";
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
    expectedPlatformRemoteId?: { platform: string; remoteId: string | null };
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
  if (input.expectedPlatformRemoteId && !input.expectedPlatformRemoteId.platform.trim()) {
    throw new Error("Social queue metadata update requires an expected platform.");
  }

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
    if (input.expectedPlatformRemoteId) {
      const expectedRemoteId = input.expectedPlatformRemoteId.remoteId?.trim() || null;
      if (successfulPlatformRemoteId(row.metadata, input.expectedPlatformRemoteId.platform) !== expectedRemoteId) {
        return false;
      }
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
