'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Analytics = dynamic(
  () => import('./analytics').then((module) => module.Analytics),
  { ssr: false },
);

const SpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then((module) => module.SpeedInsights),
  { ssr: false },
);

const ANALYTICS_DELAY_MS = 10000;

export function DeferredAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    const start = () => setReady(true);

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        const idleId = window.requestIdleCallback(start, { timeout: ANALYTICS_DELAY_MS });
        timeoutId = window.setTimeout(() => {
          window.cancelIdleCallback(idleId);
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
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.removeEventListener('load', schedule);
    };
  }, []);

  if (!ready) return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
