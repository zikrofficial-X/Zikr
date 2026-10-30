"use client";

import { offlineDb } from "@/lib/offline-db";

type OfflineManifest = {
  version: string;
  generatedAt: string;
  source: string;
  licenseNote: string;
  datasets: Record<string, { path: string; count: number }>;
  routes: string[];
};

const STORE_BY_DATASET: Record<string, string> = {
  surahs: "surahs",
  ayahs: "ayahs",
  tafsir: "tafsir",
  hadith_books: "hadithBooks",
  hadith: "hadith",
  prophets: "prophets",
  prophet_sections: "prophetSections",
  battles: "battles",
  battle_events: "battleEvents",
  conquests: "conquests",
  conquest_events: "conquestEvents",
  articles: "articles",
  duas: "duas",
  kids: "kids",
  companions: "companions",
  companion_stories: "companionStories",
  scholars: "scholars",
  stories: "stories",
  article_categories: "articleCategories",
};

const MANIFEST_URL = "/offline-content/v1/manifest.json";
const MANIFEST_DB_KEY = "offline_manifest";
const COMPLETION_DB_KEY = "offline_completion_v1";
// v4 reflects the expanded public-route discovery and batched offline strategy.
const VERSION_KEY = "offline-content-version-v6";
const OFFLINE_CACHE_NAME = "zikr-v14";
const ROUTE_SNAPSHOT_URL = "/offline-content/v2/routes.json";
// Keep the client verifier, offline pack, and Service Worker on one cache name.
const ROUTE_CACHE_REQUEST = "CACHE_OFFLINE_ROUTES";
const CLEAR_OFFLINE_REQUEST = "CLEAR_OFFLINE_LIBRARY";

const OFFLINE_CONTENT_STORES = [
  "surahs",
  "ayahs",
  "tafsir",
  "hadith_books",
  "hadith",
  "prophets",
  "prophet_sections",
  "battles",
  "battle_events",
  "conquests",
  "conquest_events",
  "articles",
  "duas",
  "kids",
  "companions",
  "companion_stories",
  "scholars",
  "stories",
  "article_categories",
] as const;

export function isCacheableOfflinePageRoute(route: string): boolean {
  if (typeof route !== "string" || !route.startsWith("/") || route.startsWith("//")) {
    return false;
  }

  let pathname: string;
  try {
    pathname = new URL(route, typeof window === "undefined" ? "https://zikr.invalid" : window.location.origin).pathname;
  } catch {
    return false;
  }
  pathname = pathname.replace(/\/+$/, "") || "/";

  const excludedFiles = new Set([
    "/manifest.webmanifest",
    "/sw.js",
    "/robots.txt",
    "/sitemap.xml",
    "/sitemap-index.xml",
  ]);
  if (excludedFiles.has(pathname)) return false;

  const privatePrefixes = [
    "/api",
    "/auth",
    "/admin",
    "/profile",
    "/favorites",
    "/settings",
    "/account",
    "/dashboard",
  ];
  if (privatePrefixes.some(prefix => pathname === prefix || pathname.startsWith(prefix + "/"))) {
    return false;
  }

  return !/\.(?:json|js|css|xml|txt|map|svg|png|jpe?g|gif|webp|ico|woff2?|mp3|wav|mp4|webm)$/i.test(pathname);
}

const ESSENTIAL_ROUTES = [
  "/", "/mushaf", "/quran", "/hadith", "/stories", "/articles", "/duas", "/adhkar",
  "/prophets", "/companions", "/scholars", "/battles", "/conquests", "/kids", "/videos",
  "/youtube", "/tawasheeh", "/tafsir", "/reciters", "/radio", "/qibla", "/tasbeeh",
  "/wird", "/zakat", "/poetry", "/competitions", "/faq", "/platform", "/about", "/contact",
  "/privacy", "/terms", "/editorial-policy", "/settings", "/offline-library",
  "/scholars/ahmad-ibn-hanbal", "/scholars/albani", "/scholars/bukhari", "/scholars/ibn-baz",
  "/scholars/ibn-qayyim", "/scholars/ibn-taymiyyah", "/scholars/malik-ibn-anas", "/scholars/nawawi",
  "/scholars/saadi", "/scholars/shaarawi", "/scholars/shafii", "/scholars/uthaymin",
  "/videos/importance-of-prayer", "/videos/lecture-tawakkul", "/videos/morning-evening-adhkar",
  "/videos/quran-duas-collection", "/videos/story-of-musa-full", "/videos/story-of-yusuf-full",
  "/videos/tafsir-al-baqarah-uthaymin", "/videos/tafsir-al-fatihah-shaarawi", "/videos/tafsir-ya-sin-shaarawi",
];

