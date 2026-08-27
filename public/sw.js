// Service Worker for Zikr PWA
const CACHE_NAME = 'zikr-v8';

// Public, non-personalized content APIs that are safe to cache for offline reading.
// Authenticated and mutation APIs remain network-only to avoid leaking private data.
const PUBLIC_CONTENT_API_PREFIXES = [
  '/api/content/articles',
  '/api/content/companions',
  '/api/content/prophets',
  '/api/content/stories',
  '/api/duas',
  '/api/hadith/books',
  '/api/quran/surahs',
  '/api/search',
  '/api/tawasheeh',
  '/api/kids/games/verse',
];

function isPublicContentApi(url) {
  return PUBLIC_CONTENT_API_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
}

// Only a small app shell is pre-cached during install. Pages, public APIs,
// and the Offline content pack are cached on demand after the first visit.
const CORE_INSTALL_ASSETS = [
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache only the lightweight app shell. The complete public
// content pack is hydrated later by the client after the critical page settles.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        CORE_INSTALL_ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn(`[SW] Failed to cache ${asset}:`, error);
          }
        }),
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests entirely (external CDNs, audio/video streams, APIs).
  // Intercepting them breaks media range requests ("URL safety check" errors).
  if (url.origin !== self.location.origin) {
    return;
  }

  // Skip audio/video requests - media elements need native range request handling
  if (request.destination === 'audio' || request.destination === 'video') {
    return;
  }

  // Skip third-party ad and tracking scripts
  if (request.destination === 'script' && 
      (url.hostname.includes('google') || 
       url.hostname.includes('pagead') ||
       url.hostname.includes('doubleclick'))) {
    return;
  }

  // Prayer times use network-first with a cached response so the last
  // successful schedule remains available when the user is offline.
  if (url.pathname === '/api/prayer-times') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request).then((cached) => cached || new Response(
        JSON.stringify({ error: 'Network error' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      )))
    );
    return;
  }

  // Public content APIs use network-first with a cached response fallback.
  // This makes Quran, hadith, duas, stories, articles, and search content available
  // after the user has opened it once, without caching authenticated data.
  if (isPublicContentApi(url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || new Response(
          JSON.stringify({ error: 'Offline content is not cached yet' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        )))
    );
    return;
  }

  // Other API and auth calls remain network-only.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    event.respondWith(fetch(request).catch(() => new Response(
      JSON.stringify({ error: 'Network error' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    )));
    return;
  }

  // Network first strategy for HTML pages
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache, then to the dedicated offline page
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return caches.match('/offline.html').then((offline) => {
              return offline || new Response('Offline - Page not cached', { status: 503 });
            });
          });
        })
    );
    return;
  }

  // Cache first strategy for assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Return a placeholder for failed assets
          if (request.headers.get('accept')?.includes('image')) {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#072E2A" width="100" height="100"/></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          }
          return new Response('Asset unavailable', { status: 503 });
        });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Allow page to schedule a background prayer reminder
  if (event.data && event.data.type === 'SHOW_PRAYER_NOTIFICATION') {
    const { prayerName } = event.data;
    event.waitUntil(self.registration.showNotification(`حان وقت صلاة ${prayerName}`, {
      body: 'الصلاة خير من النوم — حافظ على صلاتك',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: `prayer-${prayerName}`,
      data: { url: '/prayer-times' },
      dir: 'rtl',
      lang: 'ar',
    }));
  }
  // Dhikr / Salawat reminder while the service worker is controlling the page.
  if (event.data && event.data.type === 'SHOW_DHIKR_NOTIFICATION') {
    const { text, kind } = event.data;
    const isSalawat = kind === 'salawat';
    event.waitUntil(self.registration.showNotification(
      isSalawat ? 'تذكير بالصلاة على النبي' : 'تذكير بالذكر',
      {
        body: text ?? (isSalawat ? 'اللهم صلِّ وسلم على نبينا محمد' : 'سبحان الله وبحمده'),
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: isSalawat ? 'salawat-reminder' : 'dhikr-reminder',
        data: { url: '/adhkar' },
        dir: 'rtl',
        lang: 'ar',
      },
    ));
  }
});

// Handle encrypted Web Push payloads from the trusted notification worker.
self.addEventListener('push', (event) => {
  let data = {
    title: 'تذكير ذِكر',
    body: 'افتح التطبيق للاطلاع على الإشعار',
    url: '/',
    tag: 'zikr-reminder',
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // A malformed payload must not prevent the browser from showing a safe fallback.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag,
      data: { url: typeof data.url === 'string' && data.url.startsWith('/') ? data.url : '/' },
      renotify: false,
      dir: 'rtl',
      lang: 'ar',
    })
  );
});

// Notification click — focus an existing ZIKR tab or open the notification target.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        const url = new URL(client.url);
        if (url.origin === self.location.origin && 'focus' in client) {
          if (url.pathname === target) return client.focus();
          return client.navigate(target).then((navigated) => navigated?.focus());
        }
      }
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
