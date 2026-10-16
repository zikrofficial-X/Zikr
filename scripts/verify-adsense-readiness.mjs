import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const requiredFiles = [
  'src/app/layout.tsx',
  'src/lib/site.ts',
  'src/app/robots.ts',
  'src/app/sitemap.ts',
  'src/app/about/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/editorial-policy/page.tsx',
  'src/app/terms/page.tsx',
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

const appCode = [...walk('src/app'), ...walk('src/components'), ...walk('src/lib'), ...walk('src/features')];
for (const file of appCode) {
  const source = read(file);
  if (/<img\b/i.test(source)) fail(`Raw <img> usage found in application code: ${file}`);
  if (/@next\/next\/no-img-element/.test(source)) fail(`Image lint suppression found in application code: ${file}`);
  if (/\b(?:lorem ipsum|todo|fixme|coming soon|under construction|example\.com)\b/i.test(source)) {
    fail(`Placeholder/development text found in application code: ${file}`);
  }
}

const layout = read('src/app/layout.tsx');
const site = read('src/lib/site.ts');
const adsTxt = read('public/ads.txt');
const nextConfig = read('next.config.ts');
const analytics = read('src/components/layout/analytics.tsx');

if (!/google-adsense-account/.test(layout)) fail('AdSense publisher meta tag is missing from app/layout.tsx.');
const layoutPublisher = layout.match(/ca-pub-\d{8,}/)?.[0] ?? null;
const adsTxtPublisher = adsTxt.match(/google\.com,\s*(pub-\d{8,})\s*,\s*DIRECT\s*,\s*f08c47fec0942fa0/i)?.[1] ?? null;
if (!adsTxtPublisher) fail('public/ads.txt does not contain a valid Google direct-seller entry.');
const normalizedAdsTxtPublisher = adsTxtPublisher?.replace(/^pub-/, 'ca-pub-') ?? null;
if (layoutPublisher && normalizedAdsTxtPublisher && layoutPublisher !== normalizedAdsTxtPublisher) {
  fail(`Publisher mismatch: layout=${layoutPublisher}, ads.txt=${adsTxtPublisher}.`);
}

if (!/sitemap\.xml/.test(read('src/app/robots.ts'))) fail('robots.ts does not advertise sitemap.xml.');
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
  'src/app/about/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/privacy/page.tsx',
  'src/app/editorial-policy/page.tsx',
  'src/app/terms/page.tsx',
];
for (const file of publicEditorial) {
  if (read(file).trim().length < 600) warn(`Public trust/legal page is unusually short: ${file}`);
}

// Content depth gate: AdSense rejects sites whose editorial pages are thin, repetitive, or about the product itself.
const MIN_LONGFORM_WORDS = 500;
const MIN_LONGFORM_ARTICLES = 16;
const longform = read('src/features/articles/data/longform-editorial.ts');
const longformBlocks = longform.split(/longformArticle\(\{/).slice(1);
if (longformBlocks.length < MIN_LONGFORM_ARTICLES) {
  fail(`Expected at least ${MIN_LONGFORM_ARTICLES} long-form editorial articles, found ${longformBlocks.length}.`);
}
const seenLongformSlugs = new Set();
for (const block of longformBlocks) {
  const slug = block.match(/slug:\s*"([^"]+)"/)?.[1] ?? 'unknown';
  const body = block.match(/content_ar:\s*`([\s\S]*?)`/)?.[1] ?? '';
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const references = (block.match(/url:\s*"https:\/\//g) ?? []).length;
  if (seenLongformSlugs.has(slug)) fail(`Duplicate long-form article slug: ${slug}`);
  seenLongformSlugs.add(slug);
  if (words < MIN_LONGFORM_WORDS) fail(`Long-form article "${slug}" has ${words} words; minimum is ${MIN_LONGFORM_WORDS}.`);
  if (references < 2) fail(`Long-form article "${slug}" needs at least 2 source references.`);
  if (/(الواجهة|هذا التطبيق|تعرض المنصة|يعرض الموقع|فريق التطوير)/.test(body)) {
    fail(`Long-form article "${slug}" talks about the product instead of serving the reader.`);
  }
}
if (!/article:\s*1800/.test(read('src/lib/content-quality.ts'))) {
  fail('Article indexing threshold in src/lib/content-quality.ts must not be lowered below 1800 characters.');
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
