#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        const value = valueParts.join("=").replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const REQUIRED_RUNTIME_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

const REQUIRED_MIGRATION_VARS = ["SUPABASE_SERVICE_ROLE_KEY", "DATABASE_URL"];
const OPTIONAL_INTEGRATIONS = [
  "AUTH_CALLBACK_URL",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "YOUTUBE_API_KEY",
  "YOUTUBE_CHANNEL_ID",
  "QURAN_API_BASE_URL",
  "QURAN_AUDIO_CDN_URL",
  "HADITH_API_BASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "FACEBOOK_APP_ID",
  "FACEBOOK_APP_SECRET",
  "FACEBOOK_PAGE_ACCESS_TOKEN",
  "FACEBOOK_PAGE_ID",
  "YOUTUBE_REFRESH_TOKEN",
];

const TIMEOUT_MS = 8000;
const CANONICAL_PRODUCTION_ORIGIN = "https://zikrmediaofficial.vercel.app";
const results = [];

function addResult(status, label, detail) {
  results.push({ status, label, detail });
}

const SUFFIXES = [
  "",
  ...Object.keys(process.env)
    .map(key => key.match(/_(\d+)$/)?.[1])
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b))
    .map(suffix => `_${suffix}`),
];

function withNumberedAliases(names) {
  return names.flatMap(name => SUFFIXES.map(suffix => `${name}${suffix}`));
}

function getEnv(name) {
  const aliases = {
    NEXT_PUBLIC_SUPABASE_URL: withNumberedAliases([
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_URL",
    ]),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: withNumberedAliases([
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_ANON_KEY",
      "SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_KEY",
    ]),
    SUPABASE_SERVICE_ROLE_KEY: withNumberedAliases([
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_SECRET_KEY",
    ]),
    DATABASE_URL: withNumberedAliases([
      "DATABASE_URL",
      "POSTGRES_URL",
      "POSTGRES_PRISMA_URL",
      "POSTGRES_URL_NON_POOLING",
    ]),
  };

  for (const key of aliases[name] || withNumberedAliases([name])) {
    const value = process.env[key]?.trim();
    if (!value) continue;

    // Ignore a mis-provisioned Supabase provider callback set on
    // AUTH_CALLBACK_URL — it must be the app callback, so fall through.
    if (name === "AUTH_CALLBACK_URL") {
      try {
        const url = new URL(value);
        if (
          url.hostname.endsWith(".supabase.co") &&
          url.pathname === "/auth/v1/callback"
        ) {
          continue;
        }
      } catch {
        continue;
      }
    }

    return value;
  }

  if (name === "NEXT_PUBLIC_SITE_URL") {
    return "https://zikrmediaofficial.vercel.app";
  }

  if (name === "AUTH_CALLBACK_URL") {
    const siteUrl =
      getEnv("NEXT_PUBLIC_SITE_URL") || "https://zikrmediaofficial.vercel.app";
    return `${siteUrl.replace(/\/$/, "")}/auth/callback`;
  }

  return undefined;
}

function parseUrl(name) {
  const value = getEnv(name);
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    addResult("fail", name, "must be a valid URL");
    return null;
  }
}

function validatePresence() {
  for (const name of REQUIRED_RUNTIME_VARS) {
    if (!getEnv(name))
      addResult("fail", name, "missing required runtime variable");
  }

  for (const name of REQUIRED_MIGRATION_VARS) {
    if (!getEnv(name))
      addResult(
        "warn",
        name,
        "missing; required before running Supabase migrations"
      );
  }

  for (const name of OPTIONAL_INTEGRATIONS) {
    if (!getEnv(name))
      addResult("warn", name, "optional integration is not configured");
  }
}

function validateUrls() {
  const supabaseUrl = parseUrl("NEXT_PUBLIC_SUPABASE_URL");
  const siteUrl = parseUrl("NEXT_PUBLIC_SITE_URL");
  const callbackUrl = parseUrl("AUTH_CALLBACK_URL");
  parseUrl("QURAN_API_BASE_URL");
  parseUrl("QURAN_AUDIO_CDN_URL");
  parseUrl("HADITH_API_BASE_URL");

  if (siteUrl && siteUrl.origin !== CANONICAL_PRODUCTION_ORIGIN) {
    addResult(
      "fail",
      "NEXT_PUBLIC_SITE_URL",
      `must equal ${CANONICAL_PRODUCTION_ORIGIN} for production`
    );
  }

  if (callbackUrl && callbackUrl.origin !== CANONICAL_PRODUCTION_ORIGIN) {
    addResult(
      "fail",
      "AUTH_CALLBACK_URL",
      `must use ${CANONICAL_PRODUCTION_ORIGIN}/auth/callback for production`
    );
  }

  if (supabaseUrl && !supabaseUrl.hostname.endsWith(".supabase.co")) {
    addResult(
      "warn",
      "NEXT_PUBLIC_SUPABASE_URL",
      "host does not look like a Supabase project URL"
    );
  }

  if (callbackUrl) {
    const isAppCallback =
      callbackUrl.pathname === "/auth/callback" &&
      (!siteUrl || callbackUrl.origin === siteUrl.origin);
    const isSupabaseProviderCallback =
      callbackUrl.pathname === "/auth/v1/callback" &&
      callbackUrl.hostname.endsWith(".supabase.co") &&
      (!supabaseUrl || callbackUrl.origin === supabaseUrl.origin);

    if (isSupabaseProviderCallback) {
      addResult(
        "fail",
        "AUTH_CALLBACK_URL",
        "must be the app callback URL (for example https://zikrmediaofficial.vercel.app/auth/callback); keep the Supabase /auth/v1/callback URL only in Google Cloud's authorized redirect URIs"
      );
    } else if (!isAppCallback) {
      addResult(
        "fail",
        "AUTH_CALLBACK_URL",
        "must match NEXT_PUBLIC_SITE_URL plus /auth/callback"
      );
    }
  }
}

