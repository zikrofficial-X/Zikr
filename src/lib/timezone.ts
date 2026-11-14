/**
 * Normalize an IANA timezone using the runtime's timezone database.
 * Returns null for empty, oversized, or unsupported values.
 */
export function normalizeIanaTimeZone(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim();
  if (!candidate || candidate.length > 80) return null;

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: candidate,
    }).resolvedOptions().timeZone;
  } catch {
    return null;
  }
}
