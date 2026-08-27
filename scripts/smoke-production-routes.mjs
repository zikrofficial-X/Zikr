const base = process.argv[2] ?? "https://zikrmediaofficial.vercel.app";
const routes = [
  "/", "/quran", "/mushaf", "/hadith", "/adhkar", "/dua", "/prophets",
  "/companions", "/scholars", "/articles", "/stories", "/battles", "/conquests",
  "/kids", "/memorization", "/prayer-times", "/qibla", "/radio", "/reciters",
  "/tawasheeh", "/poetry", "/tafsir", "/tasbeeh", "/offline-library", "/search",
  "/about", "/platform", "/faq", "/contact", "/privacy", "/terms",
  "/api/content/stats", "/api/content/articles", "/api/content/prophets",
  "/api/duas", "/api/hadith/books", "/api/quran/surahs", "/manifest.webmanifest",
  "/robots.txt", "/sitemap-index.xml",
];

const results = [];
const expectedCommit = process.env.EXPECTED_COMMIT_SHA ?? process.env.CIRCLE_SHA1 ?? null;
try {
  const healthResponse = await fetch(`${base}/api/health`, {
    cache: 'no-store',
    headers: { 'user-agent': 'ZIKR-production-smoke/1.0' },
  });
  const contentType = healthResponse.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    results.push({ route: '/api/health', status: healthResponse.status, ok: false, error: `Expected JSON health response, received ${contentType || 'unknown content type'}` });
  } else {
    const health = await healthResponse.json();
    const commitMatches = !expectedCommit || health.commit === expectedCommit || health.commit.startsWith(expectedCommit);
    results.push({ route: '/api/health', status: healthResponse.status, ok: healthResponse.ok && commitMatches, commit: health.commit, expectedCommit });
  }
} catch (error) {
  results.push({ route: '/api/health', status: 0, ok: false, error: String(error) });
}

for (const route of routes) {
  try {
    const response = await fetch(`${base}${route}`, {
      redirect: "manual",
      headers: { "user-agent": "ZIKR-production-smoke/1.0" },
    });
    results.push({ route, status: response.status, ok: response.status >= 200 && response.status < 400 });
  } catch (error) {
    results.push({ route, status: 0, ok: false, error: String(error) });
  }
}

const failures = results.filter(result => !result.ok);
console.log(JSON.stringify({ base, checked: results.length, failures, results }, null, 2));
if (failures.length > 0) process.exitCode = 1;
