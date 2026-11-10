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
if (!worker.includes('AI_VISUAL_POLICY_VERSION') || !worker.includes('from "../../src/features/videos/providers/ai-visual-policy"')) failures.push("AI visual policy must be explicitly versioned and imported from the shared policy module");
if (!worker.includes("aiVisualPolicyPromptLine()")) failures.push("AI planner must consume the shared visual policy");
if (!worker.includes("sourceLocked: true")) failures.push("AI planning metadata must record source locking");
if (!worker.includes("aiVisualPolicyVersion: AI_VISUAL_POLICY_VERSION")) failures.push("render metadata must record the AI visual policy version");
if (!worker.includes('["quran", "hadith", "dua", "adhkar", "story"].includes(request.category)')) failures.push("verified source categories must all be marked sourceLocked");
if (!worker.includes("engineConfig().aiEnabled")) failures.push("AI visual provider gate must remain configuration-controlled");
if (!worker.includes("AI_ATTEMPTS_PER_RUN")) failures.push("AI visual attempts must remain bounded per worker run");
if (worker.includes("gemini-3.5-flash-lite") || worker.includes("trying free fallback model")) failures.push("Gemini visual planning must not retry a second model after a quota or service error");
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
if (!hf.includes("freeZeroGpuQuotaExhausted") ||
    !hf.includes("Free ZeroGPU quota exhausted; skipping remaining Hugging Face providers")) {
  failures.push("HF providers must stop retrying all Spaces after the account's free ZeroGPU quota is exhausted");
}
const hfAdapter = read("scripts/jobs/hf-space-video.py");
for (const token of ["negative_prompt", "duration_seconds", "guidance_scale_2", "randomize_seed", 'api_name="/generate_video"', 'api_name="/text_to_video"']) {
  if (!hfAdapter.includes(token)) failures.push("HF Gradio adapter is missing the current provider input contract: " + token);
}
if (!hfAdapter.includes("max(2.0, min(5.0, float(args.duration)))") ||
    !hfAdapter.includes("max(2, min(6, int(round(args.duration)))")) {
  failures.push("HF video adapters must cap short visual clips to the verified Space runtime limits");
}

const router = read("src/features/videos/providers/provider-router.ts");
if (!router.includes("preferredProvider")) failures.push("AI provider preference routing is missing");
if (!router.includes("hf_wan") || !router.includes("hf_ltx_fast")) failures.push("HF AI providers are not registered in the router");
if (!router.includes("providerErrors.join")) failures.push("AI fallback metadata must preserve individual provider error details");

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
