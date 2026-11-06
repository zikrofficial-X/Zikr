export type SocialPlatform = "facebook" | "facebook_reels" | "youtube";

export type SocialPlatformEnvironment = Record<string, string | undefined>;

export type SocialPlatformMetadata = {
  platformResults?: unknown;
  platformAttempts?: unknown;
  authBlocked?: unknown;
  permanentFailure?: unknown;
  attempts?: unknown;
} | null | undefined;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
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

function isPermanentFailure(error: unknown): boolean {
  if (typeof error !== "string") return false;
  return /no supported target|requires video_url|requires an absolute video media url|requires an http\(s\) video media url|youtube watch\/embed|oauth|access token|publishing is disabled|not configured|human qa approval/i.test(error);
}

export function canAttemptSocialPlatform(input: {
  platform: SocialPlatform;
  enabledPlatforms: readonly SocialPlatform[];
  metadata: SocialPlatformMetadata;
  maxAttempts: number;
}): boolean {
  const { platform, enabledPlatforms, metadata, maxAttempts } = input;
  if (!enabledPlatforms.includes(platform)) return false;
  const results = asRecord(metadata?.platformResults);
  const previous = asRecord(results?.[platform]);
  if (hasSuccessfulDelivery(previous)) return false;

  // Legacy global authBlocked was emitted only by the Facebook adapter. It must
  // not prevent an independent YouTube target from being published.
  if (!results && metadata?.authBlocked === true && platform.startsWith("facebook")) return false;
  if (isAuthBlocked(platform, previous?.error) || isPermanentFailure(previous?.error)) return false;

  const attempts = asRecord(metadata?.platformAttempts);
  const legacyAttempts = Number(metadata?.attempts ?? 0);
  const fallbackAttempts = !results && !(metadata?.authBlocked === true && platform === "youtube") ? legacyAttempts : 0;
  const currentAttempts = Number(attempts?.[platform] ?? fallbackAttempts);
  return Number.isFinite(currentAttempts) && currentAttempts < Math.max(1, maxAttempts);
}

export function getUnavailableSocialPlatforms(
  targets: readonly SocialPlatform[],
  enabledPlatforms: readonly SocialPlatform[],
): SocialPlatform[] {
  return targets.filter(platform => !enabledPlatforms.includes(platform));
}
