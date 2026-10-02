#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing required AI Visual Factory file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const worker = read("scripts/jobs/template-video-automation.ts");
if (!worker.includes('AI_VISUAL_POLICY_VERSION = "2026-10-02-source-locked-v1"')) failures.push("AI visual policy must be explicitly versioned");
if (!worker.includes("aiVisualPolicyPromptLine()")) failures.push("AI planner must consume the shared visual policy");
if (!worker.includes("sourceLocked: true")) failures.push("AI planning metadata must record source locking");
if (!worker.includes("aiVisualPolicyVersion: AI_VISUAL_POLICY_VERSION")) failures.push("render metadata must record the AI visual policy version");
if (!worker.includes('["quran", "hadith", "dua", "adhkar", "story"].includes(request.category)')) failures.push("verified source categories must all be marked sourceLocked");
if (!worker.includes('ENGINE_CONFIG.aiEnabled')) failures.push("AI visual provider gate must remain configuration-controlled");
if (!worker.includes("AI_ATTEMPTS_PER_RUN")) failures.push("AI visual attempts must remain bounded per worker run");
if (!worker.includes("source text")) failures.push("AI planner must operate from source text");
if (!worker.includes("sourceLocked")) failures.push("AI planner must preserve source-lock semantics");

const policy = read("src/features/videos/providers/ai-visual-policy.ts");
if (!policy.includes('AI_VISUAL_POLICY_VERSION = "2026-10-02-source-locked-v1"')) failures.push("AI visual policy version is missing");
for (const token of ["prophets or sacred figures", "invented Arabic scripture", "invented religious quotations"]) {
  if (!policy.includes(token)) failures.push(`shared AI visual policy missing: ${token}`);
}
const hf = read("src/features/videos/providers/hf-space-provider.ts");
if (!hf.includes("Verified source text:")) failures.push("HF provider prompt must receive verified source text");
if (!hf.includes("aiVisualPolicyPromptLine()")) failures.push("HF provider must consume the shared visual policy");

const router = read("src/features/videos/providers/provider-router.ts");
if (!router.includes("preferredProvider")) failures.push("AI provider preference routing is missing");
if (!router.includes("hf_wan") || !router.includes("hf_ltx_fast")) failures.push("HF AI providers are not registered in the router");

const q = read("src/features/videos/providers/types.ts");
if (!q.includes("VIDEO_AI_ENABLED")) failures.push("AI generation must remain environment-gated");
if (!q.includes("VIDEO_PROVIDER_ORDER")) failures.push("AI provider order must remain configurable");

const pkg = JSON.parse(read("package.json"));
if (!pkg.scripts["ai:visual:check"]) failures.push("ai:visual:check must be registered");
if (!pkg.scripts["verify:pr"]?.includes("pnpm ai:visual:check")) failures.push("verify:pr must include AI Visual Factory verification");
if (!pkg.scripts["verify"]?.includes("pnpm ai:visual:check")) failures.push("verify must include AI Visual Factory verification");

if (failures.length) {
  console.error("AI_VISUAL_FACTORY_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 11 AI Visual Factory checks passed");
