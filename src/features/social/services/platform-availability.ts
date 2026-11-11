export type SocialPlatform = "facebook" | "facebook_reels" | "youtube";

export type SocialPlatformEnvironment = Record<string, string | undefined>;

export type SocialPlatformMetadata = {
  platformResults?: unknown;
  platformAttempts?: unknown;
  authBlocked?: unknown;
  authBlockedPlatforms?: unknown;
  permanentFailure?: unknown;
  permanentFailurePlatforms?: unknown;
  approvalDeferredPlatforms?: unknown;
  unavailablePlatforms?: unknown;
  sourceMediaMissing?: unknown;
  attempts?: unknown;
} | null | undefined;

export type RequestedSocialPlatformsResult =
  | { ok: true; platforms: SocialPlatform[] }
  | { ok: false; error: string };

/**
 * Omitted/empty platform lists intentionally mean "all eligible targets".
 * A malformed or unsupported non-empty list must never silently widen a
 * destructive or publishing action to every platform.
 */
export function parseRequestedSocialPlatforms(value: unknown): RequestedSocialPlatformsResult {
  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    return { ok: true, platforms: [] };
  }
  if (!Array.isArray(value)) {
    return { ok: false, error: "A platform list must be an array." };
  }
  const supported = new Set<SocialPlatform>(["facebook", "facebook_reels", "youtube"]);
  if (value.some(platform => typeof platform !== "string" || !supported.has(platform as SocialPlatform))) {
    return { ok: false, error: "The platform list contains an unsupported target." };
  }
  return { ok: true, platforms: [...new Set(value as SocialPlatform[])] };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Normalize both the current keyed object and legacy array-shaped result ledger. */
export function normalizeSocialPlatformResults(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) {
    const entries: Array<[string, unknown]> = [];
    for (const item of value) {
      const row = asRecord(item);
      if (row && typeof row.platform === "string" && row.platform.trim()) {
        entries.push([row.platform, row]);
      }
    }
    return Object.fromEntries(entries);
  }
  return asRecord(value) ?? {};
}

function metadataPlatforms(value: unknown): SocialPlatform[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (platform): platform is SocialPlatform =>
      platform === "facebook" || platform === "facebook_reels" || platform === "youtube",
  );
}

export function getEnabledSocialPlatforms(env: SocialPlatformEnvironment): SocialPlatform[] {
  const enabled: SocialPlatform[] = [];
  if (env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === "true") {
    enabled.push("facebook", "facebook_reels");
  }
  if (env.SOCIAL_PUBLISH_YOUTUBE_ENABLED === "true") enabled.push("youtube");
  return enabled;
}

function hasSuccessfulDelivery(value: unknown): boolean {
  const result = asRecord(value);
  return result?.ok === true && typeof result.remoteId === "string" && result.remoteId.trim().length > 0;
}

function isAuthBlocked(platform: SocialPlatform, error: unknown): boolean {
  if (!platform.startsWith("facebook") || typeof error !== "string") return false;
  const value = error.toLowerCase();
  return value.includes("access token") || value.includes("session has expired") ||
    value.includes("oauth") || value.includes("reauthorization_required") ||
    value.includes("reconnect the page");
}

export function isPermanentSocialFailure(error: unknown): boolean {
  if (typeof error !== "string") return false;
  return /http\s+422|unprocessable entity|source media unavailable|no supported target|requires video_url|requires an absolute video media url|requires an http\(s\) video media url|youtube watch\/embed|oauth|access token|publishing is disabled|not configured|human qa approval/i.test(error);
}

export function isAmbiguousProviderOutcome(error: unknown): boolean {
  if (typeof error !== "string") return false;
  return /http\s+(?:408|425|500|502|503|504)\b|\b(?:aborterror|fetch failed|und_err_socket|socket hang up|econnreset|etimedout|econnaborted|network error|timeout|timed out)\b/i.test(error);
}

