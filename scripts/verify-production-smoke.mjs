#!/usr/bin/env node
import assert from "node:assert/strict";

const baseUrl = (process.env.SITE_URL ?? process.env.DEPLOYMENT_URL ?? "").replace(/\/+$/, "");
assert.ok(baseUrl, "SITE_URL or DEPLOYMENT_URL is required");

const PUBLIC_ROUTES = [
  "/about",
  "/contact",
  "/editorial-policy",
  "/faq",
  "/privacy",
  "/terms",
  "/quran",
  "/hadith",
  "/adhkar",
  "/dua",
  "/duas",
  "/stories",
  "/prophets",
  "/companions",
  "/scholars",
  "/battles",
  "/conquests",
  "/articles",
  "/videos",
  "/audio",
  "/radio",
  "/reciters",
  "/poetry",
  "/memorization",
  "/kids",
  "/prayer-times",
  "/qibla",
  "/spiritual-ai",
  "/tafsir",
  "/tasbeeh",
  "/tawasheeh",
  "/wird",
  "/zakat",
  "/youtube",
  "/search",
  "/sections",
  "/knowledge",
  "/library",
];

const KIDS_GAME_SLUGS = [
  "zikr-runner",
  "zikr-memory",
  "wudu-challenge",
  "verse-puzzle",
  "zikr-quiz",
  "mosque-adventure",
  "zikr-road",
  "zikr-jump",
  "good-deeds",
  "hilal-fly",
  "mosque-cleanup",
  "zikr-coloring",
];

const CORE_CHECKS = [
  { path: "/", label: "homepage", expectedMain: /ذِكر/i },
  { path: "/quran", label: "Quran page", expectedMain: /القرآن/i },
  { path: "/prayer-times", label: "prayer times page", expectedMain: /مواقيت/i },
  { path: "/kids", label: "kids page", expectedMain: /نتعلم|الأطفال|الاطفال/i },
  { path: "/kids/games", label: "kids games catalogue", expectedMain: /الألعاب|ألعاب|All games|Choose your next adventure/i },
];

const ROUTE_CHECKS = PUBLIC_ROUTES
  .filter((path) => !CORE_CHECKS.some((core) => core.path === path))
  .map((path) => ({ path, label: `public section ${path}`, minMainText: 35 }));

// Test all individual game pages and their live content endpoints rather than
// only checking the general kids landing page. This catches missing game slugs,
// incomplete database seeds, and broken game metadata before release.
const KIDS_GAME_PAGE_CHECKS = KIDS_GAME_SLUGS.map((slug) => ({
  path: `/kids/${slug}`,
  label: `kids game page ${slug}`,
  minMainText: 35,
}));

const KIDS_GAME_API_CHECKS = KIDS_GAME_SLUGS.map((slug) => ({
  path: `/api/kids/content/${slug}`,
  label: `kids game content API ${slug}`,
  expectedJson: (payload) =>
    Boolean(payload) &&
    payload.slug === slug &&
    payload.type === "game" &&
    payload.metadata?.gameId === slug,
}));

const ASSET_CHECKS = [
  { path: "/robots.txt", label: "robots.txt", expected: /Sitemap:/i },
  { path: "/sitemap.xml", label: "sitemap.xml", expected: /<urlset/i },
  { path: "/sitemap-index.xml", label: "sitemap index", expected: /<sitemapindex/i },
];

const checks = [
  ...CORE_CHECKS,
  ...ROUTE_CHECKS,
  ...KIDS_GAME_PAGE_CHECKS,
  ...KIDS_GAME_API_CHECKS,
  ...ASSET_CHECKS,
];

function extractText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:nbsp|amp|lt|gt|quot|#39|#x27);/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mainTextFrom(html) {
  const withoutNonContent = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  // Next.js can stream Suspense fallbacks as the first <main>, then emit the
  // actual route content in hidden stream segments outside that main block.
  const mainTexts = [...withoutNonContent.matchAll(/<main\b[^>]*>([\s\S]*?)<\/main>/gi)]
    .map((match) => extractText(match[1]))
    .sort((left, right) => right.length - left.length);
  const bestMain = mainTexts[0] ?? "";
  if (bestMain.length >= 35 && !/^(?:جاري التحميل(?:\.\.\.)?|loading(?:\.\.\.)?)$/i.test(bestMain.trim())) {
    return bestMain;
  }
  // When all main blocks are temporary loading shells, fall back to the HTML
  // outside scripts/styles so completed streamed segments still count as route content.
  return extractText(withoutNonContent);
}
async function checkEndpoint(check) {
  const url = `${baseUrl}${check.path}`;
  let last = "no response";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: { "user-agent": "ZIKR-Production-Smoke/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      const body = await response.text();
      last = `HTTP ${response.status}`;
      if (response.status === 200) {
        let jsonPayload;
        if (check.expectedJson) {
          try {
            jsonPayload = JSON.parse(body);
          } catch {
            jsonPayload = undefined;
          }
        }

        if (check.expectedMain && !check.expectedMain.test(mainTextFrom(body))) {
          last = "HTTP 200 but expected visible main-content pattern was missing";
        } else if (check.expectedJson && (!jsonPayload || !check.expectedJson(jsonPayload))) {
          last = "HTTP 200 but JSON payload did not satisfy the expected route/content contract";
        } else if (check.expected && !check.expected.test(body)) {
          last = "HTTP 200 but expected document pattern was missing";
        } else if (check.minMainText && mainTextFrom(body).length < check.minMainText) {
          last = `HTTP 200 but rendered main content was too short (${mainTextFrom(body).length} chars)`;
        } else {
          console.log(`PASS ${check.label} -> ${url}`);
          return null;
        }
      } else {
        last += body ? `: ${body.replace(/\s+/g, " ").slice(0, 100)}` : "";
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
  }
  return `FAIL ${check.label} -> ${url}: ${last}`;
}

const failures = [];
let nextIndex = 0;
const workerCount = Math.min(4, checks.length);
await Promise.all(
  Array.from({ length: workerCount }, async () => {
    while (nextIndex < checks.length) {
      const index = nextIndex++;
      const failure = await checkEndpoint(checks[index]);
      if (failure) {
        failures.push(failure);
        console.error(failure);
      }
    }
  }),
);

if (failures.length) {
  console.error(`Production smoke failed: ${failures.length}/${checks.length} checks failed.`);
  process.exit(1);
}

console.log(`✅ Production smoke passed for ${checks.length} routes/assets on ${baseUrl}`);
