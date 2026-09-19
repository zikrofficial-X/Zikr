#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const production = "https://zikrmediaofficial.vercel.app";
const productionWithSlash = production + "/";
const nativeCallback = "com.zikr.app://auth/callback";
const localWildcard = "http://localhost:3000/**";
const browserCallback = production + "/auth/callback";

const failures = [];

function read(file) {
  const absolute = path.join(root, file);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : "";
}

function fail(message) {
  failures.push(message);
}

const config = read("supabase/config.toml");
const authBlock = config.match(/\[auth\]([\s\S]*?)(?=\n\[|$)/)?.[0] ?? "";
const siteUrl = authBlock.match(/^site_url\s*=\s*"([^"]+)"/m)?.[1] ?? "";
const redirects = authBlock.match(/additional_redirect_urls\s*=\s*\[([\s\S]*?)\]/m)
  ? Array.from(authBlock.match(/additional_redirect_urls\s*=\s*\[([\\s\\S]*?)\]/m)[1].matchAll(/"([^"]+)"/g), m => m[1])
  : [];

const expected = [nativeCallback, localWildcard, browserCallback];

if (siteUrl !== productionWithSlash) fail(`Supabase Auth site_url drift: ${siteUrl || "<missing>"}`);
if (JSON.stringify(redirects) !== JSON.stringify(expected)) {
  fail(`Supabase Auth redirect allowlist drift: ${JSON.stringify(redirects)}`);
}

const forbiddenAlias = /zikr-zikrmediaofficial\.vercel\.app/i;
const forbiddenVercelFallback = /process\.env\.VERCEL_URL\?\.trim\(\)/;
const runtimeFiles = [
  "src/lib/site.ts",
  "src/lib/env.ts",
  "src/lib/auth-enhanced.ts",
  "next.config.ts",
  "proxy.ts",
  "src/features/auth/actions.ts",
  "src/features/auth/integrations/google-oauth.ts",
  "src/app/auth/callback/route.ts",
  "src/app/auth/google/route.ts",
  "src/features/auth/components/google-oauth-button.tsx",
  "scripts/jobs/template-video-automation.ts",
  "supabase/functions/_shared/cors.ts",
];

for (const file of runtimeFiles) {
  const source = read(file);
  if (!source) {
    fail(`Missing canonical runtime file: ${file}`);
    continue;
  }
  if (forbiddenAlias.test(source)) fail(`Forbidden Vercel alias found in ${file}`);
}

const templateVideo = read("scripts/jobs/template-video-automation.ts");
if (forbiddenVercelFallback.test(templateVideo)) {
  fail("Background automation must not derive the public origin from VERCEL_URL");
}

const siteSource = read("src/lib/site.ts");
if (!siteSource.includes('export const PRODUCTION_URL = "https://zikrmediaofficial.vercel.app";')) {
  fail("PRODUCTION_URL constant drifted");
}
if (!siteSource.includes("return PRODUCTION_URL;")) {
  fail("enforceCanonicalProductionUrl must return PRODUCTION_URL");
}
if (!siteSource.includes("url: PRODUCTION_URL")) {
  fail("siteConfig.url must be the canonical production URL");
}

const nextConfig = read("next.config.ts");
if (!nextConfig.includes("const canonicalClientSiteUrl = PRODUCTION_URL;")) {
  fail("next.config.ts must pin canonicalClientSiteUrl to PRODUCTION_URL");
}

const envSource = read("src/lib/env.ts");
if (!envSource.includes("PRODUCTION_URL.replace(/\\/$/, "")") || !envSource.includes('"/auth/callback"')) {
  fail("src/lib/env.ts must pin AUTH_CALLBACK_URL to canonical /auth/callback");
}

const authEnhanced = read("src/lib/auth-enhanced.ts");
if (!authEnhanced.includes('host.endsWith(".vercel.app")') || !authEnhanced.includes("return PRODUCTION_URL")) {
  fail("Auth origin guard must reject Vercel aliases");
}

if (failures.length) {
  console.error("❌ CANONICAL_CONFIG_CHECK_FAILED");
  for (const failure of failures) console.error("  - " + failure);
  process.exit(1);
}

console.log("✅ Canonical configuration lock passed");
