'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const RuntimeEffects = dynamic(
  () => import('./runtime-effects').then((module) => module.RuntimeEffects),
  { ssr: false },
);

const RUNTIME_DELAY_MS = 5000;

/**
 * Loads non-critical browser integrations after the first interaction or a
 * short post-load delay. The core page, auth shell, and prayer UI remain
 * available without waiting for PWA/analytics/reminder code.
 */
export function DeferredRuntime() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    const capacitor = (window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    }).Capacitor;
    if (capacitor?.isNativePlatform?.()) {
      // Native LocalNotifications must be initialized immediately. Delaying
      // this runtime leaves Android without scheduled alarms until the first
      // tap or the web-only deferred timeout expires.
      setReady(true);
      return;
    }

    let timeoutId: number | undefined;
    const start = () => setReady(true);

    const handleInteraction = () => start();
    window.addEventListener('pointerdown', handleInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleInteraction, { once: true, passive: true });
    window.addEventListener('touchstart', handleInteraction, { once: true, passive: true });

    const schedule = () => {
      timeoutId = window.setTimeout(start, RUNTIME_DELAY_MS);
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true, passive: true });
    }

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      window.removeEventListener('load', schedule);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [ready]);

  return ready ? <RuntimeEffects /> : null;
}
