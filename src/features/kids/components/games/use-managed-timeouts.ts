"use client";

import { useCallback, useEffect, useRef } from "react";

type ManagedTimeout = {
  callback: () => void;
  remainingMs: number;
  startedAt: number | null;
  timeoutId: number | null;
};

/** Cancels stale callbacks on reset/unmount and freezes delayed transitions while gameplay is paused. */
export function useManagedTimeouts(resetKey: string | number, paused = false) {
  const pendingTimeoutsRef = useRef<Map<number, ManagedTimeout>>(new Map());
  const nextTimeoutIdRef = useRef(1);
  const pausedRef = useRef(paused);

  const startTimeout = useCallback((id: number, timer: ManagedTimeout) => {
    timer.startedAt = Date.now();
    timer.timeoutId = window.setTimeout(() => {
      pendingTimeoutsRef.current.delete(id);
      timer.timeoutId = null;
      timer.startedAt = null;
      timer.remainingMs = 0;
      timer.callback();
    }, Math.max(0, timer.remainingMs));
  }, []);

  const clearPendingTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach(timer => {
      if (timer.timeoutId !== null) window.clearTimeout(timer.timeoutId);
    });
    pendingTimeoutsRef.current.clear();
  }, []);

  useEffect(() => {
    pausedRef.current = paused;

    if (paused) {
      pendingTimeoutsRef.current.forEach(timer => {
        const timeoutId = timer.timeoutId;
        const startedAt = timer.startedAt;
        if (timeoutId === null || startedAt === null) return;
        window.clearTimeout(timeoutId);
        const elapsed = Date.now() - startedAt;
        timer.remainingMs = Math.max(0, timer.remainingMs - elapsed);
        timer.timeoutId = null;
        timer.startedAt = null;
      });
      return;
    }

    pendingTimeoutsRef.current.forEach((timer, id) => {
      if (timer.timeoutId === null) startTimeout(id, timer);
    });
  }, [paused, startTimeout]);

  const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
    const id = nextTimeoutIdRef.current++;
    const timer: ManagedTimeout = {
      callback,
      remainingMs: Math.max(0, delay),
      startedAt: null,
      timeoutId: null,
    };
    pendingTimeoutsRef.current.set(id, timer);
    if (!pausedRef.current) startTimeout(id, timer);
    return id;
  }, [startTimeout]);

  useEffect(() => () => clearPendingTimeouts(), [clearPendingTimeouts, resetKey]);

  return { scheduleTimeout, clearPendingTimeouts };
}
