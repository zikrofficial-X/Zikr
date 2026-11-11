export function isPublicKidsVideoSocialQueueRow(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  if (row.status !== "published" && row.status !== "partial") return false;
  if (typeof row.content_type !== "string" || !row.content_type.endsWith("_video")) return false;
  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : null;
  return metadata?.audience === "kids";
}
