/**
 * Returns whether a confirmed provider deletion applies to the delivery that
 * is currently stored on a social queue row.
 *
 * New provider IDs supersede deletion records for older posts. Legacy records
 * without a remote ID use timestamps conservatively; missing or invalid
 * timestamps fail closed so an uncertain deletion is never treated as live.
 */
export function isSocialPlatformDeletionCurrent(
  deletionValue: unknown,
  deliveryRemoteIdValue: unknown,
  publishedAtValue: unknown,
): boolean {
  if (!deletionValue || typeof deletionValue !== "object" || Array.isArray(deletionValue)) {
    return false;
  }

  const deletion = deletionValue as Record<string, unknown>;
  if (deletion.status !== "deleted") return false;

  const deletedRemoteId = typeof deletion.remoteId === "string" ? deletion.remoteId.trim() : "";
  if (deletedRemoteId) {
    const deliveryRemoteId = typeof deliveryRemoteIdValue === "string"
      ? deliveryRemoteIdValue.trim()
      : "";
    return !deliveryRemoteId || deletedRemoteId === deliveryRemoteId;
  }

  const deletedAt = typeof deletion.deletedAt === "string"
    ? Date.parse(deletion.deletedAt)
    : Number.NaN;
  const publishedAt = typeof publishedAtValue === "string"
    ? Date.parse(publishedAtValue)
    : Number.NaN;

  return !Number.isFinite(publishedAt) ||
    !Number.isFinite(deletedAt) ||
    deletedAt >= publishedAt;
}
