#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing required Video Factory file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const router = read("src/features/videos/providers/provider-router.ts");
if (!router.includes("availability check threw")) failures.push("provider availability exceptions must not abort fallback routing");
if (!router.includes('Provider " + name + " threw for')) failures.push("provider generation exceptions must not abort fallback routing");
if (!router.includes("!templateAttempted")) failures.push("template provider must not be executed twice in one router pass");

const template = read("scripts/jobs/template-video-automation.ts");
if (template.includes("https://zikrmediaofficial.vercel.app")) failures.push("video worker must not hardcode the production origin");
if (!template.includes("getServerEnv().NEXT_PUBLIC_SITE_URL")) failures.push("video worker must use the canonical site environment");
if (!template.includes("sourceId") || !template.includes("published source is required")) failures.push("source-locked content gate is missing");
if (!template.includes("narration does not exactly match the current published source text")) failures.push("source text must be exact before rendering");
if (!template.includes("assertPlayableOutput")) failures.push("rendered videos must pass media integrity QA");
if (!template.includes("assertAudibleAudio")) failures.push("rendered videos must pass audible-audio QA");
if (!template.includes("Rendered output resolution mismatch")) failures.push("rendered video resolution must be validated");
if (!template.includes("Rendered output video bitrate is too low")) failures.push("rendered video bitrate must be validated");

const sourceService = read("src/features/videos/services/video-sources.ts");
if (sourceService.includes("https://zikrmediaofficial.vercel.app")) failures.push("video source service must not hardcode the production origin");
if (!sourceService.includes("getServerEnv().NEXT_PUBLIC_SITE_URL")) failures.push("video source service must use the canonical site environment");

const types = read("src/features/videos/providers/types.ts");
for (const token of ["hf_ltx_fast", "hf_wan", "comfyui", "free_api", "template"]) {
  if (!types.includes(token)) failures.push(`video provider type missing: ${token}`);
}
if (!types.includes("VIDEO_MAX_RETRIES")) failures.push("video engine retry limit must remain configurable");
if (!types.includes("VIDEO_STALE_AFTER_MINUTES")) failures.push("video stale timeout must remain configurable");

const contentHash = read("src/features/videos/providers/content-hash.ts");
if (!contentHash.includes("export function videoContentHash")) failures.push("video content hash contract missing");
if (!contentHash.includes("export function sourceHash")) failures.push("video source hash contract missing");

const queue = read("scripts/run-background-jobs.ts");
if (!queue.includes("processTemplateVideoQueue")) failures.push("background runner must use the canonical template queue");
if (!queue.includes("ensureArabicTtsRuntime")) failures.push("background runner must initialize the canonical voice runtime");

const workflow = read(".github/workflows/generate-ai-video.yml");
if (!workflow.includes("pnpm video:engine:check")) failures.push("GitHub video workflow must execute the engine guard");

const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts["video:factory:check"]) failures.push("video:factory:check must be registered");
if (!pkg.scripts["verify:pr"]?.includes("pnpm video:factory:check")) failures.push("verify:pr must include Video Factory verification");
if (!pkg.scripts["verify"]?.includes("pnpm video:factory:check")) failures.push("verify must include Video Factory verification");

if (failures.length) {
  console.error("VIDEO_FACTORY_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 10 Video Factory checks passed");