type OfflineCompletion = {
  version: string;
  datasetCounts: Record<string, number>;
  cachedRoutes: string[];
};

export type OfflineHydrationResult = {
  manifest: OfflineManifest;
  complete: boolean;
  routesComplete: boolean;
  fullyComplete: boolean;
  failedDatasets: string[];
  cachedRoutes: number;
  totalRoutes: number;
  failedRoutes: string[];
};

function mergedRoutes(manifest: OfflineManifest, supplementalRoutes: string[] = [], additionalRoutes: string[] = []): string[] {
  return Array.from(
    new Set([...ESSENTIAL_ROUTES, ...(manifest.routes ?? []), ...supplementalRoutes, ...additionalRoutes])
  ).filter(isCacheableOfflinePageRoute);
}

async function fetchSupplementalRouteInventory(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const response = await fetch(ROUTE_SNAPSHOT_URL, { cache: "no-store" });
    if (response.ok) {
      const routes: unknown = await response.json();
      if (Array.isArray(routes)) {
        return routes.filter((route): route is string => typeof route === "string" && isCacheableOfflinePageRoute(route));
      }
    }
  } catch {
    // Offline: use the service-worker or browser cache copy when available.
  }
  try {
    const cached = await caches.match(ROUTE_SNAPSHOT_URL);
    if (!cached?.ok) return [];
    const routes: unknown = await cached.json();
    return Array.isArray(routes)
      ? routes.filter((route): route is string => typeof route === "string" && isCacheableOfflinePageRoute(route))
      : [];
  } catch {
    return [];
  }
}

async function persistManifest(manifest: OfflineManifest): Promise<void> {
  try {
    await offlineDb.initialize();
    await offlineDb.saveSetting(MANIFEST_DB_KEY, manifest);
  } catch (error) {
    console.warn(
      "[OfflinePack] Failed to persist manifest in IndexedDB",
      error
    );
  }

  try {
    if ("caches" in window) {
      const cache = await caches.open(OFFLINE_CACHE_NAME);
      await cache.put(
        new Request(MANIFEST_URL, { headers: { Accept: "application/json" } }),
        new Response(JSON.stringify(manifest), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store",
          },
        })
      );
    }
  } catch (error) {
    console.warn(
      "[OfflinePack] Failed to persist manifest in Cache Storage",
      error
    );
  }
}

async function persistCompletion(completion: OfflineCompletion): Promise<void> {
  // A full-pack success marker is part of the verification contract. Never
  // report success when IndexedDB could not persist it.
  await offlineDb.saveSetting(COMPLETION_DB_KEY, completion);
}

async function readPersistedManifest(): Promise<OfflineManifest | null> {
  try {
    await offlineDb.initialize();
    const manifest =
      await offlineDb.getSetting<OfflineManifest>(MANIFEST_DB_KEY);
    if (manifest?.datasets && manifest?.routes) return manifest;
  } catch {
    // Continue to Cache Storage fallback.
  }

  try {
    const cached = await caches.match(MANIFEST_URL);
    if (cached?.ok) return (await cached.json()) as OfflineManifest;
  } catch {
    // Continue to network fallback.
  }

  return null;
}

async function verifyCompletedDatasets(
  manifest: OfflineManifest
): Promise<OfflineCompletion | null> {
  try {
    const completion = await offlineDb.getSetting<OfflineCompletion>(COMPLETION_DB_KEY);
    if (!completion || completion.version !== manifest.version || !Array.isArray(completion.cachedRoutes)) return null;

    for (const [dataset, definition] of Object.entries(manifest.datasets)) {
      const storeName = STORE_BY_DATASET[dataset];
      if (!storeName || completion.datasetCounts?.[storeName] !== definition.count) return null;
      if ((await offlineDb.count(storeName)) !== definition.count) return null;
    }
    return completion;
  } catch {
    return null;
  }
}

async function verifyCompletedRoutes(routes: string[]): Promise<boolean> {
  if (!("caches" in window)) return false;
  try {
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    const results = await Promise.all(
      routes.map(route => cache.match(new Request(new URL(route, window.location.origin).href, { headers: { Accept: "text/html" } })))
    );
    return results.every(Boolean);
  } catch {
    return false;
  }
}

