#!/usr/bin/env node

const required = ["SUPABASE_URL", "SUPABASE_PUBLIC_KEY"];

for (const name of required) {
  if (!process.env[name]) {
    console.error("Missing required production Supabase environment variable: " + name);
    process.exit(1);
  }
}

const baseUrl = process.env.SUPABASE_URL.replace(/\/$/, "");
const publicKey = process.env.SUPABASE_PUBLIC_KEY;

const headers = {
  apikey: publicKey,
  Authorization: "Bearer " + publicKey,
  Accept: "application/json",
};

const checks = [
  { name: "Supabase Auth settings", path: "/auth/v1/settings" },
  { name: "Quran surahs API", path: "/rest/v1/quran_surahs?select=id&limit=1" },
  { name: "Kids games API", path: "/rest/v1/kids_games?select=id&limit=1" },
  { name: "Kids content API", path: "/rest/v1/kids_content?select=id&limit=1" },
  {
    name: "Content library bilingual schema",
    path: "/rest/v1/content_library?select=summary_en&limit=0",
  },
  {
    name: "Translation queue access is isolated",
    path: "/rest/v1/content_translation_queue?select=id&limit=0",
  },
];

const timeoutMs = 15000;

async function runCheck({ name, path }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(baseUrl + path, {
      method: "GET",
      headers,
      signal: controller.signal,
    });

    const body = await response.text();
    if (!response.ok) {
      const preview = body.replace(/\s+/g, " ").slice(0, 300);
      throw new Error(
        name + " returned HTTP " + response.status + (preview ? ": " + preview : ""),
      );
    }

    console.log("PASS: " + name + " (HTTP " + response.status + ")");
  } finally {
    clearTimeout(timeout);
  }
}

let failed = false;

console.log("Checking production Supabase: " + baseUrl);

for (const check of checks) {
  try {
    await runCheck(check);
  } catch (error) {
    failed = true;
    console.error(
      "FAIL: " + check.name + ": " + (error instanceof Error ? error.message : String(error)),
    );
  }
}

if (failed) {
  console.error("Production Supabase health gate failed.");
  process.exit(1);
}

console.log("Production Supabase health gate passed.");
