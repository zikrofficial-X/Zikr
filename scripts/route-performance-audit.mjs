const base = process.argv[2] ?? 'https://zikrmediaofficial.vercel.app';
const routes = [
  '/', '/quran', '/mushaf', '/hadith', '/adhkar', '/dua', '/prophets',
  '/companions', '/scholars', '/articles', '/stories', '/battles', '/conquests',
  '/kids', '/memorization', '/prayer-times', '/qibla', '/radio', '/reciters',
  '/tawasheeh', '/poetry', '/tafsir', '/tasbeeh', '/offline-library', '/search',
  '/about', '/platform', '/faq', '/contact', '/privacy', '/terms',
  '/api/content/stats', '/api/content/articles', '/api/content/prophets',
  '/api/duas', '/api/hadith/books', '/api/quran/surahs', '/manifest.webmanifest',
  '/robots.txt', '/sitemap-index.xml', '/api/health', '/audio/adhan.wav', '/audio/salawat.wav'
];

const results = [];
for (const route of routes) {
  const started = performance.now();
  try {
    const response = await fetch(`${base}${route}`, {
      redirect: 'manual',
      cache: 'no-store',
      headers: { 'user-agent': 'ZIKR-route-performance-audit/1.0' },
    });
    const body = await response.arrayBuffer();
    const elapsedMs = Math.round((performance.now() - started) * 100) / 100;
    results.push({ route, status: response.status, ok: response.status >= 200 && response.status < 400, elapsedMs, bytes: body.byteLength, contentType: response.headers.get('content-type') ?? '' });
  } catch (error) {
    results.push({ route, status: 0, ok: false, elapsedMs: Math.round((performance.now() - started) * 100) / 100, bytes: 0, error: String(error) });
  }
}

const successful = results.filter((r) => r.ok);
const failures = results.filter((r) => !r.ok);
const sorted = [...successful].sort((a, b) => a.elapsedMs - b.elapsedMs);
const summary = {
  base,
  checked: results.length,
  success: successful.length,
  failures: failures.length,
  minMs: sorted[0]?.elapsedMs ?? null,
  medianMs: sorted.length ? sorted[Math.floor(sorted.length / 2)].elapsedMs : null,
  maxMs: sorted.at(-1)?.elapsedMs ?? null,
  totalBytes: results.reduce((sum, r) => sum + r.bytes, 0),
  generatedAt: new Date().toISOString(),
};
console.log(JSON.stringify({ summary, failures, results }, null, 2));
if (failures.length) process.exitCode = 1;
