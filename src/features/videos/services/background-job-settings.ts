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
