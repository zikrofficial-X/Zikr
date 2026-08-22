#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const TIMEOUT_MS = 10_000;
const results = [];

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...valueParts] = trimmed.split("=");
    if (!key || valueParts.length === 0 || process.env[key]) continue;
    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

function env(name, aliases = []) {
  for (const key of [name, ...aliases]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function add(status, label, detail) {
  results.push({ status, label, detail });
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function checkRoute(baseUrl, route, expectedStatuses) {
  const url = new URL(route, baseUrl).toString();
  try {
    const response = await fetchWithTimeout(url, {
      headers: { Accept: "text/html,application/xhtml+xml" },
      redirect: "manual",
    });
    if (expectedStatuses.includes(response.status)) {
      add("pass", `Route ${route}`, `HTTP ${response.status}`);
      return;
    }
    add(
      "fail",
      `Route ${route}`,
      `HTTP ${response.status}; expected ${expectedStatuses.join(" or ")}`,
    );
  } catch (error) {
    add("fail", `Route ${route}`, error instanceof Error ? error.message : "request failed");
  }
}

function normalizeSupabaseUrl(value) {
  try {
    const url = new URL(value.trim());
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
}

async function checkSupabaseTable(supabaseUrl, anonKey, table) {
  const url = `${normalizeSupabaseUrl(supabaseUrl)}/rest/v1/${table}?limit=1`;
  try {
    const response = await fetchWithTimeout(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: "application/json",
      },
    });
    if (response.ok) {
      add("pass", `Anonymous Supabase ${table}`, `HTTP ${response.status}`);
      return;
    }
    add("fail", `Anonymous Supabase ${table}`, `HTTP ${response.status}`);
  } catch (error) {
    add(
      "fail",
      `Anonymous Supabase ${table}`,
      error instanceof Error ? error.message : "request failed",
    );
  }
}

const siteUrl = env("NEXT_PUBLIC_SITE_URL") || "https://zikrmediaofficial.vercel.app";
const supabaseUrl = env("NEXT_PUBLIC_SUPABASE_URL", ["SUPABASE_URL"]);
const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY", ["SUPABASE_ANON_KEY", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_KEY"]);

if (!siteUrl) add("fail", "NEXT_PUBLIC_SITE_URL", "missing");
if (!supabaseUrl) add("fail", "NEXT_PUBLIC_SUPABASE_URL", "missing");
if (!anonKey) add("fail", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "missing");

if (siteUrl) {
  const publicRoutes = [
    "/",
    "/quran",
    "/quran/1",
    "/hadith",
    "/dua",
    "/search",
    "/settings",
    "/api/site-settings",
  ];
  for (const route of publicRoutes) {
    await checkRoute(siteUrl, route, [200]);
  }

  for (const route of ["/profile", "/favorites", "/memorization", "/admin"]) {
    await checkRoute(siteUrl, route, [302, 303, 307, 308]);
  }
}

if (supabaseUrl && anonKey) {
  // Only public content is queried with an anonymous key. User, admin, and
  // automation tables are deliberately omitted because successful anonymous
  // reads would indicate an RLS regression rather than deployment health.
  for (const table of [
    "quran_surahs",
    "quran_ayahs",
    "hadith_books",
    "hadiths",
    "duas",
    "videos",
  ]) {
    await checkSupabaseTable(supabaseUrl, anonKey, table);
  }
}

const icon = { pass: "✅", fail: "❌" };
for (const result of results) {
  console.log(`${icon[result.status]} ${result.label}: ${result.detail}`);
}

const failures = results.filter(result => result.status === "fail").length;
console.log(`\nProduction smoke test completed with ${failures} failure(s).`);
if (failures > 0) process.exitCode = 1;
