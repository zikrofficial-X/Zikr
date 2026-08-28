'use client';

import { useEffect } from 'react';
import { hydrateOfflineContent } from '@/lib/offline-pack';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if service workers are supported. Registering in preview as well
    // lets users verify notification behavior before deployment.

    if (!('serviceWorker' in navigator)) {
      return;
    }

    let updateInterval: NodeJS.Timeout | null = null;
    let hydrationTimeout: number | undefined;
    let refreshing = false;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let hydrationIdleHandle: number | undefined;
    let registration: ServiceWorkerRegistration | null = null;
    let hydrationFinished = false;
    let hydrationStarted = false;

    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        effectiveType?: string;
        addEventListener?: (type: string, listener: () => void) => void;
        removeEventListener?: (type: string, listener: () => void) => void;
      };
    }).connection;

    const canHydrate = () =>
      !connection?.saveData &&
      connection?.effectiveType !== 'slow-2g' &&
      connection?.effectiveType !== '2g';

    const hydrate = async () => {
      if (hydrationStarted || hydrationFinished || !canHydrate()) return;
      hydrationStarted = true;
      try {
        const result = await hydrateOfflineContent();
        hydrationFinished = result?.complete === true;
      } catch (error) {
        console.warn('[PWA] Offline content hydration failed:', error);
      } finally {
        hydrationStarted = false;
      }
    };

    const scheduleHydration = (delayMs: number) => {
      if (hydrationFinished || hydrationStarted) return;
      if (hydrationIdleHandle !== undefined) {
        window.cancelIdleCallback?.(hydrationIdleHandle);
        hydrationIdleHandle = undefined;
      }
      if (hydrationTimeout !== undefined) window.clearTimeout(hydrationTimeout);
      hydrationTimeout = window.setTimeout(() => {
        hydrationTimeout = undefined;
        if (!canHydrate()) return;
        const requestIdle = window.requestIdleCallback?.bind(window);
        if (requestIdle) {
          hydrationIdleHandle = requestIdle(() => {
            hydrationIdleHandle = undefined;
            void hydrate();
          }, { timeout: 5000 });
        } else {
          void hydrate();
        }
      }, delayMs);
    };

    const handleNetworkChange = () => {
      if (canHydrate()) scheduleHydration(3000);
    };

    const handleControllerChange = () => {
      // Do not reload during the initial install. For existing visitors, a new
      // worker must take control so the latest deployed UI and content rules
      // are visible without requiring a manual hard refresh.
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        // The offline pack contains several large public datasets. Register the
        // worker immediately, then hydrate only after the critical page settles.
        // Slow connections skip the first attempt but retry when conditions improve.
        scheduleHydration(15000);

        window.addEventListener('online', handleNetworkChange, { passive: true });
        window.addEventListener('focus', handleNetworkChange, { passive: true });
        document.addEventListener('visibilitychange', handleNetworkChange, { passive: true });
        connection?.addEventListener?.('change', handleNetworkChange);

        // Check for updates periodically and retry the offline pack if the
        // connection was initially too slow or Data Saver was enabled.
        updateInterval = setInterval(() => {
          registration?.update();
          handleNetworkChange();
        }, 60000); // Check every minute

        // Listen for new service worker
        const handleUpdateFound = () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;

          const handleStateChange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Activate the new worker immediately; controllerchange performs
              // one safe reload for already-controlled pages.
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              console.log('[PWA] Service Worker updated');
            }
          };

          newWorker.addEventListener('statechange', handleStateChange);
        };

        registration.addEventListener('updatefound', handleUpdateFound);
      } catch (error) {
        // Silently fail in development; log only if needed for debugging
        if (process.env.NODE_ENV === 'production') {
          console.error('[PWA] Service Worker registration failed:', error);
        }
      }
    };

    // Register after page load. Keep a named handler so cleanup is complete
    // when React remounts this component in development Strict Mode.
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    const handleLoad = () => {
      void registerServiceWorker();
    };
    if (document.readyState === 'complete') {
      void registerServiceWorker();
    } else {
      window.addEventListener('load', handleLoad, { once: true });
    }

    return () => {
      window.removeEventListener('load', handleLoad);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      if (updateInterval) clearInterval(updateInterval);
      if (hydrationIdleHandle !== undefined) {
        window.cancelIdleCallback?.(hydrationIdleHandle);
      }
      if (hydrationTimeout !== undefined) window.clearTimeout(hydrationTimeout);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('focus', handleNetworkChange);
      document.removeEventListener('visibilitychange', handleNetworkChange);
      connection?.removeEventListener?.('change', handleNetworkChange);
    };
  }, []);

  return null;
}
