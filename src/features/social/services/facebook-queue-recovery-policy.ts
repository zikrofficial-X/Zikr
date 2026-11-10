import { normalizeSocialPlatformResults } from "./platform-availability";

export type FacebookQueueRecoveryPlatform = "facebook" | "facebook_reels";

export type FacebookQueueRecoveryPatch = {
  status: "queued";
  scheduled_at: string;
  published_at: null;
  error_message: null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export function buildFacebookQueueRecoveryPatch(
  metadataInput: Record<string, unknown> | null | undefined,
  targetsInput: readonly string[],
  now: string,
): FacebookQueueRecoveryPatch | null {
  const metadata = metadataInput ?? {};
  const facebookTargets = targetsInput.filter(
    (platform): platform is FacebookQueueRecoveryPlatform =>
      platform === "facebook" || platform === "facebook_reels",
  );
  if (metadata.authBlocked !== true || facebookTargets.length === 0) return null;

  const declaredBlocked = Array.isArray(metadata.authBlockedPlatforms)
    ? metadata.authBlockedPlatforms.filter((platform): platform is FacebookQueueRecoveryPlatform =>
        platform === "facebook" || platform === "facebook_reels",
      )
    : [];
  const oldResults = normalizeSocialPlatformResults(metadata.platformResults);
  const facebookResultTargets = facebookTargets.filter((platform) =>
    Object.prototype.hasOwnProperty.call(oldResults, platform),
  );
  const inferredAuthBlockedTargets = facebookTargets.filter((platform) => {
    const result = oldResults[platform];
    if (!result || typeof result !== "object" || Array.isArray(result)) return false;
    const row = result as { ok?: unknown; error?: unknown };
    if (row.ok !== false || typeof row.error !== "string") return false;
    const error = row.error.toLowerCase();
    return error.includes("access token") ||
      error.includes("session has expired") ||
      error.includes("oauth") ||
      error.includes("reauthorization_required") ||
      error.includes("reconnect the page");
  });
  // Prefer explicit per-platform auth blocks. For legacy global flags, infer
  // only targets with an auth-shaped error; fall back to all Facebook targets
  // only when the old row has no Facebook result ledger at all.
  const blockedTargets = declaredBlocked.length > 0
    ? facebookTargets.filter((platform) => declaredBlocked.includes(platform))
    : inferredAuthBlockedTargets.length > 0
      ? inferredAuthBlockedTargets
      : facebookResultTargets.length === 0
        ? facebookTargets
        : [];
  if (blockedTargets.length === 0) return null;

  const platformResults = { ...oldResults };
  for (const platform of blockedTargets) {
    const result = platformResults[platform];
    if (result && typeof result === "object" && (result as { ok?: unknown }).ok === false) {
      delete platformResults[platform];
    }
  }

  const oldAttempts = metadata.platformAttempts && typeof metadata.platformAttempts === "object" && !Array.isArray(metadata.platformAttempts)
    ? metadata.platformAttempts as Record<string, number>
    : {};
  const platformAttempts = { ...oldAttempts };
  for (const platform of blockedTargets) platformAttempts[platform] = 0;

  const remainingAuthBlockedPlatforms = declaredBlocked.filter((platform) => !blockedTargets.includes(platform));
  const hasRemainingAuthBlock = remainingAuthBlockedPlatforms.length > 0;
  const permanentFailurePlatforms = Array.isArray(metadata.permanentFailurePlatforms)
    ? metadata.permanentFailurePlatforms.filter((platform) =>
        !blockedTargets.some((target) => target === String(platform)),
      )
    : [];
  const hasPermanentFailureMetadata = Array.isArray(metadata.permanentFailurePlatforms);

  return {
    status: "queued",
    scheduled_at: now,
    published_at: null,
    error_message: null,
    updated_at: now,
    metadata: {
      ...metadata,
      authBlocked: hasRemainingAuthBlock,
      authBlockedPlatforms: remainingAuthBlockedPlatforms,
      permanentFailure: hasPermanentFailureMetadata
        ? permanentFailurePlatforms.length > 0
        : metadata.permanentFailure === true,
      permanentFailurePlatforms: hasPermanentFailureMetadata ? permanentFailurePlatforms : metadata.permanentFailurePlatforms,
      platformAttempts,
      platformResults,
      nextRetryAt: null,
      reauthorizedAt: now,
    },
  };
}
