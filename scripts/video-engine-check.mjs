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
for (const token of [
  "VIDEO_AI_ENABLED: \"true\"",
  "HF_WAN_VIDEO_ENABLED: \"true\"",
  "HF_LTX_FAST_VIDEO_ENABLED: \"true\"",
  "AUTO_VIDEO_PUBLISH_ENABLED: \"true\"",
  "AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL: \"false\"",
  "VIDEO_PROVIDER_ORDER",
]) {
  if (!workflow.includes(token)) throw new Error("Workflow missing " + token);
}

if ((process.env.VERIFY_VIDEO_RUNTIME_TOOLS ?? "false").toLowerCase() === "true") {
  execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
}
console.log("Video engine structural check passed.");
