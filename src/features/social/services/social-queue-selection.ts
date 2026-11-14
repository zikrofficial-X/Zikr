import { isVideoContentType } from "@/features/videos/services/video-publish-approval";
import {
  canAttemptSocialPlatform,
  type SocialPlatform,
} from "@/features/social/services/platform-availability";

const SUPPORTED_SOCIAL_TARGET_PLATFORMS = new Set<SocialPlatform>([
  "facebook",
  "facebook_reels",
  "youtube",
]);

export type StoredSocialTargetPlatformsValidation =
  | { ok: true; platforms: SocialPlatform[] }
  | {
      ok: false;
      reason: "not_array" | "empty" | "too_many" | "unsupported_or_duplicate";
      invalidValues: string[];
    };

/**
 * Database queue rows are runtime data, not trusted TypeScript values. Reject
 * empty, unsupported, duplicate, and malformed target lists before any
 * provider call can be made.
 */
export function validateStoredSocialTargetPlatforms(value: unknown): StoredSocialTargetPlatformsValidation {
  if (!Array.isArray(value)) {
    return { ok: false, reason: "not_array", invalidValues: [] };
  }
  if (value.length === 0) {
    return { ok: false, reason: "empty", invalidValues: [] };
  }
  if (value.length > SUPPORTED_SOCIAL_TARGET_PLATFORMS.size) {
    return { ok: false, reason: "too_many", invalidValues: [] };
  }

  const platforms: SocialPlatform[] = [];
  const invalidValues: string[] = [];
  const seen = new Set<string>();
  for (const candidate of value) {
    if (typeof candidate !== "string" || !SUPPORTED_SOCIAL_TARGET_PLATFORMS.has(candidate as SocialPlatform)) {
      invalidValues.push(typeof candidate === "string" ? candidate.slice(0, 80) : `<${typeof candidate}>`);
      continue;
    }
    if (seen.has(candidate)) {
      invalidValues.push(candidate);
      continue;
    }
    seen.add(candidate);
    platforms.push(candidate as SocialPlatform);
  }

  if (invalidValues.length > 0 || platforms.length !== value.length) {
    return { ok: false, reason: "unsupported_or_duplicate", invalidValues };
  }
  return { ok: true, platforms };
}

export function requireSocialQueueRows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label || "Social queue query"} returned an invalid row set; refusing to report an empty successful batch.`);
  }
  return value as T[];
}

export const SOCIAL_QUEUE_CANDIDATE_SCAN_MAX_ROWS = 5_000;

export type SocialQueuePageScanResult<T> = {
  rows: T[];
  scanned: number;
  truncated: boolean;
};

/**
 * Scan deterministic PostgREST pages until enough publishable candidates are
 * found or the explicit safety cap is reached. Held/terminal rows must not
 * permanently occupy the first bounded query window.
 */
export async function scanSocialQueueCandidatePages<T extends { id: string }>(options: {
  pageSize: number;
  maxRows: number;
  fetchPage: (offset: number, limit: number) => Promise<readonly T[]>;
  hasEnoughCandidates: (rows: readonly T[]) => boolean | Promise<boolean>;
}): Promise<SocialQueuePageScanResult<T>> {
  const { pageSize, maxRows } = options;
  if (
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    !Number.isSafeInteger(maxRows) ||
    maxRows < pageSize
  ) {
    throw new Error("Social queue page scans require positive safe page and row limits.");
  }

  const rowsById = new Map<string, T>();
  let offset = 0;
  let exhausted = false;
  let enough = false;

  while (offset < maxRows) {
    const limit = Math.min(pageSize, maxRows - offset);
    const page = await options.fetchPage(offset, limit);
    if (!Array.isArray(page)) {
      throw new Error("Social queue page query returned an invalid row set.");
    }
    if (page.length > limit) {
      throw new Error("Social queue page query returned more rows than requested.");
    }
    if (page.length === 0) {
      exhausted = true;
      break;
    }

    for (const item of page) {
      if (!item || typeof item.id !== "string" || !item.id.trim()) {
        throw new Error("Social queue page query returned a row without a stable non-empty ID.");
      }
      rowsById.set(item.id, item);
    }

    offset += page.length;
    enough = await options.hasEnoughCandidates([...rowsById.values()]);
    if (enough) break;
    if (page.length < limit) {
      exhausted = true;
      break;
    }
  }

  return {
    rows: [...rowsById.values()],
    scanned: offset,
    truncated: !exhausted && !enough && offset >= maxRows,
  };
}

export type SocialQueueSelectionCandidate = {
  id: string;
  content_type: string;
  target_platforms: unknown;
  metadata: Record<string, unknown> | null;
};

/** Build an atomic queue claim filter that rechecks row version and due time at update time. */
export function buildDueSocialQueueClaimFilter(
  id: string,
  status: string,
  now: string,
  expectedUpdatedAt: string,
): string {
  if (!id.trim()) throw new Error("Social queue claim requires a queue item ID.");
  if (!["queued", "partial", "failed"].includes(status)) {
    throw new Error("Social queue claim requires a retryable queue status.");
  }
  if (!Number.isFinite(Date.parse(now)) || !Number.isFinite(Date.parse(expectedUpdatedAt))) {
    throw new Error("Social queue claim requires valid due-time and updated_at timestamps.");
  }
  return [
    `id=eq.${encodeURIComponent(id)}`,
    `status=eq.${encodeURIComponent(status)}`,
    `updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
    `or=(scheduled_at.is.null,scheduled_at.lte.${encodeURIComponent(now)})`,
  ].join("&");
}

