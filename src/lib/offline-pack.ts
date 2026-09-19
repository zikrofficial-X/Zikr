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
};

const MANIFEST_URL = "/offline-content/v1/manifest.json";
const MANIFEST_DB_KEY = "offline_manifest";
const COMPLETION_DB_KEY = "offline_completion_v1";
// v4 reflects the expanded public-route discovery and batched offline strategy.
const VERSION_KEY = "offline-content-version-v4";
const OFFLINE_CACHE_NAME = "zikr-v12";
// Keep the client verifier, offline pack, and Service Worker on one cache name.
const ROUTE_CACHE_REQUEST = "CACHE_OFFLINE_ROUTES";

export function isCacheableOfflinePageRoute(route: string): boolean {
  if (typeof route !== "string" || !route.startsWith("/") || route.startsWith("//")) {
    return false;
  }
  const pathname = route.replace(/\/+$/, "") || "/";
  if (
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/sitemap-index.xml"
  ) {
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
  failedDatasets: string[];
  cachedRoutes: number;
  failedRoutes: string[];
};

function mergedRoutes(manifest: OfflineManifest): string[] {
  return Array.from(
    new Set([...ESSENTIAL_ROUTES, ...(manifest.routes ?? [])])
  ).filter(isCacheableOfflinePageRoute);
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
  try {
    await offlineDb.saveSetting(COMPLETION_DB_KEY, completion);
  } catch (error) {
    console.warn("[OfflinePack] Failed to persist completion marker", error);
  }
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
    const completion =
      await offlineDb.getSetting<OfflineCompletion>(COMPLETION_DB_KEY);
    if (!completion || completion.version !== manifest.version) return null;

    for (const [dataset, definition] of Object.entries(manifest.datasets)) {
      const storeName = STORE_BY_DATASET[dataset];
      if (
        !storeName ||
        completion.datasetCounts[storeName] !== definition.count
      )
        return null;
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
      routes.map(route => cache.match(new Request(route)))
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

export async function hydrateOfflineContent(
  options: { force?: boolean; cacheRoutes?: boolean } = {}
): Promise<OfflineHydrationResult | null> {
  if (typeof window === "undefined") return null;

  const manifest = await fetchOfflineManifest();
  if (!manifest) return null;

  try {
    await offlineDb.initialize();
  } catch (error) {
    console.warn("[OfflinePack] Failed to initialize IndexedDB", error);
    return {
      manifest,
      complete: false,
      failedDatasets: ["indexeddb"],
      cachedRoutes: 0,
      failedRoutes: mergedRoutes(manifest),
    };
  }

  const expectedRoutes = mergedRoutes(manifest);
  if (!options.force) {
    const completion = await verifyCompletedDatasets(manifest);
    if (
      completion &&
      completion.cachedRoutes.length === expectedRoutes.length &&
      (await verifyCompletedRoutes(completion.cachedRoutes))
    ) {
      return {
        manifest,
        complete: true,
        failedDatasets: [],
        cachedRoutes: completion.cachedRoutes.length,
        failedRoutes: [],
      };
    }
  }

  const failedDatasets: string[] = [];
  const datasetCounts: Record<string, number> = {};

  for (const [dataset, definition] of Object.entries(manifest.datasets)) {
    const storeName = STORE_BY_DATASET[dataset];
    if (!storeName || !definition?.path) {
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
      const rows = await response.json();
      if (!Array.isArray(rows) || rows.length !== definition.count) {
        failedDatasets.push(dataset);
        continue;
      }
      await offlineDb.setMany(storeName, rows);
      datasetCounts[storeName] = await offlineDb.count(storeName);
      if (datasetCounts[storeName] !== definition.count)
        failedDatasets.push(dataset);
    } catch (error) {
      failedDatasets.push(dataset);
      console.warn(`[OfflinePack] Failed to hydrate ${dataset}`, error);
    }
  }

  const complete = failedDatasets.length === 0;
  let cachedRoutes: string[] = [];
  let failedRoutes: string[] = [];

  if (complete && options.cacheRoutes) {
    const batchedResults: Array<{
      cachedRoutes: number;
      failedRoutes: string[];
    }> = [];
    const ROUTE_CACHE_BATCH_SIZE = 160;

    for (let index = 0; index < expectedRoutes.length; index += ROUTE_CACHE_BATCH_SIZE) {
      const batch = expectedRoutes.slice(index, index + ROUTE_CACHE_BATCH_SIZE);
      batchedResults.push(await requestOfflineRouteCache(batch));
    }

    const allFailedRoutes = Array.from(
      new Set(batchedResults.flatMap(result => result.failedRoutes))
    );
    cachedRoutes = expectedRoutes.filter(route => !allFailedRoutes.includes(route));
    failedRoutes = allFailedRoutes;
  }

  if (
    complete &&
    failedRoutes.length === 0 &&
    cachedRoutes.length === expectedRoutes.length
  ) {
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
    try {
      await offlineDb.delete("settings", COMPLETION_DB_KEY);
      window.localStorage.removeItem(VERSION_KEY);
    } catch {
      // Preserve already-downloaded datasets but do not keep a stale completion marker.
    }
  }

  return {
    manifest,
    complete,
    failedDatasets,
    cachedRoutes: cachedRoutes.length,
    failedRoutes,
  };
}

export async function getOfflineDataset<T>(dataset: string): Promise<T[]> {
  const storeName = STORE_BY_DATASET[dataset];
  if (!storeName) return [];
  await offlineDb.initialize();
  return offlineDb.getAll<T>(storeName);
}
