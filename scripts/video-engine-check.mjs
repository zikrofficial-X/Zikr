import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const required = [
  "src/features/videos/providers/types.ts",
  "src/features/videos/providers/template-provider.ts",
  "src/features/videos/providers/comfyui-provider.ts",
  "src/features/videos/providers/free-api-provider.ts",
  "src/features/videos/providers/hf-space-provider.ts",
  "src/features/videos/providers/provider-router.ts",
  "src/features/videos/providers/content-hash.ts",
  "scripts/jobs/hf-space-video.py",
  "supabase/migrations/20261002100000_multi_provider_free_video_engine.sql",
];

for (const file of required) {
  if (!existsSync(file)) throw new Error("Missing video engine file: " + file);
}

const types = readFileSync("src/features/videos/providers/types.ts", "utf8");
for (const token of ["hf_wan", "hf_ltx_fast", "preferredProvider", "hfWanEnabled", "hfLtxFastEnabled"]) {
  if (!types.includes(token)) throw new Error("Video provider configuration missing " + token);
}

const migration = readFileSync("supabase/migrations/20261002100000_multi_provider_free_video_engine.sql", "utf8");
for (const token of ["content_hash", "source_hash", "video_automation_runs", "IF NOT EXISTS"]) {
  if (!migration.includes(token)) throw new Error("Migration missing " + token);
}

const workflow = readFileSync(".github/workflows/generate-ai-video.yml", "utf8");
const adminHealth = readFileSync("src/app/admin/health/page.tsx", "utf8");
if (!adminHealth.includes("getAdminSettings") || !adminHealth.includes("video_automation_ai_enabled") || !adminHealth.includes("video_automation_enabled") || !adminHealth.includes("النشر داخل الموقع") || !adminHealth.includes("لا يُرسل منشورات إلى منصات خارجية") || adminHealth.includes("video_automation_auto_publish") || adminHealth.includes("youtube.upload")) {
  throw new Error("Admin health must report canonical internal worker settings and enforce site-only publishing");
}
if (!workflow.includes("VIDEO_PROVIDER_ORDER")) {
  throw new Error("Workflow must preserve the canonical provider priority contract");
}
const internalGenerationMode =
  workflow.includes('VIDEO_AI_ENABLED: "true"') &&
  workflow.includes('HF_WAN_VIDEO_ENABLED: "true"') &&
  workflow.includes('HF_LTX_FAST_VIDEO_ENABLED: "true"') &&
  workflow.includes('VIDEO_PROVIDER_ORDER: "hf_ltx_fast,hf_wan,template"') &&
  workflow.includes('BACKGROUND_JOB_TARGET: "videos"');
// Publishing is intentionally site-only and governed by the internal content queue.
// Never require or re-enable legacy external social publishing flags in this worker.
if (!internalGenerationMode || workflow.includes("AUTO_VIDEO_PUBLISH_ENABLED") || workflow.includes("AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL")) {
  throw new Error("Video worker must enable internal AI generation and must not contain legacy external publishing controls");
}

if ((process.env.VERIFY_VIDEO_RUNTIME_TOOLS ?? "false").toLowerCase() === "true") {
  execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
}
console.log("Video engine structural check passed.");
