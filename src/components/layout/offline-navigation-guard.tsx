'use client';

import { useEffect } from 'react';

/**
 * Next App Router links normally request an RSC payload during client-side
 * navigation. When the device is offline that request may not be cached,
 * even though the corresponding HTML page is already in Cache Storage.
 *
 * While offline, convert ordinary same-origin link clicks into a hard
 * navigation so the service worker can serve the cached HTML document.
 */
export function OfflineNavigationGuard() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (navigator.onLine) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.href === window.location.href) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(url.href);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
