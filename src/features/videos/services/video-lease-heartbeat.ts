export function getVideoRequestLeaseHeartbeatIntervalMs(staleAfterMinutes: number): number {
  const staleAfterMs = Number.isFinite(staleAfterMinutes) && staleAfterMinutes > 0
    ? staleAfterMinutes * 60_000
    : 5 * 60_000;
  return Math.max(1_000, Math.floor(staleAfterMs / 3));
}

export async function withVideoRequestLeaseHeartbeat<T>(
  options: {
    intervalMs: number;
    renew: () => Promise<unknown>;
    isLeaseLost: (error: unknown) => boolean;
    onRenewalError?: (error: unknown) => void;
  },
  operation: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const intervalMs = Number.isFinite(options.intervalMs) && options.intervalMs > 0
    ? Math.max(1, Math.floor(options.intervalMs))
    : 60_000;
  let stopped = false;
  let leaseLost = false;
  let leaseLostError: unknown;
  let pending: Promise<void> | null = null;
  const controller = new AbortController();

  const timer = setInterval(() => {
    if (stopped || pending || leaseLost) return;
    pending = Promise.resolve()
      .then(() => options.renew())
      .then(() => undefined)
      .catch((error: unknown) => {
        let isLost = false;
        try {
          isLost = options.isLeaseLost(error);
        } catch {
          // A broken classifier must not turn a transient renewal error into
          // permission to publish without a confirmed lease.
        }
        if (isLost) {
          leaseLost = true;
          leaseLostError = error;
          stopped = true;
          controller.abort(error);
          clearInterval(timer);
          return;
        }
        try {
          options.onRenewalError?.(error);
        } catch {
          // Logging/telemetry must not break the worker's lease loop.
        }
      })
      .finally(() => {
        pending = null;
      });
  }, intervalMs);
  timer.unref?.();

  const stop = async () => {
    stopped = true;
    clearInterval(timer);
    if (pending) await pending;
  };

  try {
    const result = await operation(controller.signal);
    await stop();
    if (leaseLost) throw leaseLostError;
    return result;
  } catch (error) {
    await stop();
    if (leaseLost) throw leaseLostError;
    throw error;
  }
}
