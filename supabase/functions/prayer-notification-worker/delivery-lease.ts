export function getDeliveryLeaseHeartbeatIntervalMs(staleAfterMs: number): number {
  const safeStaleAfterMs = Number.isFinite(staleAfterMs) && staleAfterMs > 0
    ? staleAfterMs
    : 10 * 60_000;
  return Math.max(1_000, Math.min(60_000, Math.floor(safeStaleAfterMs / 3)));
}

export function startDeliveryLeaseHeartbeat(options: {
  intervalMs: number;
  renew: () => Promise<boolean>;
  onRenewalError?: (error: unknown) => void;
}): { readonly leaseLost: boolean; stop: () => Promise<void> } {
  const intervalMs = Number.isFinite(options.intervalMs) && options.intervalMs > 0
    ? Math.max(1, Math.floor(options.intervalMs))
    : 60_000;
  let stopped = false;
  let leaseLost = false;
  let pending: Promise<void> | null = null;

  const timer = setInterval(() => {
    if (stopped || pending || leaseLost) return;
    pending = Promise.resolve()
      .then(() => options.renew())
      .then((owned) => {
        if (owned) return;
        leaseLost = true;
        stopped = true;
        clearInterval(timer);
      })
      .catch((error: unknown) => {
        // An uncertain renewal cannot prove ownership. Stop before another
        // provider send rather than continuing after the stale-recovery window.
        leaseLost = true;
        stopped = true;
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

  return {
    get leaseLost() {
      return leaseLost;
    },
    async stop() {
      stopped = true;
      clearInterval(timer);
      if (pending) await pending;
    },
  };
}
