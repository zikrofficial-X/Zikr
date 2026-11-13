import { resolveSocialPublishCutoff } from "./facebook-queue-recovery-policy";
import {
  getManualReconciliationPlatforms,
  isAuthBlocked,
  normalizeSocialPlatformResults,
} from "./platform-availability";

export type YouTubeQueueRecoveryCandidate = {
  id: string;
  status: string;
  updated_at: string | null;
  created_at: string | null;
};

export type YouTubeQueueRecoveryPatch = {
  status: "queued";
  scheduled_at: string;
  published_at: null;
  error_message: null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function hasSuccessfulDelivery(value: unknown): boolean {
  const row = asRecord(value);
  return row.ok === true && typeof row.remoteId === "string" && row.remoteId.trim().length > 0;
}

export function buildYouTubeQueueRecoveryFilter(
  candidate: YouTubeQueueRecoveryCandidate,
  publishAfter = process.env.SOCIAL_PUBLISH_AFTER,
): string | null {
  const id = typeof candidate.id === "string" ? candidate.id.trim() : "";
  const updatedAt = typeof candidate.updated_at === "string" ? candidate.updated_at.trim() : "";
  const createdAt = typeof candidate.created_at === "string" ? candidate.created_at.trim() : "";
  const cutoff = resolveSocialPublishCutoff(publishAfter);
  if (
    !id ||
    (candidate.status !== "failed" && candidate.status !== "partial") ||
    !updatedAt ||
    !Number.isFinite(Date.parse(updatedAt)) ||
    !createdAt ||
    !Number.isFinite(Date.parse(createdAt)) ||
    Date.parse(createdAt) < Date.parse(cutoff)
  ) return null;

  return "id=eq." + encodeURIComponent(id) +
    "&status=eq." + encodeURIComponent(candidate.status) +
    "&updated_at=eq." + encodeURIComponent(updatedAt) +
    "&created_at=eq." + encodeURIComponent(createdAt);
}

/**
 * Requeue only a confirmed YouTube OAuth/credential failure after an administrator
 * verifies the upload credential. Ambiguous provider outcomes, missing media,
 * editorial holds, and independent Facebook failures remain untouched.
 */
export function buildYouTubeQueueRecoveryPatch(
  metadataInput: Record<string, unknown> | null | undefined,
  targetsInput: readonly string[],
  now: string,
  updatedAt = now,
): YouTubeQueueRecoveryPatch | null {
  const metadata = metadataInput ?? {};
  const targets = targetsInput.filter((platform) =>
    platform === "youtube" || platform === "facebook" || platform === "facebook_reels",
  );
  if (
    metadata.sourceMediaMissing === true ||
    metadata.kidsSourceApprovalBlocked === true ||
    metadata.writtenArticlePublicationBlocked === true ||
    !targets.includes("youtube") ||
    !Number.isFinite(Date.parse(now)) ||
    !Number.isFinite(Date.parse(updatedAt)) ||
    getManualReconciliationPlatforms(metadata).includes("youtube")
  ) return null;

  const oldResults = normalizeSocialPlatformResults(metadata.platformResults);
  const previous = asRecord(oldResults.youtube);
  const declaredAuth = Array.isArray(metadata.authBlockedPlatforms)
    ? metadata.authBlockedPlatforms.filter((platform): platform is string => typeof platform === "string")
    : [];
  const explicitlyAuthBlocked = declaredAuth.includes("youtube");
  const inferredAuthBlocked = isAuthBlocked("youtube", previous.error);
  if ((!explicitlyAuthBlocked && !inferredAuthBlocked) || hasSuccessfulDelivery(previous)) return null;

  const platformResults = { ...oldResults };
  if (explicitlyAuthBlocked || inferredAuthBlocked) delete platformResults.youtube;

  const oldAttempts = asRecord(metadata.platformAttempts);
  const platformAttempts = { ...oldAttempts, youtube: 0 };
  const remainingAuthBlockedPlatforms = declaredAuth.filter((platform) => platform !== "youtube");
  const legacyFacebookAuthBlock =
    metadata.authBlocked === true &&
    declaredAuth.length === 0 &&
    targets.some((platform) => platform.startsWith("facebook"));
  const rawPermanentFailurePlatforms = metadata.permanentFailurePlatforms;
  const hasPermanentFailureList = Array.isArray(rawPermanentFailurePlatforms);
  const declaredPermanent = hasPermanentFailureList
    ? rawPermanentFailurePlatforms.filter((platform): platform is string => typeof platform === "string")
    : [];
  const remainingPermanentFailurePlatforms = declaredPermanent.filter((platform) => platform !== "youtube");
  const legacyPermanentFailureRemains =
    !hasPermanentFailureList &&
    metadata.permanentFailure === true &&
    targets.some((platform) => platform !== "youtube" && !hasSuccessfulDelivery(oldResults[platform]));

  return {
    status: "queued",
    scheduled_at: now,
    published_at: null,
    error_message: null,
    updated_at: updatedAt,
    metadata: {
      ...metadata,
      authBlocked: remainingAuthBlockedPlatforms.length > 0 || legacyFacebookAuthBlock,
      authBlockedPlatforms: remainingAuthBlockedPlatforms,
      permanentFailure: hasPermanentFailureList
        ? remainingPermanentFailurePlatforms.length > 0
        : legacyPermanentFailureRemains,
      ...(hasPermanentFailureList ? { permanentFailurePlatforms: remainingPermanentFailurePlatforms } : {}),
      platformAttempts,
      platformResults,
      nextRetryAt: null,
      reauthorizedAt: now,
    },
  };
}