export async function fetchOfflineManifest(): Promise<OfflineManifest | null> {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch(MANIFEST_URL, { cache: "no-store" });
    if (response.ok) {
      const manifest = (await response.json()) as OfflineManifest;
      await persistManifest(manifest);
      return manifest;
    }
  } catch {
    // Offline: fall through to persistent local copies.
  }

  return readPersistedManifest();
}

export async function requestOfflineRouteCache(
  routes: string[]
): Promise<{ cachedRoutes: number; failedRoutes: string[] }> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return { cachedRoutes: 0, failedRoutes: routes };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const worker =
      registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) return { cachedRoutes: 0, failedRoutes: routes };

    return await new Promise(resolve => {
      const channel = new MessageChannel();
      const timeoutId = window.setTimeout(() => {
        channel.port1.onmessage = null;
        resolve({ cachedRoutes: 0, failedRoutes: routes });
      }, 180_000);

      channel.port1.onmessage = event => {
        window.clearTimeout(timeoutId);
        const data = (event.data ?? {}) as {
          cachedRoutes?: number;
          failedRoutes?: string[];
        };
        resolve({
          cachedRoutes: Number(data.cachedRoutes ?? 0),
          failedRoutes: Array.isArray(data.failedRoutes)
            ? data.failedRoutes
            : routes,
        });
      };

      worker.postMessage({ type: ROUTE_CACHE_REQUEST, routes }, [
        channel.port2,
      ]);
    });
  } catch {
    return { cachedRoutes: 0, failedRoutes: routes };
  }
}

export async function clearOfflineLibrary(): Promise<void> {
  await offlineDb.initialize();

  for (const storeName of OFFLINE_CONTENT_STORES) {
    await offlineDb.clear(
      ({
        surahs: "surahs",
        ayahs: "ayahs",
        tafsir: "tafsir",
        hadith_books: "hadithBooks",
        hadith: "hadith",
        prophets: "prophets",
        prophet_sections: "prophetSections",
        battles: "battles",
        battle_events: "battleEvents",
        conquests: "conquests",
        conquest_events: "conquestEvents",
        articles: "articles",
        duas: "duas",
        kids: "kids",
        companions: "companions",
        companion_stories: "companionStories",
        scholars: "scholars",
        stories: "stories",
        article_categories: "articleCategories",
      } as const)[storeName],
    );
  }

  await offlineDb.clear("cache");
  await offlineDb.delete("settings", MANIFEST_DB_KEY).catch(() => undefined);
  await offlineDb.delete("settings", COMPLETION_DB_KEY).catch(() => undefined);

  try {
    window.localStorage.removeItem(VERSION_KEY);
  } catch {
    // Ignore restricted localStorage.
  }

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.ready;
    const worker =
      registration.active ?? registration.waiting ?? registration.installing;

    if (worker) {
      await new Promise<void>((resolve, reject) => {
        const channel = new MessageChannel();
        const timeoutId = window.setTimeout(() => {
          channel.port1.onmessage = null;
          reject(new Error("Timed out waiting for the service worker to confirm the offline cache clear."));
        }, 30_000);

        channel.port1.onmessage = event => {
          window.clearTimeout(timeoutId);
          const result = (event.data ?? {}) as { ok?: boolean; error?: string };
          if (result.ok === true) resolve();
          else reject(new Error(result.error || "Service worker did not confirm the offline cache was cleared."));
        };

        worker.postMessage({ type: CLEAR_OFFLINE_REQUEST }, [channel.port2]);
      });
    }
  }
}

export type OfflineRouteProgress = {
  cachedRoutes: number;
  failedRoutes: string[];
  totalRoutes: number;
};