export function getManualReconciliationPlatforms(metadata: SocialPlatformMetadata): SocialPlatform[] {
  if (metadata?.sourceMediaMissing === true) return [];
  const results = normalizeSocialPlatformResults(metadata?.platformResults);
  const supported: readonly SocialPlatform[] = ["facebook", "facebook_reels", "youtube"];
  return supported.filter(
    (platform) => asRecord(results[platform])?.requiresReconciliation === true,
  );
}

export function canAttemptSocialPlatform(input: {
  platform: SocialPlatform;
  enabledPlatforms: readonly SocialPlatform[];
  metadata: SocialPlatformMetadata;
  maxAttempts: number;
}): boolean {
  const { platform, enabledPlatforms, metadata, maxAttempts } = input;
  if (metadata?.sourceMediaMissing === true) return false;
  if (!enabledPlatforms.includes(platform)) return false;
  const rawResults = metadata?.platformResults;
  const hasPlatformResults = rawResults !== null && typeof rawResults === "object";
  const results = normalizeSocialPlatformResults(rawResults);
  const previous = asRecord(results[platform]);
  if (hasSuccessfulDelivery(previous)) return false;
  if (getManualReconciliationPlatforms(metadata).includes(platform)) return false;
  if (metadataPlatforms(metadata?.approvalDeferredPlatforms).includes(platform)) return false;

  const authBlockedPlatforms = metadataPlatforms(metadata?.authBlockedPlatforms);
  const permanentFailurePlatforms = metadataPlatforms(metadata?.permanentFailurePlatforms);
  if (authBlockedPlatforms.includes(platform) || permanentFailurePlatforms.includes(platform)) return false;
  if (!Array.isArray(metadata?.permanentFailurePlatforms) && metadata?.permanentFailure === true) return false;

  // Legacy global authBlocked was emitted only by the Facebook adapter. It must
  // not prevent an independent YouTube target from being published.
  const hasFacebookResult = Object.keys(results).some((target) => target.startsWith("facebook"));
  if (!hasFacebookResult && authBlockedPlatforms.length === 0 &&
      metadata?.authBlocked === true && platform.startsWith("facebook")) return false;
  if (isAuthBlocked(platform, previous?.error) || isPermanentSocialFailure(previous?.error)) return false;

  const attempts = asRecord(metadata?.platformAttempts);
  const legacyAttempts = Number(metadata?.attempts ?? 0);
  const fallbackAttempts = !hasPlatformResults && !(metadata?.authBlocked === true && platform === "youtube") ? legacyAttempts : 0;
  const currentAttempts = Number(attempts?.[platform] ?? fallbackAttempts);
  return Number.isFinite(currentAttempts) && currentAttempts < Math.max(1, maxAttempts);
}

export function getUnavailableSocialPlatforms(
  targets: readonly SocialPlatform[],
  enabledPlatforms: readonly SocialPlatform[],
): SocialPlatform[] {
  return targets.filter(platform => !enabledPlatforms.includes(platform));
}

/**
 * Return only targets that an administrator may safely requeue. Manual
 * reconciliation can override an ambiguous provider outcome after an explicit
 * no-remote-publication confirmation, but it must never erase a confirmed
 * permanent failure such as an HTTP 422 media rejection.
 */
