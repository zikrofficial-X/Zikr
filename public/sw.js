// Service Worker for Zikr PWA
const CACHE_NAME = "zikr-v11";
const OFFLINE_CONTENT_PREFIX = "/offline-content/";
const MAX_OFFLINE_ROUTES = 400;
const ROUTE_CACHE_CONCURRENCY = 4;

const PUBLIC_CONTENT_API_PREFIXES = [
  "/api/content/articles",
  "/api/content/companions",
  "/api/content/prophets",
  "/api/content/stories",
  "/api/duas",
  "/api/hadith/books",
  "/api/quran/surahs",
  "/api/search",
  "/api/tawasheeh",
  "/api/kids/games/verse",
];

function isPublicContentApi(url) {
  return PUBLIC_CONTENT_API_PREFIXES.some(
    prefix => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`)
  );
}

function isSafeOfflineRoute(route) {
  if (
    typeof route !== "string" ||
    !route.startsWith("/") ||
    route.startsWith("//")
  )
    return false;
  const pathname = new URL(route, self.location.origin).pathname;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/favorites")
  ) {
    return false;
  }
  return true;
}

function absoluteSameOriginUrl(value) {
  try {
    const url = new URL(value, self.location.origin);
    return url.origin === self.location.origin ? url : null;
  } catch {
    return null;
  }
}

async function cacheReferencedStaticAssets(html, cache) {
  const refs = [];
  const pattern = /<(?:script|link|img)[^>]+(?:src|href)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(pattern)) {
    const url = absoluteSameOriginUrl(match[1]);
    if (!url) continue;
    if (!(
      url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/branding/") ||
      url.pathname.startsWith("/images/") ||
      url.pathname.startsWith("/audio/")
    )) {
      continue;
    }
    refs.push(url.href);
  }

  const uniqueRefs = [...new Set(refs)].slice(0, 80);
  await Promise.allSettled(
    uniqueRefs.map(async href => {
      try {
        const request = new Request(href, { method: "GET" });
        if (await cache.match(request)) return;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
      } catch {
        // A non-critical asset failure must not fail the route cache.
      }
    })
  );
}

async function cacheOfflineRoute(route, cache) {
  const url = absoluteSameOriginUrl(route);
  if (!url || !isSafeOfflineRoute(route)) return false;
  try {
    const fetchRequest = new Request(url.href, {
      method: "GET",
      headers: { Accept: "text/html" },
      cache: "no-store",
    });
    const cacheRequest = new Request(url.href, {
      method: "GET",
      headers: { Accept: "text/html" },
    });
    const response = await fetch(fetchRequest);
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("text/html")
    )
      return false;
    const html = await response.clone().text();
    await cache.put(
      cacheRequest,
      new Response(html, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      })
    );
    await cacheReferencedStaticAssets(html, cache);
    return true;
  } catch {
    return false;
  }
}

async function cacheOfflineRoutes(routes, replyPort) {
  const uniqueRoutes = [
    ...new Set(
      (Array.isArray(routes) ? routes : []).filter(isSafeOfflineRoute)
    ),
  ].slice(0, MAX_OFFLINE_ROUTES);
  const cache = await caches.open(CACHE_NAME);
  const failedRoutes = [];
  let cursor = 0;
  let cachedRoutes = 0;

  async function worker() {
    while (cursor < uniqueRoutes.length) {
      const index = cursor++;
      const route = uniqueRoutes[index];
      const ok = await cacheOfflineRoute(route, cache);
      if (ok) cachedRoutes += 1;
      else failedRoutes.push(route);
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          ROUTE_CACHE_CONCURRENCY,
          Math.max(uniqueRoutes.length, 1)
        ),
      },
      () => worker()
    )
  );

  replyPort?.postMessage({
    cachedRoutes,
    failedRoutes,
    requestedRoutes: uniqueRoutes.length,
  });
}

// The complete offline pack is cached explicitly by the user from the Offline Library page.
// Only the tiny shell is installed automatically so first install stays lightweight.
const CORE_INSTALL_ASSETS = [
  "/offline.html",
  "/offline-library",
  "/sw.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.allSettled(
        CORE_INSTALL_ASSETS.map(async asset => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn(`[SW] Failed to cache ${asset}:`, error);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) return caches.delete(cacheName);
          return undefined;
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (request.destination === "audio" || request.destination === "video")
    return;

  if (
    request.destination === "script" &&
    (url.hostname.includes("google") ||
      url.hostname.includes("pagead") ||
      url.hostname.includes("doubleclick"))
  ) {
    return;
  }

  if (url.pathname === "/offline-content/v1/manifest.json") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              cached =>
                cached ||
                new Response(
                  JSON.stringify({ error: "Offline manifest unavailable" }),
                  {
                    status: 503,
                    headers: { "Content-Type": "application/json" },
                  }
                )
            )
        )
    );
    return;
  }

  if (url.pathname.startsWith(OFFLINE_CONTENT_PREFIX)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  if (url.pathname === "/api/prayer-times") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              cached =>
                cached ||
                new Response(JSON.stringify({ error: "Network error" }), {
                  status: 503,
                  headers: { "Content-Type": "application/json" },
                })
            )
        )
    );
    return;
  }

  if (isPublicContentApi(url)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then(
              cached =>
                cached ||
                new Response(
                  JSON.stringify({
                    error: "Offline content is not cached yet",
                  }),
                  {
                    status: 503,
                    headers: { "Content-Type": "application/json" },
                  }
                )
            )
        )
    );
    return;
  }

  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: "Network error" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          })
      )
    );
    return;
  }

  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          return caches.match("/offline.html").then(
            offline =>
              offline ||
              new Response("Offline - Page not cached", { status: 503 })
          );
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (response.status === 200) {
            caches
              .open(CACHE_NAME)
              .then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          if (request.headers.get("accept")?.includes("image")) {
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#072E2A" width="100" height="100"/></svg>',
              { headers: { "Content-Type": "image/svg+xml" } }
            );
          }
          return new Response("Asset unavailable", { status: 503 });
        });
    })
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === "CACHE_OFFLINE_ROUTES") {
    event.waitUntil(
      cacheOfflineRoutes(event.data.routes, event.ports?.[0]).catch(error => {
        event.ports?.[0]?.postMessage({
          cachedRoutes: 0,
          failedRoutes: Array.isArray(event.data.routes)
            ? event.data.routes
            : [],
          error:
            error instanceof Error
              ? error.message
              : "Offline route cache failed",
        });
      })
    );
    return;
  }

  if (event.data && event.data.type === "SHOW_PRAYER_NOTIFICATION") {
    const { prayerName } = event.data;
    event.waitUntil(
      self.registration.showNotification(`حان وقت صلاة ${prayerName}`, {
        body: "الصلاة خير من النوم — حافظ على صلاتك",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: `prayer-${prayerName}`,
        data: { url: "/prayer-times" },
        dir: "rtl",
        lang: "ar",
      })
    );
  }

  if (event.data && event.data.type === "SHOW_DHIKR_NOTIFICATION") {
    const { text, kind } = event.data;
    const isSalawat = kind === "salawat";
    event.waitUntil(
      self.registration.showNotification(
        isSalawat ? "تذكير بالصلاة على النبي" : "تذكير بالذكر",
        {
          body:
            text ??
            (isSalawat
              ? "اللهم صلِّ وسلم على نبينا محمد"
              : "سبحان الله وبحمده"),
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: isSalawat ? "salawat-reminder" : "dhikr-reminder",
          data: { url: "/adhkar" },
          dir: "rtl",
          lang: "ar",
        }
      )
    );
  }
});

self.addEventListener("push", event => {
  let data = {
    title: "تذكير ذِكر",
    body: "افتح التطبيق للاطلاع على الإشعار",
    url: "/",
    tag: "zikr-reminder",
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // A malformed payload must not prevent the browser from showing a safe fallback.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: {
        url:
          typeof data.url === "string" && data.url.startsWith("/")
            ? data.url
            : "/",
      },
      renotify: false,
      dir: "rtl",
      lang: "ar",
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          const url = new URL(client.url);
          if (url.origin === self.location.origin && "focus" in client) {
            if (url.pathname === target) return client.focus();
            return client
              .navigate(target)
              .then(navigated => navigated?.focus());
          }
        }
        if (clients.openWindow) return clients.openWindow(target);
      })
  );
});