function validateDatabaseUrl() {
  const databaseUrl = getEnv("DATABASE_URL");
  if (!databaseUrl) return;

  if (/\s/.test(databaseUrl)) {
    addResult("fail", "DATABASE_URL", "must not contain spaces or line breaks");
  }

  try {
    const parsed = new URL(databaseUrl);
    if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
      addResult(
        "fail",
        "DATABASE_URL",
        "must use postgres:// or postgresql://"
      );
    }
    if (
      !parsed.username ||
      !parsed.hostname ||
      !parsed.pathname ||
      parsed.pathname === "/"
    ) {
      addResult(
        "fail",
        "DATABASE_URL",
        "must include username, host, and database name"
      );
    }
  } catch {
    addResult(
      "fail",
      "DATABASE_URL",
      "must be a valid Postgres connection string; URL-encode special password characters like @ as %40"
    );
  }
}

function validatePostgresUrls() {
  const pooledUrl = getEnv("POSTGRES_PRISMA_URL") || getEnv("POSTGRES_URL");
  const directUrl = getEnv("POSTGRES_URL_NON_POOLING");

  if (pooledUrl) {
    try {
      const parsed = new URL(pooledUrl);
      if (
        parsed.port === "6543" &&
        parsed.searchParams.get("pgbouncer") !== "true"
      ) {
        addResult(
          "warn",
          "POSTGRES_PRISMA_URL",
          "Supabase pooler URLs on port 6543 should include pgbouncer=true"
        );
      }
    } catch {
      addResult("fail", "POSTGRES_PRISMA_URL", "must be a valid Postgres URL");
    }
  }

  if (directUrl) {
    try {
      const parsed = new URL(directUrl);
      if (parsed.hostname.includes("pooler.supabase.com")) {
        addResult(
          "warn",
          "POSTGRES_URL_NON_POOLING",
          "appears to use a Supabase pooler host; direct/non-pooling URLs normally use db.<project-ref>.supabase.co:5432"
        );
      }
    } catch {
      addResult(
        "fail",
        "POSTGRES_URL_NON_POOLING",
        "must be a valid Postgres URL"
      );
    }
  }
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

async function validateSupabaseRest() {
  const configuredSupabaseUrl = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseUrl = configuredSupabaseUrl?.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  const anonKey = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return;

  try {
    // Use the auth settings endpoint: it returns 200 for a valid anon key and
    // does not depend on any table or RLS policy (the bare /rest/v1/ root can
    // return 401 even with a valid key on some projects).
    const response = await fetchWithTimeout(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/settings`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    if (response.ok) {
      addResult(
        "pass",
        "Supabase Auth",
        "reachable with the configured public Supabase anon key"
      );
    } else {
      addResult(
        "fail",
        "Supabase Auth",
        `returned HTTP ${response.status}; check project URL and anon key`
      );
    }
  } catch (error) {
    addResult(
      "warn",
      "Supabase Auth",
      `connectivity check skipped (${error instanceof Error ? error.message : "request failed"}); runtime clients will use offline-safe fallbacks`
    );
  }
}

async function validateYoutube() {
  const apiKey = getEnv("YOUTUBE_API_KEY");
  const channelId = getEnv("YOUTUBE_CHANNEL_ID");
  if (!apiKey || !channelId) return;

  const params = new URLSearchParams({
    part: "id",
    id: channelId,
    key: apiKey,
  });
  try {
    const response = await fetchWithTimeout(
      `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`
    );
    if (!response.ok) {
      addResult(
        "fail",
        "YouTube API",
        `returned HTTP ${response.status}; check YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID`
      );
      return;
    }

    const payload = await response.json();
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      addResult("pass", "YouTube API", "channel is reachable");
    } else {
      addResult(
        "fail",
        "YouTube API",
        "channel was not found for YOUTUBE_CHANNEL_ID"
      );
    }
  } catch (error) {
    addResult(
      "fail",
      "YouTube API",
      error instanceof Error ? error.message : "request failed"
    );
  }
}

function printResults() {
  const icon = { pass: "✅", warn: "⚠️", fail: "❌" };
  for (const result of results) {
    console.log(`${icon[result.status]} ${result.label}: ${result.detail}`);
  }

  const failures = results.filter(result => result.status === "fail").length;
  const warnings = results.filter(result => result.status === "warn").length;
  console.log(
    `\nDeployment env check completed with ${failures} failure(s) and ${warnings} warning(s).`
  );

  if (failures > 0) process.exitCode = 1;
}

validatePresence();
validateUrls();
validateDatabaseUrl();
validatePostgresUrls();
await validateSupabaseRest();
await validateYoutube();
printResults();
