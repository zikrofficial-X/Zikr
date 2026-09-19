'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const VercelAnalytics = dynamic(
  () => import('@vercel/analytics/next').then((module) => module.Analytics),
  { ssr: false },
);

const ANALYTICS_DELAY_MS = 15000;

/**
 * Vercel Analytics is non-critical to first paint. Keep it out of the
 * initial client bundle and load it after the page has finished loading
 * and the browser is idle, with a hard upper bound.
 */
export function Analytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    let idleId: number | undefined;

    const start = () => setReady(true);
    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(start, {
          timeout: ANALYTICS_DELAY_MS,
        });
        timeoutId = window.setTimeout(() => {
          if (idleId !== undefined) window.cancelIdleCallback(idleId);
          start();
        }, ANALYTICS_DELAY_MS);
      } else {
        timeoutId = window.setTimeout(start, ANALYTICS_DELAY_MS);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true, passive: true });
    }

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.removeEventListener('load', schedule);
    };
  }, []);

  return ready ? <VercelAnalytics /> : null;
}
