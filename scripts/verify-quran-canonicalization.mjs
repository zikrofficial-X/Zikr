#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";

const failures = [];

function read(path) {
  if (!existsSync(path)) {
    failures.push(`missing required Quran canonicalization file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
}

const localVerifier = read("scripts/verify-local-quran.mjs");
if (!localVerifier.includes("6236")) failures.push("local Quran verifier must enforce the 6236-ayah corpus size");
if (!localVerifier.includes("pages 1..604")) failures.push("local Quran verifier must enforce the 604-page Mushaf mapping");

const server = read("src/features/quran/services/quran-server.ts");
for (const token of ["loadLocalQuranCorpus", "getSurahFromDb", "getAyahFromDb", "getRecitersFromDb"]) {
  if (!server.includes(token)) failures.push(`quran-server.ts missing canonical server operation: ${token}`);
}

const catalog = read("src/features/quran/components/quran-catalog-page.tsx");
if (!catalog.includes("getAllSurahsFromDb")) failures.push("public Quran catalog must use quran-server");

const surahPage = read("src/app/quran/[surah]/page.tsx");
if (!surahPage.includes("getSurahFromDb")) failures.push("public surah page must use quran-server");

const ayahPage = read("src/app/quran/[surah]/[ayah]/page.tsx");
if (!ayahPage.includes("getAyahFromDb")) failures.push("public ayah page must use quran-server");

const audioApi = read("src/app/api/quran/audio/route.ts");
if (!audioApi.includes("getQuranAudioFromDb")) failures.push("Quran audio API must use quran-server");

const recitersApi = read("src/app/api/quran/reciters/route.ts");
if (!recitersApi.includes("getRecitersFromDb")) failures.push("Quran reciters API must use quran-server");
if (!recitersApi.includes("getFallbackReciters")) failures.push("Quran reciters API must have a cold fallback");

const client = read("src/features/quran/services/quran-client.ts");
if (!client.includes("/api/quran/reciters")) failures.push("client reciter service must use the canonical API");

for (const path of [
  "src/features/quran/components/audio-player.tsx",
  "src/app/reciters/page.tsx",
  "src/app/reciters/[slug]/page.tsx",
]) {
  const content = read(path);
  if (!content.includes("quran-client")) {
    failures.push(`${path} must consume reciters through quran-client`);
  }
  if (content.includes('from "@/features/quran/services/quran"') || content.includes("from '@/features/quran/services/quran'")) {
    failures.push(`${path} must not import the direct Supabase Quran client service`);
  }
}

const videoSources = read("src/features/videos/services/video-sources.ts");
for (const token of [
  "QURAN_VIDEO_RECITER_CODE",
  "QURAN_AYAH_AUDIO_RECITER_CODE",
  "QURAN_VIDEO_RECITER_CODE !== QURAN_AYAH_AUDIO_RECITER_CODE",
  "/rest/v1/quran_audio",
  "audioRow?.audio_url",
  "QURAN_BASE",
]) {
  if (!videoSources.includes(token)) failures.push("Quran video source missing human-recitation alignment contract: " + token);
}
const videoWorker = read("scripts/jobs/template-video-automation.ts");
for (const token of [
  "QURAN_AYAH_AUDIO_BASE_URL",
  "getVerifiedQuranAyahAudioUrl",
  "category === \"quran\" && !audioUrl",
  "verified human recitation audio is unavailable",
]) {
  if (!videoWorker.includes(token)) failures.push("Video worker missing Quran recitation safety contract: " + token);
}
if (videoWorker.includes('category === "quran" ? "arabic_tts_narration"')) {
  failures.push("Quran video must never classify generated TTS as its narration source");
}

const retriever = read("src/features/spiritual-ai/services/retriever.ts");
if (!retriever.includes("searchLocalQuran")) {
  failures.push("Spiritual AI Quran retrieval must use the local canonical Quran corpus");
}

const legacyConsumers = [
  "src/app/reciters/page.tsx",
  "src/app/reciters/[slug]/page.tsx",
  "src/features/quran/components/audio-player.tsx",
  "src/features/spiritual-ai/services/retriever.ts",
];
for (const path of legacyConsumers) {
  const content = read(path);
  if (content.includes("getReciters(") && !content.includes("getQuranReciters(")) {
    failures.push(`${path} still calls the legacy getReciters() path`);
  }
  if (content.includes("searchQuran(")) {
    failures.push(`${path} still calls the legacy direct-database searchQuran() path`);
  }
}

if (failures.length) {
  console.error("QURAN_CANONICALIZATION_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}

console.log("✅ Phase 8 Quran canonicalization checks passed");
