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

/**
 * Validate the PostgREST response shape before interpreting the purge lock.
 * An absent row means no lock; malformed payloads or duplicate rows fail closed.
 */
export function isVideoPurgeLockResponseActive(response: unknown): boolean {
  if (!Array.isArray(response) || response.length > 1) return true;
  if (response.length === 0) return false;

  const row = response[0];
  if (
    typeof row !== "object" ||
    row === null ||
    Array.isArray(row) ||
    !Object.prototype.hasOwnProperty.call(row, "value") ||
    (row as { value?: unknown }).value === undefined
  ) {
    return true;
  }

  return isVideoPurgeInProgress((row as { value: unknown }).value);
}