export async function hydrateOfflineContent(
  options: {
    force?: boolean;
    cacheRoutes?: boolean;
    additionalRoutes?: string[];
    onRouteProgress?: (progress: OfflineRouteProgress) => void;
  } = {}
): Promise<OfflineHydrationResult | null> {
  if (typeof window === "undefined") return null;

  const manifest = await fetchOfflineManifest();
  if (!manifest) return null;

  try {
    await offlineDb.initialize();
  } catch (error) {
    console.warn("[OfflinePack] Failed to initialize IndexedDB", error);
    const routeInventory = mergedRoutes(manifest, await fetchSupplementalRouteInventory(), options.additionalRoutes);
    return {
      manifest,
      complete: false,
      routesComplete: false,
      fullyComplete: false,
      failedDatasets: ["indexeddb"],
      cachedRoutes: 0,
      totalRoutes: routeInventory.length,
      failedRoutes: routeInventory,
    };
  }

  const routeInventory = mergedRoutes(
    manifest,
    await fetchSupplementalRouteInventory(),
    options.additionalRoutes,
  );

  if (!options.force) {
    const completion = await verifyCompletedDatasets(manifest);
    if (
      completion &&
      routeInventory.every(route => completion.cachedRoutes.includes(route)) &&
      (await verifyCompletedRoutes(completion.cachedRoutes))
    ) {
      return {
        manifest,
        complete: true,
        routesComplete: true,
        fullyComplete: true,
        failedDatasets: [],
        cachedRoutes: completion.cachedRoutes.length,
        totalRoutes: completion.cachedRoutes.length,
        failedRoutes: [],
      };
    }
  }

  if (options.force) {
    await offlineDb.delete("settings", COMPLETION_DB_KEY).catch(() => undefined);
    try {
      window.localStorage.removeItem(VERSION_KEY);
    } catch {
      // IndexedDB remains authoritative if Web Storage is restricted.
    }
  }

  const failedDatasets: string[] = [];
  const datasetCounts: Record<string, number> = {};

  for (const [dataset, definition] of Object.entries(manifest.datasets)) {
    const storeName = STORE_BY_DATASET[dataset];
    if (!storeName || !definition?.path || !Number.isInteger(definition.count) || definition.count < 0) {
      failedDatasets.push(dataset);
      continue;
    }

    try {
      const response = await fetch(definition.path, {
        cache: options.force ? "no-store" : "force-cache",
      });
      if (!response.ok) {
        failedDatasets.push(dataset);
        continue;
      }

      const rows: unknown = await response.json();
      if (!Array.isArray(rows) || rows.length !== definition.count) {
        failedDatasets.push(dataset);
        continue;
      }

      // Replace, do not append: removed/unpublished rows must not survive in local storage.
      await offlineDb.clear(storeName);
      if (rows.length > 0) await offlineDb.setMany(storeName, rows);
      datasetCounts[storeName] = await offlineDb.count(storeName);
      if (datasetCounts[storeName] !== definition.count) failedDatasets.push(dataset);
    } catch (error) {
      failedDatasets.push(dataset);
      console.warn(`[OfflinePack] Failed to hydrate ${dataset}`, error);
    }
  }

  const complete = failedDatasets.length === 0;
  let cachedRoutes: string[] = [];
  let failedRoutes: string[] = [];

  if (complete && options.cacheRoutes) {
    const ROUTE_CACHE_BATCH_SIZE = 120;
    const failures = new Set<string>();
    let cachedCount = 0;

    for (let index = 0; index < routeInventory.length; index += ROUTE_CACHE_BATCH_SIZE) {
      const batch = routeInventory.slice(index, index + ROUTE_CACHE_BATCH_SIZE);
      const result = await requestOfflineRouteCache(batch);
      cachedCount += result.cachedRoutes;
      for (const route of result.failedRoutes) failures.add(route);

      options.onRouteProgress?.({
        cachedRoutes: cachedCount,
        failedRoutes: Array.from(failures),
        totalRoutes: routeInventory.length,
      });
    }

    failedRoutes = Array.from(failures);
    cachedRoutes = routeInventory.filter(route => !failures.has(route));
  }

  const routesComplete =
    Boolean(options.cacheRoutes) &&
    failedRoutes.length === 0 &&
    cachedRoutes.length === routeInventory.length;
  const fullyComplete = complete && routesComplete;

  if (fullyComplete) {
    await persistManifest(manifest);
    await persistCompletion({
      version: manifest.version,
      datasetCounts,
      cachedRoutes,
    });
    try {
      window.localStorage.setItem(VERSION_KEY, manifest.version);
    } catch {
      // IndexedDB completion is authoritative when Web Storage is restricted.
    }
  } else {
    await offlineDb.delete("settings", COMPLETION_DB_KEY).catch(() => undefined);
    try {
      window.localStorage.removeItem(VERSION_KEY);
    } catch {
      // Preserve partial datasets but do not retain a stale full-pack marker.
    }
  }

  return {
    manifest,
    complete,
    routesComplete,
    fullyComplete,
    failedDatasets,
    cachedRoutes: cachedRoutes.length,
    totalRoutes: routeInventory.length,
    failedRoutes,
  };
}

export async function getOfflineDataset<T>(dataset: string): Promise<T[]> {
  const storeName = STORE_BY_DATASET[dataset];
  if (!storeName) return [];
  await offlineDb.initialize();
  return offlineDb.getAll<T>(storeName);
}
