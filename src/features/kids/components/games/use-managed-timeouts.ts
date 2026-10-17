"use client";

import { useCallback, useEffect, useRef } from "react";

/** Tracks state-changing timeouts and cancels them when a round is replaced or its owner unmounts. */
export function useManagedTimeouts(resetKey: string | number) {
  const pendingTimeoutsRef = useRef<Set<number>>(new Set());

  const clearPendingTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    pendingTimeoutsRef.current.clear();
  }, []);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    let timeoutId = 0;
    timeoutId = window.setTimeout(() => {
      pendingTimeoutsRef.current.delete(timeoutId);
      callback();
    }, delay);
    pendingTimeoutsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  useEffect(() => () => clearPendingTimeouts(), [clearPendingTimeouts, resetKey]);

  return { scheduleTimeout, clearPendingTimeouts };
}
