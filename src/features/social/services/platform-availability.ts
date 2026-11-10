export type SocialPlatform = "facebook" | "facebook_reels" | "youtube";

export type SocialPlatformEnvironment = Record<string, string | undefined>;

export type SocialPlatformMetadata = {
  platformResults?: unknown;
  platformAttempts?: unknown;
  authBlocked?: unknown;
  authBlockedPlatforms?: unknown;
  permanentFailure?: unknown;
  permanentFailurePlatforms?: unknown;
  attempts?: unknown;
} | null | undefined;

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
  if (!enabledPlatforms.includes(platform)) return false;
  const rawResults = metadata?.platformResults;
  const hasPlatformResults = rawResults !== null && typeof rawResults === "object";
  const results = normalizeSocialPlatformResults(rawResults);
  const previous = asRecord(results[platform]);
  if (hasSuccessfulDelivery(previous)) return false;
  if (getManualReconciliationPlatforms(metadata).includes(platform)) return false;

  const authBlockedPlatforms = metadataPlatforms(metadata?.authBlockedPlatforms);
  const permanentFailurePlatforms = metadataPlatforms(metadata?.permanentFailurePlatforms);
  if (authBlockedPlatforms.includes(platform) || permanentFailurePlatforms.includes(platform)) return false;

  // Legacy global authBlocked was emitted only by the Facebook adapter. It must
  // not prevent an independent YouTube target from being published.
  if (!hasPlatformResults && authBlockedPlatforms.length === 0 &&
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
