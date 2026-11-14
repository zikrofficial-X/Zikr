export const DAILY_VIDEO_QUOTA_STATUSES = [
  "pending",
  "processing",
  "retry_wait",
  "completed",
] as const;

const dailyVideoQuotaStatuses = new Set<string>(DAILY_VIDEO_QUOTA_STATUSES);

export type DailyVideoQuotaRow = {
  status?: unknown;
  automation_key?: unknown;
};

/**
 * Count only requests that are still active/retryable or have completed.
 * Terminal failed/cancelled requests do not satisfy the daily delivery target,
 * but their slot keys remain reserved so a replacement never reuses an old key.
 */
export function calculateDailyVideoQuotaState(
  rows: readonly DailyVideoQuotaRow[] | null | undefined,
): { reservedCount: number; nextSlot: number } {
  let reservedCount = 0;
  let nextSlot = 0;

  for (const row of rows ?? []) {
    if (typeof row.status === "string" && dailyVideoQuotaStatuses.has(row.status)) {
      reservedCount += 1;
    }

    if (typeof row.automation_key !== "string") continue;
    const match = row.automation_key.match(/:(\d+)$/);
    if (!match) continue;

    const slot = Number(match[1]);
    if (Number.isSafeInteger(slot) && slot >= 0) {
      nextSlot = Math.max(nextSlot, slot + 1);
    }
  }

  return { reservedCount, nextSlot };
}
