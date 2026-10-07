#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(root, ".env.local");

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
];
const OPTIONAL = [
  "AUTH_CALLBACK_URL",
  "YOUTUBE_API_KEY",
  "YOUTUBE_CHANNEL_ID",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "FACEBOOK_PAGE_ID",
  "FACEBOOK_PAGE_ACCESS_TOKEN",
  "FACEBOOK_GRAPH_API_VERSION",
  "GEMINI_API_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const CANONICAL_SITE = "https://zikrmediaofficial.vercel.app";
const EXPECTED_SUPABASE = "https://nmdeazfmtncelykzxkhs.supabase.co";
const results = [];

const add = (status, name, detail) => results.push({ status, name, detail });
const env = (name) => process.env[name]?.trim() || "";

for (const name of REQUIRED) {
  if (!env(name)) add("fail", name, "missing required runtime variable");
  else add("pass", name, "present");
}
for (const name of OPTIONAL) {
  if (!env(name)) add("warn", name, "optional integration is not configured");
}

function parseUrl(name) {
  const value = env(name);
  if (!value) return null;
  try { return new URL(value); }
  catch { add("fail", name, "must be a valid URL"); return null; }
}

const site = parseUrl("NEXT_PUBLIC_SITE_URL");
const supabase = parseUrl("NEXT_PUBLIC_SUPABASE_URL");
const callback = parseUrl("AUTH_CALLBACK_URL");

if (site && site.origin !== CANONICAL_SITE) {
  add("fail", "NEXT_PUBLIC_SITE_URL", `must equal ${CANONICAL_SITE} in production`);
}
if (supabase && supabase.origin !== EXPECTED_SUPABASE) {
  add("fail", "NEXT_PUBLIC_SUPABASE_URL", `must equal ${EXPECTED_SUPABASE}`);
}
if (callback) {
  const ok =
    callback.origin === (site?.origin ?? CANONICAL_SITE) &&
    callback.pathname === "/auth/callback";
  if (!ok) add("fail", "AUTH_CALLBACK_URL", "must point to /auth/callback on the ZIKR app origin");
}
if (env("FACEBOOK_GRAPH_API_VERSION") && !/^v\d+\.\d+$/.test(env("FACEBOOK_GRAPH_API_VERSION"))) {
  add("fail", "FACEBOOK_GRAPH_API_VERSION", "must match vNN.N");
}

if (env("GOOGLE_CLIENT_ID") || env("GOOGLE_CLIENT_SECRET") || env("NEXT_PUBLIC_GOOGLE_CLIENT_ID")) {
  add(
    "fail",
    "Google Auth credential isolation",
    "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/NEXT_PUBLIC_GOOGLE_CLIENT_ID are obsolete application variables; Google login is configured in Supabase Auth and YouTube uses YOUTUBE_CLIENT_ID/YOUTUBE_CLIENT_SECRET",
  );
}
if (env("DATABASE_URL") || env("POSTGRES_URL") || env("POSTGRES_PRISMA_URL") || env("POSTGRES_URL_NON_POOLING")) {
  add(
    "fail",
    "Direct Postgres variables",
    "DATABASE_URL/POSTGRES_* are retired from the application runtime; use Supabase migrations and Supabase client APIs",
  );
}

async function supabaseHealth() {
  const url = supabase?.origin || EXPECTED_SUPABASE;
  const key = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!key) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: controller.signal,
    });
    if (response.ok) add("pass", "Supabase Auth", "settings endpoint reachable");
    else add("fail", "Supabase Auth", `returned HTTP ${response.status}`);
  } catch (error) {
    add("warn", "Supabase Auth", `network check unavailable: ${error instanceof Error ? error.message : "request failed"}`);
  } finally {
    clearTimeout(timeout);
  }
}
await supabaseHealth();

const failed = results.filter((r) => r.status === "fail");
const warnings = results.filter((r) => r.status === "warn");
for (const r of results) {
  console.log(`${r.status === "pass" ? "✅" : r.status === "warn" ? "⚠️" : "❌"} ${r.name}: ${r.detail}`);
}
console.log(`\nDeployment env check: ${failed.length} failure(s), ${warnings.length} warning(s).`);
if (failed.length) process.exit(1);
