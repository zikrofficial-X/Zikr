/**
 * Video automation is an external side-effecting worker. It may run only when
 * the administrator's enable flag is explicitly present and truthy.
 * Missing, malformed, or unreadable configuration must fail closed.
 */
export function isVideoAutomationEnabled(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== "string") return false;
  return value.trim().toLowerCase() === "true";
}

/**
 * The purge lock is absent only when its row is absent or explicitly false.
 * Null, malformed, and unknown values fail closed so a corrupted lock cannot
 * permit video generation or a concurrent settings change.
 */
export function isVideoPurgeInProgress(value: unknown): boolean {
  if (value === undefined || value === false) return false;
  if (typeof value === "string" && value.trim().toLowerCase() === "false") return false;
  return true;
}
