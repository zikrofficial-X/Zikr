/**
 * Meta OAuthException code 368 / subcode 1390008 indicates a temporary
 * platform-level posting restriction. Respect it with a shared provider cooldown
 * instead of repeatedly retrying every queued Reel.
 */
export const FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function extractFacebookReelsRateLimitUntil(value: unknown): string | null {
  const message = value instanceof Error ? value.message : String(value ?? "");
  const match = /facebook_reels_rate_limited_until=([^\s,;]+)/i.exec(message);
  if (!match) return null;
  const rawTimestamp = match[1].replace(/\]+$/, "");
  const timestamp = Date.parse(rawTimestamp);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function isFacebookReelsRateLimitResponseError(value: unknown): boolean {
  const message = value instanceof Error ? value.message : String(value ?? "");
  // A local cooldown message is not a new response from Meta and must never
  // extend the shared cooldown each time a queue item is deferred.
  if (extractFacebookReelsRateLimitUntil(message)) return false;
  return /\bcode\s*=\s*368\b|\bsubcode\s*=\s*1390008\b/i.test(message);
}

export function resolveFacebookReelsRateLimitUntil(
  value: unknown,
  nowMs: number = Date.now(),
): string | null {
  const existing = extractFacebookReelsRateLimitUntil(value);
  if (existing) return existing;
  if (!isFacebookReelsRateLimitResponseError(value)) return null;
  return new Date(nowMs + FACEBOOK_REELS_RATE_LIMIT_COOLDOWN_MS).toISOString();
}

export function facebookReelsRateLimitDeferredError(until: string): Error {
  return new Error(
    \`Facebook Reels publishing paused by Meta rate-limit protection until \${until} (code=368). [facebook_reels_rate_limited_until=\${until}]\`,
  );
}
