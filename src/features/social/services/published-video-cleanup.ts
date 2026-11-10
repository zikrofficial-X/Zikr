export function shouldRetryPublishedVideoCleanup(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  return metadata?.stagingCleanupDeferred !== true || metadata.videoCleanupPending === true;
}
