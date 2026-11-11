export function isPublicKidsVideoSocialQueueRow(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (row.status !== "published" && row.status !== "partial") return false;
  if (typeof row.content_type !== "string" || !row.content_type.endsWith("_video")) return false;
  if (typeof row.published_at !== "string" || !Number.isFinite(Date.parse(row.published_at))) return false;

  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : null;
  if (metadata?.audience !== "kids") return false;
  if (row.status === "published") return true;

  const platformResults = metadata.platformResults && typeof metadata.platformResults === "object" && !Array.isArray(metadata.platformResults)
    ? metadata.platformResults as Record<string, unknown>
    : {};
  return Object.values(platformResults).some((result) => {
    if (!result || typeof result !== "object" || Array.isArray(result)) return false;
    const platformResult = result as Record<string, unknown>;
    return platformResult.ok === true &&
      typeof platformResult.remoteId === "string" &&
      platformResult.remoteId.trim().length > 0;
  });
}
