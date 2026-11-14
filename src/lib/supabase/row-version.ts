/**
 * Produce a strictly newer updated_at value for compare-and-set row writes.
 *
 * JavaScript/PostgREST timestamps are millisecond-precision. If two writes
 * happen in the same millisecond, reusing the observed timestamp would leave
 * the CAS token unchanged and allow a stale writer to match again.
 */
export function buildNextRowVersionUpdatedAt(
  previousUpdatedAt: string | null,
  now: Date = new Date(),
): string {
  const nowMs = now.getTime();
  if (!Number.isFinite(nowMs)) {
    throw new Error("Row version update requires a valid current timestamp.");
  }
  const previousMs = previousUpdatedAt === null ? Number.NaN : Date.parse(previousUpdatedAt);
  if (previousUpdatedAt !== null && !Number.isFinite(previousMs)) {
    throw new Error("Row version update requires a valid previous updated_at timestamp.");
  }
  const nextMs = Number.isFinite(previousMs)
    ? Math.max(nowMs, previousMs + 1)
    : nowMs;
  return new Date(nextMs).toISOString();
}
