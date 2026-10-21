/**
 * Meta OAuthException code 368 / subcode 1390008 is a temporary posting restriction.
 * Keep one shared next-allowed timestamp so every queued item respects the same
 * provider cooldown rather than retrying Reels in a burst.
 */
export const FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// GitHub Actions runs every 15 minutes. A 12-minute interval leaves a small
// scheduling margin and limits publication to roughly one Reel per scheduled run.
export const FACEBOOK_REELS_MIN_POST_INTERVAL_MS = 12 * 60 * 1000;

export function extractFacebookReelsNextAllowedAt(value: unknown): string | null {
  const message = value instanceof Error ? value.message : String(value ?? "");
  const match = /facebook_reels_next_allowed_at=([^\\s,;]+)/i.exec(message);
  if (!match) return null;
  const rawTimestamp = match[1].replace(/\\]+$/, "");
  const timestamp = Date.parse(rawTimestamp);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function isFacebookReelsRateLimitResponseError(value: unknown): boolean {
  const message = value instanceof Error ? value.message : String(value ?? "");
  // A local cooldown message is not a new response from Meta and must never
  // extend the shared cooldown each time a queue item is deferred.
  if (extractFacebookReelsNextAllowedAt(message)) return false;
  return /\\bcode\\s*=\\s*368\\b|\\bsubcode\\s*=\\s*1390008\\b/i.test(message);
}

export function resolveFacebookReelsNextAllowedAt(value: unknown, nowMs: number = Date.now()): string | null {
  const existing = extractFacebookReelsNextAllowedAt(value);
  if (existing) return existing;
  if (!isFacebookReelsRateLimitResponseError(value)) return null;
  return new Date(nowMs + FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS).toISOString();
}

export function facebookReelsCooldownDeferredError(until: string): Error {
  return new Error("Facebook Reels publishing paused by provider cooldown until " + until + ". [facebook_reels_next_allowed_at=" + until + "]");
}