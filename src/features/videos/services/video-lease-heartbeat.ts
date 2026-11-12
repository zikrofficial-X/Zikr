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
        // A failed renewal cannot prove whether the compare-and-set reached
        // Supabase. Treat transport and lease errors as uncertain ownership.
        leaseLost = true;
        leaseLostError = error;
        stopped = true;
        controller.abort(error);
        clearInterval(timer);
        try {
          options.onRenewalError?.(error);
        } catch {
          // Logging/telemetry must not interrupt fail-closed lease handling.
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


/**
 * Serialize heartbeat renewals and foreground writes that share a compare-and-set
 * lease revision. Without this queue, two concurrent PATCH requests can both use
 * the same updated_at value; the loser then mistakes the winning write for a
 * genuinely lost lease and abandons work owned by this worker.
 */
export function createSerializedLeaseMutation<TArgs extends unknown[], TResult>(
  mutation: (...args: TArgs) => Promise<TResult>,
): (...args: TArgs) => Promise<TResult> {
  let tail: Promise<void> = Promise.resolve();

  return (...args: TArgs) => {
    const result = tail.then(() => mutation(...args));
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
