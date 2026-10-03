import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

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
console.log("video contract tests passed");
