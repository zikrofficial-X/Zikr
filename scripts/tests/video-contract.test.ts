import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { MAX_AUTO_VIDEO_SECONDS, resolveRenderDuration } from "../../src/features/videos/services/render-duration";

// Contract: TypeScript video status/category unions must match the latest DB check constraints.
const migrations = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort();
const sql = migrations.map((f) => readFileSync("supabase/migrations/" + f, "utf8")).join("\n");

function latestConstraintValues(name: string): string[] {
  // Anchor tightly: constraint name, CHECK ( column IN (...) | = ANY (ARRAY[...]) ) with no other statement in between.
  const re = new RegExp(name + "\\s+CHECK\\s*\\(\\s*\\(?\\s*\\w+\\s*(?:IN\\s*\\(([^)]+)\\)|=\\s*ANY\\s*\\(\\s*(?:\\()?ARRAY\\[([^\\]]+)\\])", "gi");
  let last: string | undefined;
  for (const m of sql.matchAll(re)) last = m[1] ?? m[2];
  assert.ok(last, "no migration defines " + name);
  return [...last.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
}

const types = readFileSync("src/lib/types/video.ts", "utf8");
const statusUnion = /status:\s*([^;]+);/.exec(types)?.[1] ?? "";
const tsStatuses = [...statusUnion.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]).sort();
assert.deepEqual(tsStatuses, latestConstraintValues("video_generation_requests_status_check"), "VideoGenerationRequest.status must equal the DB status constraint");

const categories = latestConstraintValues("video_generation_requests_category_check");
assert.ok(categories.includes("other"), "category 'other' must be allowed by the DB constraint");

const voice = readFileSync("scripts/generate-arabic-voice.py", "utf8");
assert.ok(!voice.includes("ZariyahNeural"), "default Arabic TTS voice must be male (Zariyah is female)");
assert.ok(voice.includes("ar-SA-HamedNeural"), "male MSA profile required");

const worker = readFileSync("scripts/jobs/template-video-automation.ts", "utf8");
assert.ok(
  worker.includes('`--rate=${process.env.ARABIC_TTS_RATE?.trim() || narrationProfile.rate}`'),
  "Arabic TTS rate must use --rate=<value> because negative rates are parsed as CLI options by argparse",
);
assert.ok(
  worker.includes('`--pitch=${process.env.ARABIC_TTS_PITCH?.trim() || narrationProfile.pitch}`'),
  "Arabic TTS pitch must use --pitch=<value> because negative pitches are parsed as CLI options by argparse",
);

assert.equal(MAX_AUTO_VIDEO_SECONDS, 60, "automated video render ceiling must allow natural narration up to 60 seconds");
assert.ok(
  Math.abs(resolveRenderDuration(52.3, 20) - 53.1) < 0.001,
  "a 52.3-second narration must render with its full duration and audio tail",
);
assert.ok(
  Math.abs(resolveRenderDuration(53.6, 20) - 54.4) < 0.001,
  "a 53.6-second narration must render with its full duration and audio tail",
);
assert.equal(resolveRenderDuration(0, 20), 20, "invalid audio duration must fall back to the requested target duration");
assert.throws(
  () => resolveRenderDuration(59.3, 20),
  /59.3s > 60.0s max/,
  "content that cannot fit within the supported 60-second format must fail explicitly rather than be truncated",
);

console.log("video contract tests passed");
