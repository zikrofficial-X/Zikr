#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) { failures.push("missing required Kids Video Factory file: " + path); return ""; }
  return readFileSync(path, "utf8");
};

const factory = read("src/features/videos/data/kids-story-factory.ts");
for (const token of ["buildKidsSeriesEpisode", "validateGeneratedKidsEpisode", "free_deterministic_story_factory", "learningObjective", "seasonNumber", "episodeNumber"]) {
  if (!factory.includes(token)) failures.push("kids story factory missing contract: " + token);
}
for (const id of ["salim-nour", "garden-friends", "little-inventors", "little-good-steps"]) {
  if (!factory.includes('id: "' + id + '"')) failures.push("missing original kids series: " + id);
}

const worker = read("scripts/jobs/template-video-automation.ts");
for (const token of ['const mode = slot % 7', "buildKidsSeriesEpisode", "validateGeneratedKidsEpisode", 'category: "other"', 'audience: "kids"', 'contentFormat: "series_episode"', 'voiceProfile: "kids_friendly"', "assertKidsStoryContract", 'VIDEO_FREE_ONLY?.toLowerCase() === "false"']) {
  if (!worker.includes(token)) failures.push("video worker missing kids/free mode contract: " + token);
}
if (!worker.includes("KIDS_SERIES_START_DAY_INDEX")) failures.push("kids series schedule must have a stable launch reference");
if (!worker.includes("Math.ceil((dailyTarget * scheduleWindow) / 4)")) failures.push("daily target must be spread across four six-hour workflow windows");
if (!worker.includes("سلسلة أطفال:")) failures.push("social captions must identify series, season, episode and educational objective");

const router = read("src/features/videos/providers/provider-router.ts");
if (!router.includes('!["hf_ltx_fast", "hf_wan", "template"].includes(name)')) failures.push("free-only mode must reject potentially billable/custom providers");
if (!router.includes("templateAttempted")) failures.push("local FFmpeg fallback must remain available");

const config = read("src/features/videos/providers/types.ts");
if (!config.includes("freeOnly: bool(env.VIDEO_FREE_ONLY, true)")) failures.push("free-only must be the default provider policy");

const curated = read("src/features/videos/data/curated-content.ts");
if (!curated.includes("CURATED_KIDS_STORY_SOURCES") || !curated.includes("KIDS_SERIES_EPISODES_PER_SEASON")) failures.push("admin must expose the canonical first-season catalogue");
if (!curated.includes("factorySequence: index + 1")) failures.push("curated content must preserve canonical factory sequence");
if (!curated.includes("generationMode: episode.generationMode")) failures.push("curated content must expose its deterministic generation mode");

const sourceTypes = read("src/features/videos/services/video-sources.ts");
for (const token of ['audience?: "general" | "kids"', "seriesId?: string", "seasonNumber?: number", "episodeNumber?: number", "generationMode?: string", "factorySequence?: number"]) {
  if (!sourceTypes.includes(token)) failures.push("video source metadata missing: " + token);
}

const route = read("src/app/api/admin/videos/create/route.ts");
if (!route.includes('source.audience === "kids" ? { voiceProfile: "kids_friendly", contentFormat: "series_episode" }')) failures.push("manual series requests must inherit kids voice and episode format");
if (!route.includes("source.factorySequence")) failures.push("manual series requests must retain the canonical factory sequence");

const page = read("src/app/admin/ai-video/curated/page.tsx");
if (!page.includes("سلاسل قصص الأطفال")) failures.push("curated admin page must expose serial children's stories");

const workflow = read(".github/workflows/generate-ai-video.yml");
for (const token of ['VIDEO_FREE_ONLY: "true"', 'VIDEO_PROVIDER_ORDER: "hf_ltx_fast,hf_wan,template"', 'FREE_VIDEO_PROVIDER_ENABLED: "false"', "pnpm kids:video:check"]) {
  if (!workflow.includes(token)) failures.push("production workflow missing free/QC setting: " + token);
}
if (workflow.includes("GEMINI_API_KEY:")) failures.push("free-only workflow must not inject a Gemini credential");
for (const name of ["kids-garden", "kids-neighborhood", "kids-workshop", "kids-nature"]) {
  const path = "public/video/templates/" + name + ".svg";
  if (!read(path).includes("<svg")) failures.push("missing SVG background: " + path);
  if (!workflow.includes(path)) failures.push("workflow must rasterize-check SVG background: " + path);
}

const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts["kids:video:check"]?.includes("scripts/tests/kids-video-series.test.ts")) failures.push("kids:video:check must run the episode test");
if (!pkg.scripts["kids:video:check"]?.includes("scripts/verify-kids-video-factory.mjs")) failures.push("kids:video:check must run integration validation");
if (!pkg.scripts.test?.includes("kids-video-series.test.ts")) failures.push("standard tests must include Kids Video Factory");
if (!pkg.scripts["verify:pr"]?.includes("pnpm kids:video:check")) failures.push("PR verification must include Kids Video Factory");
if (!pkg.scripts.verify?.includes("pnpm kids:video:check")) failures.push("full verification must include Kids Video Factory");

const docs = read("docs/kids-video-series-free-factory.md");
if (!docs.includes("VIDEO_FREE_ONLY=true") || !docs.includes("Quran videos continue to require human recitation audio")) failures.push("documentation must state free-provider boundaries and Quran audio safety");
if (failures.length) {
  console.error("KIDS_VIDEO_FACTORY_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Kids Video Factory integration contracts passed.");
