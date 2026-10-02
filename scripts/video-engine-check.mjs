import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const required = [
  "src/features/videos/providers/types.ts",
  "src/features/videos/providers/template-provider.ts",
  "src/features/videos/providers/comfyui-provider.ts",
  "src/features/videos/providers/free-api-provider.ts",
  "src/features/videos/providers/provider-router.ts",
  "src/features/videos/providers/content-hash.ts",
  "src/app/api/internal/video-generation/daily/route.ts",
  "supabase/migrations/20261002100000_multi_provider_free_video_engine.sql",
];
for (const file of required) if (!existsSync(file)) throw new Error(`Missing video engine file: ${file}`);
const route = readFileSync("src/app/api/internal/video-generation/daily/route.ts", "utf8");
if (!route.includes("INTERNAL_JOB_SECRET") || !route.includes("daily_verified_video_seed")) throw new Error("Internal daily route is not protected/configured.");
const migration = readFileSync("supabase/migrations/20261002100000_multi_provider_free_video_engine.sql", "utf8");
for (const token of ["content_hash", "source_hash", "video_automation_runs", "IF NOT EXISTS"]) if (!migration.includes(token)) throw new Error(`Migration missing ${token}`);
execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
console.log("Video engine structural check passed.");
