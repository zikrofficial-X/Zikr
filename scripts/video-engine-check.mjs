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
if (!adminHealth.includes("getAdminSettings") || !adminHealth.includes("video_automation_ai_enabled") || !adminHealth.includes("video_automation_enabled") || !adminHealth.includes("النشر داخل الموقع") || !adminHealth.includes("النشر الاجتماعي الخارجي") || !adminHealth.includes("video_automation_auto_publish") || !adminHealth.includes("فحوص الجودة الآلية")) {
  throw new Error("Admin health must report canonical worker settings and automated QA publishing accurately");
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
const worker = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");
const approval = readFileSync("src/features/videos/services/video-publish-approval.ts", "utf8");
// Rendering stays separate. External delivery is unattended only after all five automated
// source/audio/visual/caption/rights checks pass and the immutable media fingerprint matches.
if (!internalGenerationMode ||
    !workflow.includes('AUTO_VIDEO_PUBLISH_ENABLED: "true"') ||
    !workflow.includes('AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL: "false"') ||
    !worker.includes("buildAutomatedVideoQaChecklist") ||
    !worker.includes("createAutomatedVideoQaApproval") ||
    !worker.includes("automatedQa.status !== \"passed\"") ||
    !approval.includes("AUTOMATED_VIDEO_QA_VERSION") ||
    !approval.includes("buildVideoApprovalSnapshotHash")) {
  throw new Error("Video worker must use automatic source-locked QA before enabling unattended delivery");
}
if ((process.env.VERIFY_VIDEO_RUNTIME_TOOLS ?? "false").toLowerCase() === "true") {
  execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
}
console.log("Video engine structural check passed.");