/**
 * Build an atomic lease filter for a queue worker. A worker may advance a row
 * only while both its status and the exact updated_at version still match the
 * claim it received; stale recovery or a newer worker therefore wins safely.
 */
export function buildSocialPublishLeaseFilter(
  id: string,
  expectedStatus: string,
  expectedUpdatedAt: string,
): string {
  if (!id.trim()) throw new Error("Social publish lease filter requires a queue item ID.");
  if (!Number.isFinite(Date.parse(expectedUpdatedAt))) {
    throw new Error("Social publish lease filter requires a valid updated_at timestamp.");
  }
  return [
    `id=eq.${encodeURIComponent(id)}`,
    `status=eq.${encodeURIComponent(expectedStatus)}`,
    `updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`,
  ].join("&");
}

/** Merge bounded query pages while preserving priority and removing duplicate queue IDs. */
export function mergeUniqueSocialPublishCandidates<
  const Batches extends readonly (readonly { id: string }[])[]
>(
  ...batches: Batches
): Array<Batches[number][number]> {
  const byId = new Map<string, Batches[number][number]>();
  for (const batch of batches) {
    for (const item of batch) {
      if (item && typeof item.id === "string" && item.id.trim()) byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

export function selectEligibleSocialPublishItems<T extends SocialQueueSelectionCandidate>(
  candidates: readonly T[],
  options: {
    enabledPlatforms: readonly SocialPlatform[];
    approvedVideoQueueItemIds: ReadonlySet<string>;
    maxAttemptsFor: (metadata: Record<string, unknown> | null) => number;
    limit: number;
  },
): T[] {
  const limit = Math.max(0, Math.floor(options.limit));
  if (limit === 0) return [];

  const eligible: T[] = [];
  for (const item of candidates) {
    const targetValidation = validateStoredSocialTargetPlatforms(item.target_platforms);
    if (!targetValidation.ok) {
      const validationMetadata = item.metadata?.targetPlatformsValidation;
      const alreadyQuarantined = Boolean(
        validationMetadata &&
        typeof validationMetadata === "object" &&
        !Array.isArray(validationMetadata) &&
        (validationMetadata as Record<string, unknown>).status === "blocked",
      );
      if (!alreadyQuarantined) eligible.push(item);
      continue;
    }
    if (item.metadata?.sourceMediaMissing === true) continue;
    const maxAttempts = options.maxAttemptsFor(item.metadata);
    const hasRunnableTarget = targetValidation.platforms.some((platform) =>
      canAttemptSocialPlatform({
        platform,
        enabledPlatforms: options.enabledPlatforms,
        metadata: item.metadata,
        maxAttempts,
      }),
    );
    if (!hasRunnableTarget) continue;
    if (
      isVideoContentType(item.content_type) &&
      !options.approvedVideoQueueItemIds.has(item.id)
    ) {
      continue;
    }

    eligible.push(item);
  }

  // Reserve one slot for an eligible non-video post when video retries fill
  // the front of the queue. This prevents written Facebook posts from being
  // perpetually deferred behind a recurring Reels cooldown backlog.
  const firstNonVideoIndex = eligible.findIndex(
    (item) => !isVideoContentType(item.content_type),
  );
  if (firstNonVideoIndex >= limit) {
    const [nonVideoItem] = eligible.splice(firstNonVideoIndex, 1);
    if (nonVideoItem) eligible.unshift(nonVideoItem);
  }

  return eligible.slice(0, limit);
}

const VIDEO_SOCIAL_QUEUE_MUTABLE_STATUSES = new Set(["queued", "failed", "partial", "published"]);

/**
 * Compare-and-set filter for the video worker's social queue reconciliation.
 * Processing rows are intentionally excluded: changing their updated_at would
 * invalidate an active publisher lease and could duplicate remote posts.
 */
export function buildVideoSocialQueueUpdateFilter(
  id: string,
  status: string,
  updatedAt: string | null | undefined,
): string | null {
  const normalizedId = id.trim();
  const revision = updatedAt?.trim();
  if (
    !normalizedId ||
    !VIDEO_SOCIAL_QUEUE_MUTABLE_STATUSES.has(status) ||
    !revision ||
    !Number.isFinite(Date.parse(revision))
  ) {
    return null;
  }
  return [
    "id=eq." + encodeURIComponent(normalizedId),
    "status=eq." + encodeURIComponent(status),
    "updated_at=eq." + encodeURIComponent(revision),
  ].join("&");
}
