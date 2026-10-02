import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();

const requiredRoutes = [
  'src/app/page.tsx',
  'src/app/quran/page.tsx',
  'src/app/quran/[surah]/page.tsx',
  'src/app/quran/[surah]/[ayah]/page.tsx',
  'src/app/hadith/page.tsx',
  'src/app/hadith/[book]/page.tsx',
  'src/app/hadith/[book]/[id]/page.tsx',
  'src/app/stories/page.tsx',
  'src/app/stories/[slug]/page.tsx',
  'src/app/prophets/page.tsx',
  'src/app/prophets/[slug]/page.tsx',
  'src/app/scholars/page.tsx',
  'src/app/scholars/[slug]/page.tsx',
  'src/app/articles/page.tsx',
  'src/app/articles/[slug]/page.tsx',
  'src/app/videos/page.tsx',
  'src/app/videos/[slug]/page.tsx',
  'src/app/youtube/page.tsx',
  'src/app/adhkar/page.tsx',
  'src/app/dua/page.tsx',
  'src/app/dua/[slug]/page.tsx',
  'src/app/prayer-times/page.tsx',
  'src/app/kids/page.tsx',
  'src/app/kids/[slug]/page.tsx',
  'src/app/kids/puzzle/page.tsx',
  'src/app/memorization/page.tsx',
  'src/app/spiritual-ai/page.tsx',
  'src/app/favorites/page.tsx',
  'src/app/profile/page.tsx',
  'src/app/search/page.tsx',
  'src/app/auth/login/page.tsx',
  'src/app/auth/register/page.tsx',
  'src/app/auth/forgot/page.tsx',
  'src/app/auth/reset/page.tsx',
  'src/app/auth/callback/route.ts',
  'src/app/admin/page.tsx',
  'src/app/admin/analytics/page.tsx',
  'src/app/admin/battles/page.tsx',
  'src/app/admin/content/page.tsx',
  'src/app/admin/kids/page.tsx',
  'src/app/admin/prophets/page.tsx',
  'src/app/admin/sections/page.tsx',
  'src/app/admin/users/page.tsx',
  'src/app/admin/videos/page.tsx',
  'src/app/about/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/editorial-policy/page.tsx',
  'src/app/terms/page.tsx',
  'src/app/faq/page.tsx',
  'src/app/platform/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/qibla/page.tsx',
  'src/app/tasbeeh/page.tsx',
  'src/app/wird/page.tsx',
  'src/app/zakat/page.tsx',
  'src/app/radio/page.tsx',
  'src/app/reciters/page.tsx',
  'src/app/reciters/[slug]/page.tsx',
  'src/app/tafsir/page.tsx',
  'src/app/companions/page.tsx',
  'src/app/companions/[slug]/page.tsx',
  'src/app/battles/page.tsx',
  'src/app/battles/[slug]/page.tsx',
  'src/app/conquests/page.tsx',
  'src/app/conquests/[slug]/page.tsx',
  'src/app/tawasheeh/page.tsx',
  'src/app/poetry/page.tsx',
  'src/app/competitions/page.tsx',
  'src/app/sitemap.ts',
  'src/app/robots.ts',
  'src/app/manifest.ts',
  'public/sw.js',
  'public/offline.html',
  'public/icons/icon-192.svg',
  'public/icons/icon-512.svg',
];

const failures = [];
const warnings = [];

for (const route of requiredRoutes) {
  if (!existsSync(join(root, route))) {
    failures.push(`Missing required platform route or asset: ${route}`);
  }
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name === 'page.tsx' || entry.name === 'route.ts') out.push(full);
  }
  return out;
}

function normalizeRoutePath(file) {
  const relativePath = relative(join(root, 'src', 'app'), file).replaceAll('\\', '/');
  const suffix = relativePath.endsWith('/page.tsx')
    ? relativePath.slice(0, -'/page.tsx'.length)
    : relativePath.slice(0, -'/route.ts'.length);

  const cleaned = suffix
    .split('/')
    .filter(Boolean)
    .filter((segment) => !/^\([^/]+\)$/.test(segment))
    .filter((segment) => segment !== '_private')
    .join('/');

  return '/' + cleaned;
}

const discoveredRoutes = walk(join(root, 'src', 'app'));
const pages = discoveredRoutes.filter((file) => file.endsWith('/page.tsx'));
const apis = discoveredRoutes.filter((file) => file.endsWith('/route.ts'));
const normalized = new Map();

for (const file of discoveredRoutes) {
  const routePath = normalizeRoutePath(file);
  const type = file.endsWith('/page.tsx') ? 'page' : 'api';
  const key = `${type}:${routePath}`;
  const existing = normalized.get(key);
  if (existing) {
    failures.push(
      `Duplicate normalized ${type} route: ${routePath} from ${relative(root, existing)} and ${relative(root, file)}`,
    );
  } else {
    normalized.set(key, file);
  }

  if (routePath === '/') {
    const conflicting = normalized.get(`api:/`);
    if (type === 'page' && conflicting) {
      failures.push('Root path cannot contain both page.tsx and route.ts.');
    }
  }
}

const pagePaths = new Set(pages.map((file) => normalizeRoutePath(file)));
const apiPaths = new Set(apis.map((file) => normalizeRoutePath(file)));

for (const path of pagePaths) {
  if (apiPaths.has(path)) {
    failures.push(`A page and API route resolve to the same normalized path: ${path}`);
  }
}

const duplicateRequired = requiredRoutes.filter(
  (route, index) => requiredRoutes.indexOf(route) !== index,
);
if (duplicateRequired.length) {
  failures.push(`Duplicate required-route declarations: ${[...new Set(duplicateRequired)].join(', ')}`);
}

if (pages.length < 1) failures.push('No page routes discovered under src/app');
if (apis.length < 1) failures.push('No API routes discovered under src/app');

if (pages.length !== 125 || apis.length !== 71) {
  warnings.push(
    `Route inventory drift: discovered ${pages.length} pages and ${apis.length} API routes.`,
  );
}

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

for (const warning of warnings) console.warn(`⚠️ ${warning}`);
console.log(`✅ Verified ${requiredRoutes.length} required assets plus ${pages.length} page routes and ${apis.length} API routes`);
