'use client';

import { offlineDb } from '@/lib/offline-db';

type OfflineManifest = {
  version: string;
  generatedAt: string;
  source: string;
  licenseNote: string;
  datasets: Record<string, { path: string; count: number }>;
  routes: string[];
};

const STORE_BY_DATASET: Record<string, string> = {
  surahs: 'surahs',
  ayahs: 'ayahs',
  tafsir: 'tafsir',
  hadith_books: 'hadithBooks',
  hadith: 'hadith',
  prophets: 'prophets',
  prophet_sections: 'prophetSections',
  battles: 'battles',
  battle_events: 'battleEvents',
  conquests: 'conquests',
  conquest_events: 'conquestEvents',
  articles: 'articles',
  duas: 'duas',
  kids: 'kids',
  companions: 'companions',
  companion_stories: 'companionStories',
};

const MANIFEST_URL = '/offline-content/v1/manifest.json';
const MANIFEST_DB_KEY = 'offline_manifest';
const VERSION_KEY = 'offline-content-version-v3';
const ROUTE_CACHE_REQUEST = 'CACHE_OFFLINE_ROUTES';

// Public, non-personalized routes that should be available after the user
// explicitly downloads the complete offline pack. Personalized/admin routes
// are intentionally excluded.
const ESSENTIAL_ROUTES = [
  '/',
  '/mushaf',
  '/quran',
  '/hadith',
  '/stories',
  '/articles',
  '/duas',
  '/adhkar',
  '/prophets',
  '/companions',
  '/scholars',
  '/battles',
  '/conquests',
  '/kids',
  '/videos',
  '/youtube',
  '/tawasheeh',
  '/tafsir',
  '/reciters',
  '/radio',
  '/qibla',
  '/tasbeeh',
  '/wird',
  '/zakat',
  '/poetry',
  '/competitions',
  '/faq',
  '/platform',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/editorial-policy',
  '/settings',
  '/offline-library',
];

export type OfflineHydrationResult = {
  manifest: OfflineManifest;
  complete: boolean;
  failedDatasets: string[];
  cachedRoutes: number;
  failedRoutes: string[];
};

function mergedRoutes(manifest: OfflineManifest): string[] {
  return Array.from(new Set([...ESSENTIAL_ROUTES, ...(manifest.routes ?? [])]));
}

async function persistManifest(manifest: OfflineManifest): Promise<void> {
  try {
    await offlineDb.initialize();
    await offlineDb.saveSetting(MANIFEST_DB_KEY, manifest);
  } catch (error) {
    console.warn('[OfflinePack] Failed to persist manifest in IndexedDB', error);
  }

  try {
    if ('caches' in window) {
      const cache = await caches.open('zikr-v9');
      await cache.put(
        new Request(MANIFEST_URL, { headers: { Accept: 'application/json' } }),
        new Response(JSON.stringify(manifest), {
          headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
        }),
      );
    }
  } catch (error) {
    console.warn('[OfflinePack] Failed to persist manifest in Cache Storage', error);
  }
}

async function readPersistedManifest(): Promise<OfflineManifest | null> {
  try {
    await offlineDb.initialize();
    const manifest = await offlineDb.getSetting<OfflineManifest>(MANIFEST_DB_KEY);
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

export async function fetchOfflineManifest(): Promise<OfflineManifest | null> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(MANIFEST_URL, { cache: 'no-store' });
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
  routes: string[],
): Promise<{ cachedRoutes: number; failedRoutes: string[] }> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return { cachedRoutes: 0, failedRoutes: routes };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active ?? registration.waiting ?? registration.installing;
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
          failedRoutes: Array.isArray(data.failedRoutes) ? data.failedRoutes : routes,
        });
      };

      worker.postMessage(
        { type: ROUTE_CACHE_REQUEST, routes },
        [channel.port2],
      );
    });
  } catch {
    return { cachedRoutes: 0, failedRoutes: routes };
  }
}

export async function hydrateOfflineContent(
  options: { force?: boolean; cacheRoutes?: boolean } = {},
): Promise<OfflineHydrationResult | null> {
  if (typeof window === 'undefined') return null;

  const manifest = await fetchOfflineManifest();
  if (!manifest) return null;

  const previousVersion = window.localStorage.getItem(VERSION_KEY);
  if (!options.force && previousVersion === manifest.version && offlineDb.isReady()) {
    return {
      manifest,
      complete: true,
      failedDatasets: [],
      cachedRoutes: 0,
      failedRoutes: [],
    };
  }

  const failedDatasets: string[] = [];
  try {
    await offlineDb.initialize();
  } catch (error) {
    console.warn('[OfflinePack] Failed to initialize IndexedDB', error);
    return {
      manifest,
      complete: false,
      failedDatasets: ['indexeddb'],
      cachedRoutes: 0,
      failedRoutes: mergedRoutes(manifest),
    };
  }

  for (const [dataset, definition] of Object.entries(manifest.datasets)) {
    const storeName = STORE_BY_DATASET[dataset];
    if (!storeName || !definition?.path) {
      failedDatasets.push(dataset);
      continue;
    }

    try {
      const response = await fetch(definition.path, {
        cache: options.force ? 'no-store' : 'force-cache',
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
    } catch (error) {
      failedDatasets.push(dataset);
      console.warn(`[OfflinePack] Failed to hydrate ${dataset}`, error);
    }
  }

  const complete = failedDatasets.length === 0;
  if (complete) {
    window.localStorage.setItem(VERSION_KEY, manifest.version);
    await persistManifest(manifest);
  }

  let cachedRoutes = 0;
  let failedRoutes: string[] = [];
  if (complete && options.cacheRoutes) {
    const result = await requestOfflineRouteCache(mergedRoutes(manifest));
    cachedRoutes = result.cachedRoutes;
    failedRoutes = result.failedRoutes;
  }

  return {
    manifest,
    complete,
    failedDatasets,
    cachedRoutes,
    failedRoutes,
  };
}

export async function getOfflineDataset<T>(dataset: string): Promise<T[]> {
  const storeName = STORE_BY_DATASET[dataset];
  if (!storeName) return [];
  await offlineDb.initialize();
  return offlineDb.getAll<T>(storeName);
}
