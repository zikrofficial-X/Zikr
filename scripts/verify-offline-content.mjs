import { existsSync, readFileSync } from 'node:fs';

const manifestPath = 'public/offline-content/v1/manifest.json';
const routeSnapshotPath = 'public/offline-content/v2/routes.json';
const offlinePackPath = 'src/lib/offline-pack.ts';
const serviceWorkerPath = 'public/sw.js';
const offlineLibraryPath = 'src/app/offline-library/page.tsx';
const offlineLibraryClientPath = 'src/app/offline-library/offline-library-client.tsx';
const guardPath = 'src/components/layout/offline-navigation-guard.tsx';

const read = file => (existsSync(file) ? readFileSync(file, 'utf8') : '');
const failures = [];

for (const file of [
  manifestPath,
  routeSnapshotPath,
  offlinePackPath,
  serviceWorkerPath,
  offlineLibraryPath,
  offlineLibraryClientPath,
  guardPath,
]) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

try {
  const manifest = JSON.parse(read(manifestPath));
  if (!manifest.version) failures.push('Offline manifest has no version');
  if (!manifest.generatedAt) failures.push('Offline manifest has no generatedAt');
  if (!manifest.datasets || typeof manifest.datasets !== 'object') failures.push('Offline manifest has no datasets');
  if (!Array.isArray(manifest.routes) || manifest.routes.length < 20) failures.push('Offline manifest route inventory is unexpectedly small');

  for (const [name, definition] of Object.entries(manifest.datasets ?? {})) {
    if (!definition?.path || !Number.isInteger(definition.count) || definition.count <= 0) {
      failures.push(`Invalid dataset metadata: ${name}`);
      continue;
    }
    if (!definition.path.startsWith('/offline-content/')) {
      failures.push(`Dataset path outside offline-content: ${name}`);
      continue;
    }
    const file = `public/${definition.path.replace(/^\//, '')}`;
    if (!existsSync(file)) failures.push(`Missing dataset file: ${file}`);
  }

  const sensitivePrefixes = ['/api/', '/auth/', '/admin', '/profile', '/favorites', '/settings'];
  for (const route of manifest.routes ?? []) {
    if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//')) {
      failures.push(`Invalid offline route: ${String(route)}`);
      continue;
    }
    if (sensitivePrefixes.some(prefix => route === prefix || route.startsWith(`${prefix}/`))) {
      failures.push(`Sensitive route must not be in offline manifest: ${route}`);
    }
  }
} catch (error) {
  failures.push(`Offline manifest JSON is invalid: ${error instanceof Error ? error.message : 'unknown error'}`);
}

try {
  const routeSnapshot = JSON.parse(read(routeSnapshotPath));
  if (!Array.isArray(routeSnapshot) || routeSnapshot.length < 100) {
    failures.push('Offline v2 public route inventory is unexpectedly small');
  }
  const seen = new Set();
  const sensitivePrefixes = ['/api/', '/auth/', '/admin', '/profile', '/favorites', '/settings'];
  for (const route of routeSnapshot) {
    if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//')) {
      failures.push(`Invalid v2 offline route: ${String(route)}`);
      continue;
    }
    if (seen.has(route)) failures.push(`Duplicate v2 offline route: ${route}`);
    seen.add(route);
    if (sensitivePrefixes.some(prefix => route === prefix || route.startsWith(`${prefix}/`))) {
      failures.push(`Sensitive route must not be in v2 offline inventory: ${route}`);
    }
  }
} catch (error) {
  failures.push(`Offline v2 route inventory JSON is invalid: ${error instanceof Error ? error.message : 'unknown error'}`);
}

const offlinePack = read(offlinePackPath);
for (const token of [
  'offline_manifest',
  'offline_completion_v1',
  'verifyCompletedDatasets',
  'requestOfflineRouteCache',
  'cacheRoutes?: boolean',
  'offline-content-version-v4',
  'scholars/ahmad-ibn-hanbal',
  'videos/importance-of-prayer',
]) {
  if (!offlinePack.includes(token)) failures.push(`Offline pack missing ${token}`);
}

const serviceWorker = read(serviceWorkerPath);
for (const token of [
  'CACHE_NAME = "zikr-v12"',
  'OFFLINE_CONTENT_PREFIX',
  'CACHE_OFFLINE_ROUTES',
  'cacheOfflineRoutes',
  'cacheReferencedStaticAssets',
]) {
  if (!serviceWorker.includes(token)) failures.push(`Service worker missing ${token}`);
}
const htmlHandlerStart = serviceWorker.indexOf('if (request.headers.get("accept")?.includes("text/html"))');
if (htmlHandlerStart !== -1) {
  const htmlHandlerEnd = serviceWorker.indexOf("\n  event.respondWith(", htmlHandlerStart + 10);
  const htmlHandler = serviceWorker.slice(htmlHandlerStart, htmlHandlerEnd === -1 ? serviceWorker.length : htmlHandlerEnd);
  if (htmlHandler.includes('cache.put(request, response.clone())')) failures.push('Service worker must not cache generic HTML responses');
}
const coreMatch = serviceWorker.match(/const CORE_INSTALL_ASSETS = \[([\s\S]*?)\];/);
if (coreMatch && coreMatch[1].includes('"/"')) failures.push('Service worker must not pre-cache the root HTML route');
if (serviceWorker.includes('const CACHE_NAME = "zikr-v10"')) failures.push('Legacy service worker cache version zikr-v10 must not remain');

const offlineLibrary = read(offlineLibraryPath);
const offlineLibraryClient = read(offlineLibraryClientPath);
if (!offlineLibrary.includes('OfflineLibraryClient')) failures.push('Offline Library page does not render client component');
for (const token of ['cacheRoutes: false', 'تحديث وتجهيز المكتبة كاملة', 'SUPPLEMENTAL_ROUTE_URL', 'requestOfflineRouteCache']) {
  if (!offlineLibraryClient.includes(token)) failures.push(`Offline Library client missing ${token}`);
}

const guard = read(guardPath);
for (const token of ['navigator.onLine', 'stopImmediatePropagation', 'window.location.assign']) {
  if (!guard.includes(token)) failures.push(`Offline navigation guard missing ${token}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('✅ Offline core datasets, expanded v4 public route inventory, route-cache integration, durable completion, navigation safety, and Service Worker v12 checks passed');