export function getRetryableSocialPlatforms(
  targets: readonly string[],
  metadata: SocialPlatformMetadata,
  allowAmbiguous = false,
): SocialPlatform[] {
  if (metadata?.sourceMediaMissing === true) return [];
  const results = normalizeSocialPlatformResults(metadata?.platformResults);
  const authBlockedPlatforms = metadataPlatforms(metadata?.authBlockedPlatforms);
  const permanentFailurePlatforms = metadataPlatforms(metadata?.permanentFailurePlatforms);
  const approvalDeferredPlatforms = metadataPlatforms(metadata?.approvalDeferredPlatforms);
  const hasPermanentFailureList = Array.isArray(metadata?.permanentFailurePlatforms);
  const manualReconciliation = new Set(getManualReconciliationPlatforms(metadata));
  const hasFacebookResult = Object.keys(results).some((target) => target.startsWith("facebook"));
  const supported: readonly SocialPlatform[] = ["facebook", "facebook_reels", "youtube"];

  return targets.filter((target): target is SocialPlatform => {
    if (!supported.includes(target as SocialPlatform)) return false;
    const platform = target as SocialPlatform;
    const previous = asRecord(results[platform]);
    if (hasSuccessfulDelivery(previous)) return false;
    if (
      authBlockedPlatforms.includes(platform) ||
      permanentFailurePlatforms.includes(platform) ||
      approvalDeferredPlatforms.includes(platform)
    ) return false;
    if (!hasPermanentFailureList && metadata?.permanentFailure === true) return false;
    if (isAuthBlocked(platform, previous?.error) || isPermanentSocialFailure(previous?.error)) return false;
    if (!allowAmbiguous && manualReconciliation.has(platform)) return false;
    // A legacy global Facebook auth flag blocks Facebook only when there is
    // no per-platform Facebook result to identify the affected target.
    if (!hasFacebookResult && authBlockedPlatforms.length === 0 &&
        metadata?.authBlocked === true && platform.startsWith("facebook")) return false;
    return true;
  });
}

export type MissingMediaQueueRecoveryItem = {
  status: string;
  target_platforms: string[] | null;
  metadata: Record<string, unknown> | null;
};

export type MissingMediaQueueRecoveryPatch = {
  status: "queued";
  video_url: string;
  scheduled_at: string;
  published_at: null;
  error_message: null;
  updated_at: string;
  metadata: Record<string, unknown>;
};

/**
 * Release a held Facebook Reels target only after a verified Cloudinary render
 * replaces the missing source. Successful provider IDs on other platforms are
 * preserved; ambiguous or auth-blocked outcomes remain held for manual review.
 */
export function buildMissingMediaQueueRecoveryPatch(input: {
  item: MissingMediaQueueRecoveryItem;
  videoUrl: string;
  now: string;
}): MissingMediaQueueRecoveryPatch | null {
  const { item, videoUrl, now } = input;
  const metadata = item.metadata ?? {};
  if (metadata.sourceMediaMissing !== true) return null;
  if (item.status !== "failed" && item.status !== "partial") return null;
  if (!Array.isArray(item.target_platforms) || !item.target_platforms.includes("facebook_reels")) return null;
  if (!Number.isFinite(Date.parse(now))) return null;

  let delivery: URL;
  try {
    delivery = new URL(videoUrl);
  } catch {
    return null;
  }
  if (delivery.protocol !== "https:" || delivery.hostname !== "res.cloudinary.com" ||
      !delivery.pathname.includes("/video/upload/")) return null;

  const authBlockedPlatforms = metadataPlatforms(metadata.authBlockedPlatforms);
  const approvalDeferredPlatforms = metadataPlatforms(metadata.approvalDeferredPlatforms);
  if (metadata.authBlocked === true || authBlockedPlatforms.includes("facebook_reels") ||
      approvalDeferredPlatforms.includes("facebook_reels")) return null;

  const results = normalizeSocialPlatformResults(metadata.platformResults);
  const facebookResult = asRecord(results.facebook_reels);
  if (!facebookResult || facebookResult.ok !== false || typeof facebookResult.error !== "string") return null;
  if (typeof facebookResult.remoteId === "string" && facebookResult.remoteId.trim()) return null;
  if (facebookResult.requiresReconciliation === true || isAuthBlocked("facebook_reels", facebookResult.error) ||
      isAmbiguousProviderOutcome(facebookResult.error)) return null;

  const error = facebookResult.error.toLowerCase();
  if (!/http\s*422|unprocessable|source media|missing media|cooldown/i.test(error)) return null;

  const permanentFailurePlatforms = Array.isArray(metadata.permanentFailurePlatforms)
    ? metadata.permanentFailurePlatforms.filter((platform): platform is string => typeof platform === "string")
    : null;
  if (permanentFailurePlatforms === null && metadata.permanentFailure === true) return null;
  const remainingPermanentFailurePlatforms = (permanentFailurePlatforms ?? [])
    .filter(platform => platform !== "facebook_reels");
  const nextResults = { ...results };
  delete nextResults.facebook_reels;
  const previousAttempts = asRecord(metadata.platformAttempts) ?? {};

  const nextMetadata: Record<string, unknown> = {
    ...metadata,
    sourceMediaMissing: false,
    sourceMediaMissingAt: null,
    sourceMediaMissingReason: null,
    mediaRecoveredAt: now,
    platformResults: nextResults,
    platformAttempts: { ...previousAttempts, facebook_reels: 0 },
    attempts: 0,
    permanentFailure: remainingPermanentFailurePlatforms.length > 0,
    permanentFailurePlatforms: remainingPermanentFailurePlatforms,
    nextRetryAt: null,
    facebookReelsNextAllowedAt: null,
  };

  return {
    status: "queued",
    video_url: videoUrl,
    scheduled_at: now,
    published_at: null,
    error_message: null,
    updated_at: now,
    metadata: nextMetadata,
  };
}

