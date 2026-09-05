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

export function DeferredAnalytics() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let timeoutId: number | undefined;
    const start = () => setReady(true);

    const schedule = () => {
      if (typeof window.requestIdleCallback === 'function') {
        const idleId = window.requestIdleCallback(start, { timeout: 3000 });
        timeoutId = window.setTimeout(() => {
          window.cancelIdleCallback(idleId);
          start();
        }, 3000);
      } else {
        timeoutId = window.setTimeout(start, 1000);
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
