import { existsSync, readFileSync } from 'node:fs';

const manifestPath = 'public/offline-content/v1/manifest.json';
const offlinePackPath = 'lib/offline-pack.ts';
const serviceWorkerPath = 'public/sw.js';
const offlineLibraryPath = 'app/offline-library/page.tsx';
const guardPath = 'components/layout/offline-navigation-guard.tsx';

const read = file => (existsSync(file) ? readFileSync(file, 'utf8') : '');
const failures = [];

for (const file of [manifestPath, offlinePackPath, serviceWorkerPath, offlineLibraryPath, guardPath]) {
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

  const sensitivePrefixes = ['/api/', '/auth/', '/admin', '/profile', '/favorites'];
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

const offlinePack = read(offlinePackPath);
for (const token of [
  'offline_manifest',
  'offline_completion_v1',
  'verifyCompletedDatasets',
  'requestOfflineRouteCache',
  'cacheRoutes?: boolean',
  'offline-content-version-v3',
  'scholars/ahmad-ibn-hanbal',
  'videos/importance-of-prayer',
]) {
  if (!offlinePack.includes(token)) failures.push(`Offline pack missing ${token}`);
}

const serviceWorker = read(serviceWorkerPath);
for (const token of [
  "CACHE_NAME = 'zikr-v9'",
  'OFFLINE_CONTENT_PREFIX',
  'CACHE_OFFLINE_ROUTES',
  'cacheOfflineRoutes',
  'cacheReferencedStaticAssets',
]) {
  if (!serviceWorker.includes(token)) failures.push(`Service worker missing ${token}`);
}

const offlineLibrary = read(offlineLibraryPath);
if (!offlineLibrary.includes('cacheRoutes: true')) failures.push('Offline Library does not request full route caching');
if (!offlineLibrary.includes('تحديث وتجهيز الحزمة كاملة')) failures.push('Offline Library is missing the full-pack action');

const guard = read(guardPath);
for (const token of ['navigator.onLine', 'stopImmediatePropagation', 'window.location.assign']) {
  if (!guard.includes(token)) failures.push(`Offline navigation guard missing ${token}`);
}

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log('✅ Offline content, route cache, durable completion, and navigation safety checks passed');