export type LocalSocialQueueDeletionCandidate = {
  status: string;
  target_platforms: readonly string[] | null | undefined;
  metadata: SocialPlatformMetadata;
  error_message?: unknown;
};

/**
 * A local queue row may be removed only when every target has an explicit,
 * non-ambiguous failure (or was explicitly unavailable) and the row is wholly
 * failed. Partial, successful, legacy-without-ledger, and ambiguous outcomes
 * retain their audit IDs so remote posts cannot become orphaned.
 */
export function getLocalSocialQueueDeletionBlockers(
  item: LocalSocialQueueDeletionCandidate,
): string[] {
  const blockers = new Set<string>();
  if (item.status !== "failed") blockers.add("status_not_fully_failed");

  const targets = Array.isArray(item.target_platforms) ? item.target_platforms : [];
  if (targets.length === 0) blockers.add("missing_targets");

  const results = normalizeSocialPlatformResults(item.metadata?.platformResults);
  const unavailable = new Set(metadataPlatforms(item.metadata?.unavailablePlatforms));
  const supported: readonly SocialPlatform[] = ["facebook", "facebook_reels", "youtube"];

  for (const target of targets) {
    if (!supported.includes(target as SocialPlatform)) {
      blockers.add(target || "unsupported_target");
      continue;
    }

    const result = asRecord(results[target]);
    if (!result) {
      if (!unavailable.has(target as SocialPlatform)) blockers.add(target);
      continue;
    }

    const remoteId = result.remoteId;
    const hasRemoteId =
      typeof remoteId === "string" ? remoteId.trim().length > 0 : remoteId !== null && remoteId !== undefined;
    if (
      result.ok !== false ||
      typeof result.error !== "string" ||
      !result.error.trim() ||
      hasRemoteId ||
      result.requiresReconciliation === true ||
      isAmbiguousProviderOutcome(result.error)
    ) {
      blockers.add(target);
    }
  }

  // Protect unexpected/legacy result entries too, not only declared targets.
  for (const [platform, raw] of Object.entries(results)) {
    const result = asRecord(raw);
    if (
      !result ||
      result.ok === true ||
      hasSuccessfulDelivery(result) ||
      result.requiresReconciliation === true ||
      isAmbiguousProviderOutcome(result.error)
    ) {
      blockers.add(platform);
    }
  }

  for (const platform of getManualReconciliationPlatforms(item.metadata)) {
    blockers.add(platform);
  }
  if (item.metadata?.sourceMediaMissing === true) blockers.add("source_media_missing");
  if (isAmbiguousProviderOutcome(item.error_message)) blockers.add("unknown_provider_outcome");

  return [...blockers];
}

export function canDeleteLocalSocialQueueItem(
  item: LocalSocialQueueDeletionCandidate,
): boolean {
  return getLocalSocialQueueDeletionBlockers(item).length === 0;
}
