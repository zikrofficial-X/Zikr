import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = [
  'app/layout.tsx',
  'lib/site.ts',
  'app/robots.ts',
  'app/sitemap.ts',
  'app/about/page.tsx',
  'app/contact/page.tsx',
  'app/privacy/page.tsx',
  'app/editorial-policy/page.tsx',
  'app/terms/page.tsx',
  'public/ads.txt',
];

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`Missing required AdSense/SEO asset: ${file}`);
}

function read(file) {
  try {
    return readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  const result = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const info = statSync(path);
    if (info.isDirectory()) result.push(...walk(path));
    else if (/\.(tsx?|jsx?|mjs|cjs)$/.test(entry)) result.push(path);
  }
  return result;
}

const appCode = [...walk('app'), ...walk('components'), ...walk('lib')];
for (const file of appCode) {
  const source = read(file);
  if (/<img\b/i.test(source)) fail(`Raw <img> usage found in application code: ${file}`);
  if (/@next\/next\/no-img-element/.test(source)) fail(`Image lint suppression found in application code: ${file}`);
  if (/\b(?:lorem ipsum|todo|fixme|coming soon|under construction|example\.com)\b/i.test(source)) {
    fail(`Placeholder/development text found in application code: ${file}`);
  }
}

const layout = read('app/layout.tsx');
const site = read('lib/site.ts');
const adsTxt = read('public/ads.txt');
const nextConfig = read('next.config.ts');
const analytics = read('components/layout/analytics.tsx');

if (!/google-adsense-account/.test(layout)) fail('AdSense publisher meta tag is missing from app/layout.tsx.');
const layoutPublisher = layout.match(/ca-pub-\d{8,}/)?.[0] ?? null;
const adsTxtPublisher = adsTxt.match(/google\.com,\s*(pub-\d{8,})\s*,\s*DIRECT\s*,\s*f08c47fec0942fa0/i)?.[1] ?? null;
if (!adsTxtPublisher) fail('public/ads.txt does not contain a valid Google direct-seller entry.');
if (layoutPublisher && adsTxtPublisher && layoutPublisher !== adsTxtPublisher) {
  fail(`Publisher mismatch: layout=${layoutPublisher}, ads.txt=${adsTxtPublisher}.`);
}

if (!/sitemap\.xml/.test(read('app/robots.ts'))) fail('robots.ts does not advertise sitemap.xml.');
if (!/alternates:\s*\{\s*canonical:\s*["']\/["']/.test(layout)) warn('Root canonical is not declared in the expected metadata shape.');
if (/languages\s*:\s*\{[\s\S]*?en\s*:/.test(layout)) fail('English alternate metadata is present although the site is currently Arabic-only.');
if (/inLanguage:\s*\[\s*["']ar["']\s*,\s*["']en["']\s*\]/.test(layout)) fail('WebSite JSON-LD incorrectly advertises English content.');

if (/googletagmanager\.com/.test(analytics)) {
  if (!/www\.googletagmanager\.com/.test(nextConfig)) fail('Google Tag Manager domain is not allowed by the production CSP.');
  if (!/www\.google-analytics\.com/.test(nextConfig)) fail('Google Analytics endpoint is not allowed by the production CSP.');
}

const noindexPaths = [...site.matchAll(/"\/(?:search|qibla|prayer-times|tasbeeh|memorization|wird|zakat|offline-library|settings|favorites|profile|spiritual-ai|radio|youtube|reciters|tawasheeh)"/g)].length;
if (noindexPaths < 10) warn('Expected utility/account noindex coverage was not found in lib/site.ts.');

const publicEditorial = [
  'app/about/page.tsx',
  'app/contact/page.tsx',
  'app/privacy/page.tsx',
  'app/editorial-policy/page.tsx',
  'app/terms/page.tsx',
];
for (const file of publicEditorial) {
  if (read(file).trim().length < 600) warn(`Public trust/legal page is unusually short: ${file}`);
}

if (failures.length) {
  console.error('ADSENSE_READINESS_FAILED');
  for (const item of failures) console.error(`❌ ${item}`);
  for (const item of warnings) console.warn(`⚠️ ${item}`);
  process.exit(1);
}

console.log('ADSENSE_READINESS_PASSED');
console.log(`Checked ${requiredFiles.length} required assets and ${appCode.length} application source files.`);
for (const item of warnings) console.warn(`⚠️ ${item}`);
