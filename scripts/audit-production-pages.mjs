import { writeFile } from 'node:fs/promises';

const ORIGIN = process.env.AUDIT_ORIGIN ?? 'https://zikrmediaofficial.vercel.app';
const appRoutes = [
  '/', '/mushaf', '/quran', '/hadith', '/stories', '/scholars', '/prayer-times', '/qibla', '/adhkar', '/dua', '/tasbeeh', '/prophets', '/articles', '/videos', '/youtube', '/kids', '/memorization', '/wird', '/zakat', '/spiritual-ai', '/poetry', '/competitions', '/radio', '/reciters', '/tafsir', '/companions', '/battles', '/conquests', '/tawasheeh', '/search', '/offline-library', '/settings', '/favorites', '/profile', '/about', '/contact', '/platform', '/faq', '/privacy', '/terms',
];

const protectedRoutes = new Set(['/settings', '/favorites', '/profile', '/admin', '/memorization', '/wird']);
const apiRoutes = [
  '/api/quran/surahs',
  '/api/content/articles',
  '/api/content/companions',
  '/api/content/prophets',
  '/api/content/stories',
  '/api/duas',
  '/api/duas/categories',
  '/api/hadith/books',
  '/api/tawasheeh',
  '/api/tawasheeh/categories',
  '/api/search?q=قرآن',
  '/api/prayer-times?city=Cairo&country=Egypt',
];

function stripHtml(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}
function firstMatch(html, pattern) { return html.match(pattern)?.[1]?.trim() ?? null; }
function inspectHtml(html) {
  const text = stripHtml(html);
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => stripHtml(m[1]));
  const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = firstMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ?? firstMatch(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonical = firstMatch(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ?? firstMatch(html, /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const jsonLdCount = (html.match(/application\/ld\+json/gi) ?? []).length;
  return { title, h1s, description, canonical, jsonLdCount, textLength: text.length, textSample: text.slice(0, 180) };
}

async function fetchOne(path, kind = 'page') {
  const started = Date.now();
  const url = `${ORIGIN}${path}`;
  try {
    const response = await fetch(url, { redirect: 'manual', headers: { 'user-agent': 'Zikr-production-audit/1.0' } });
    const body = await response.text();
    return { path, kind, status: response.status, location: response.headers.get('location'), durationMs: Date.now() - started, ...(['page', 'sitemap-dynamic'].includes(kind) ? inspectHtml(body) : { bodyLength: body.length, bodySample: body.slice(0, 160) }) };
  } catch (error) {
    return { path, kind, status: 0, durationMs: Date.now() - started, error: String(error) };
  }
}

async function mapLimit(items, limit, fn) {
  const output = [];
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return output;
}

const staticResults = await mapLimit(appRoutes, 6, (path) => fetchOne(path));
const sitemapIndexResponse = await fetch(`${ORIGIN}/sitemap-index.xml`);
const sitemapIndexText = await sitemapIndexResponse.text();
const sitemapPaths = [...sitemapIndexText.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((match) => new URL(match[1]).pathname)
  .filter((path) => path.startsWith('/sitemap-content/') && path.endsWith('.xml'));
const sitemapResponses = await Promise.all(sitemapPaths.map((path) => fetch(`${ORIGIN}${path}`)));
const sitemapTexts = await Promise.all(sitemapResponses.map((response) => response.text()));
const sitemapUrls = sitemapTexts.flatMap((sitemapText) => [...sitemapText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((url) => url.startsWith(ORIGIN)).map((url) => new URL(url).pathname + new URL(url).search));
const dynamicPaths = [...new Set(sitemapUrls)].filter((path) => !appRoutes.includes(path)).slice(0, 120);
const dynamicResults = await mapLimit(dynamicPaths, 6, (path) => fetchOne(path, 'sitemap-dynamic'));
const apiResults = await mapLimit(apiRoutes, 4, (path) => fetchOne(path, 'api'));
const robots = await fetchOne('/robots.txt', 'asset');
const ads = await fetchOne('/ads.txt', 'asset');
const manifest = await fetchOne('/manifest.webmanifest', 'asset');
const sw = await fetchOne('/sw.js', 'asset');

const publicPageResults = [...staticResults, ...dynamicResults].filter((result) => result.status === 200);
const issues = [];
for (const result of staticResults) {
  const expectedRedirect = protectedRoutes.has(result.path);
  if (expectedRedirect) {
    if (![200, 307, 308].includes(result.status)) issues.push({ type: 'protected-status', ...result });
    continue;
  }
  if (result.status !== 200) issues.push({ type: 'page-status', ...result });
  if (result.status === 200 && (!result.title || !result.description || result.h1s.length === 0)) issues.push({ type: 'page-seo', path: result.path, status: result.status, title: result.title, description: Boolean(result.description), h1Count: result.h1s.length });
  if (result.status === 200 && result.textLength < 220) issues.push({ type: 'thin-content-signal', path: result.path, textLength: result.textLength, textSample: result.textSample });
}
for (const result of dynamicResults) {
  if (![200, 301, 302, 307, 308].includes(result.status)) issues.push({ type: 'sitemap-status', ...result });
  if (result.status === 200 && (!result.title || !result.description || result.h1s.length === 0)) issues.push({ type: 'sitemap-seo', path: result.path, status: result.status, title: result.title, description: Boolean(result.description), h1Count: result.h1s.length });
}
for (const result of apiResults) if (![200, 401, 403, 404].includes(result.status)) issues.push({ type: 'api-status', ...result });
if (sitemapIndexResponse.status !== 200) issues.push({ type: 'sitemap-index-http', status: sitemapIndexResponse.status });
sitemapResponses.forEach((response, index) => {
  if (response.status !== 200) issues.push({ type: 'sitemap-http', path: sitemapPaths[index], status: response.status });
});
if (robots.status !== 200) issues.push({ type: 'robots-http', status: robots.status });
if (ads.status !== 200) issues.push({ type: 'ads-http', status: ads.status });
if (manifest.status !== 200) issues.push({ type: 'manifest-http', status: manifest.status });
if (sw.status !== 200) issues.push({ type: 'sw-http', status: sw.status });

const report = { generatedAt: new Date().toISOString(), origin: ORIGIN, counts: { declaredRoutes: appRoutes.length, staticPages: staticResults.length, sitemapFiles: sitemapPaths.length, sitemapUrls: sitemapUrls.length, dynamicSampled: dynamicResults.length, apiRoutes: apiResults.length, public200Pages: publicPageResults.length, issues: issues.length }, staticResults, dynamicResults, apiResults, assets: { robots, ads, manifest, sw, sitemapIndex: { status: sitemapIndexResponse.status, bodyLength: sitemapIndexText.length }, sitemaps: sitemapPaths.map((path, index) => ({ path, status: sitemapResponses[index].status, bodyLength: sitemapTexts[index].length })) }, issues };
await writeFile('/tmp/zikr-production-pages-audit.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ counts: report.counts, issueTypes: [...new Set(issues.map((issue) => issue.type))], issuePaths: issues.slice(0, 80).map((issue) => issue.path) }, null, 2));
if (issues.some((issue) => ['page-status', 'protected-status', 'sitemap-status', 'sitemap-index-http', 'robots-http', 'ads-http', 'manifest-http', 'sw-http'].includes(issue.type))) process.exitCode = 1;
