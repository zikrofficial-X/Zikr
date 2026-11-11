/**
 * Resolve the client address behind the hosting proxy without trusting the
 * left-most, potentially client-supplied X-Forwarded-For entry.
 */
export function getTrustedClientAddress(realIp: string | null, forwardedFor: string | null): string {
  const trustedRealIp = realIp?.trim();
  if (trustedRealIp) return trustedRealIp;

  const forwardedHops = (forwardedFor ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return forwardedHops.at(-1) ?? "unknown";
}
