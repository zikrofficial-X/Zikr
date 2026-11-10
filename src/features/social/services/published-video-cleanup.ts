export const PUBLISHED_VIDEO_CLEANUP_POSTGREST_FILTER =
  "or=(metadata->>stagingCleanupDeferred.neq.true,metadata->>stagingCleanupDeferred.is.null,metadata->>videoCleanupPending.eq.true)";

export function shouldRetryPublishedVideoCleanup(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return metadata?.stagingCleanupDeferred !== true || metadata.videoCleanupPending === true;
}


/**
 * Compute the staging-copy retention deadline from the timestamp when all
 * requested social targets are confirmed. Partial platform success is not a
 * valid retention clock start.
 */
export function getPublishedVideoStagingCleanupEligibleAt(fullyPublishedAt: string): string {
  const timestamp = Date.parse(fullyPublishedAt);
  if (!Number.isFinite(timestamp)) {
    throw new Error("A valid all-target publication timestamp is required for video cleanup retention.");
  }
  return new Date(timestamp + 48 * 60 * 60 * 1000).toISOString();
}
