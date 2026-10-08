#!/usr/bin/env node
import assert from "node:assert/strict";

const baseUrl = (process.env.SITE_URL ?? process.env.DEPLOYMENT_URL ?? "").replace(/\/+$/, "");
assert.ok(baseUrl, "SITE_URL or DEPLOYMENT_URL is required");

const checks = [
  { path: "/", expected: /ذِكر/i, label: "homepage" },
  { path: "/quran", expected: /القرآن/i, label: "Quran page" },
  { path: "/prayer-times", expected: /مواقيت/i, label: "prayer times page" },
  { path: "/kids", expected: /الأطفال/i, label: "kids page" },
  { path: "/robots.txt", expected: /Sitemap:/i, label: "robots.txt" },
  { path: "/sitemap.xml", expected: /<urlset/i, label: "sitemap.xml" },
];

async function check({ path, expected, label }) {
  const url = `${baseUrl}${path}`;
  let last = "no response";
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(30_000) });
      const body = await response.text();
      last = `HTTP ${response.status}`;
      if (response.status === 200 && expected.test(body)) {
        console.log(`PASS ${label} -> ${url}`);
        return;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    console.log(`WAIT ${label} attempt ${attempt}/12 -> ${last}`);
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }
  throw new Error(`Production smoke failed for ${label}: ${last}`);
}

for (const check of checks) await check(check);
console.log(`✅ Production smoke passed for ${checks.length} endpoints on ${baseUrl}`);
