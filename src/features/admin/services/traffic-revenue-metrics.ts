export type SocialPlatformDeliveryStats = {
  platform: string;
  attempts: number;
  successful: number;
  failed: number;
  remoteIds: number;
};

export function summarizePlatformResults(rows: Array<{ metadata: unknown }>): SocialPlatformDeliveryStats[] {
  const summary = new Map<string, SocialPlatformDeliveryStats>();
  for (const row of rows) {
    if (!row.metadata || typeof row.metadata !== "object" || Array.isArray(row.metadata)) continue;
    const metadata = row.metadata as Record<string, unknown>;
    const results = metadata.platformResults;
    if (!results || typeof results !== "object" || Array.isArray(results)) continue;
    for (const [key, raw] of Object.entries(results as Record<string, unknown>)) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const result = raw as Record<string, unknown>;
      const platform = typeof result.platform === "string" ? result.platform : key;
      const item = summary.get(platform) ?? { platform, attempts: 0, successful: 0, failed: 0, remoteIds: 0 };
      item.attempts += 1;
      if (result.ok === true) item.successful += 1;
      if (result.ok === false || (typeof result.error === "string" && result.error.trim())) item.failed += 1;
      if (typeof result.remoteId === "string" && result.remoteId.trim()) item.remoteIds += 1;
      summary.set(platform, item);
    }
  }
  return [...summary.values()].sort((a, b) => a.platform.localeCompare(b.platform));
}

/**
 * Exact count must match the returned rows. A bounded query cannot be treated
 * as complete when it reaches its limit or when PostgREST omits a count.
 */
export function isCompleteBoundedRead(total: number | null, returned: number, limit: number): boolean {
  return total !== null && returned === total && total <= limit;
}

export function averageRenderDuration(
  rows: Array<{ render_duration_ms: number | null }>,
  total: number | null,
): number | null {
  if (total === null || total !== rows.length || rows.length === 0) return null;
  const durations = rows.map((row) => row.render_duration_ms).filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  if (durations.length !== rows.length) return null;
  return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
}
