#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const production = "https://zikrmediaofficial.vercel.app";
const nativeCallback = "com.zikr.app://auth/callback";
const localWildcard = "http://localhost:3000/**";
const browserCallback = production + "/auth/callback";
const canonicalSupabaseProject = "zqtssvlvmkzeeyqghqfk";
const canonicalSupabaseUrl = `https://${canonicalSupabaseProject}.supabase.co`;


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
  ? Array.from(authBlock.match(/additional_redirect_urls\s*=\s*\[([\s\S]*?)\]/m)[1].matchAll(/"([^"]+)"/g), m => m[1])
  : [];

const expected = [nativeCallback, localWildcard, browserCallback];

if (siteUrl !== production) fail(`Supabase Auth site_url drift: ${siteUrl || "<missing>"}`);
if (JSON.stringify(redirects) !== JSON.stringify(expected)) {
  fail(`Supabase Auth redirect allowlist drift: ${JSON.stringify(redirects)}`);
}

const supabaseTargetFiles = [
  "docs/environment-variables.md",
  ".github/workflows/quality-gate.yml",
  ".github/workflows/supabase-production-health.yml",
  ".github/workflows/generate-ai-video.yml",
  ".github/workflows/publish-social.yml",
];
for (const file of supabaseTargetFiles) {
  const source = read(file);
  if (!source) {
    fail(`Missing Supabase target contract file: ${file}`);
    continue;
  }
  if (!source.includes(canonicalSupabaseUrl)) {
    fail(`Supabase target drift in ${file}; expected ${canonicalSupabaseUrl}`);
  }
}
const supabaseUrlReferenceDocs = [
  "docs/circleci-supabase-environment.md",
  "docs/AUTH_SYSTEM_GUIDE.md",
];
for (const file of supabaseUrlReferenceDocs) {
  const source = read(file);
  if (!source || !source.includes(canonicalSupabaseUrl)) {
    fail(`Canonical Supabase URL documentation drift in ${file}; expected ${canonicalSupabaseUrl}`);
  }
}
const supabaseProjectReferenceDocs = [
  "docs/SOURCE_OF_TRUTH.md",
  "docs/ENVIRONMENT_GOVERNANCE_2026-10-08.md",
];
for (const file of supabaseProjectReferenceDocs) {
  const source = read(file);
  if (!source || !source.includes(canonicalSupabaseProject)) {
    fail(`Canonical Supabase project reference drift in ${file}; expected ${canonicalSupabaseProject}`);
  }
  if (source.includes("wvetcauyerlkqvmntajq")) {
    fail(`Retired Supabase project reference remains in current documentation: ${file}`);
  }
}
const environmentDocs = read("docs/environment-variables.md");
if (environmentDocs.includes("wvetcauyerlkqvmntajq")) {
  fail("Environment documentation still references the retired Supabase project");
}

const forbiddenAlias = /zikr-zikrmediaofficial\.vercel\.app/i;
const forbiddenVercelFallback = /process\.env\.VERCEL_URL\?\.trim\(\)/;
const runtimeFiles = [
  "src/lib/site.ts",
  "src/lib/env.ts",
  "src/lib/auth-enhanced.ts",
  "next.config.ts",
  "src/proxy.ts",
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
if (!envSource.includes("resolveAppCallbackUrl") || !envSource.includes('"/auth/callback"') || !envSource.includes("PRODUCTION_URL")) {
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
