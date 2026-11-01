#!/usr/bin/env node
import fs from "node:fs";

const source = fs.readFileSync("src/lib/types/supabase.ts", "utf8");
const requiredTables = [
  "admin_audit_events",
  "kids_games",
  "kids_content",
  "video_generation_requests",
  "social_publish_queue",
];
const retiredTables = [
  "admin_actions_audit",
  "admin_audit_log",
  "game_graphics",
  "game_scenarios",
  "video_narrations",
  "free_tier_usage",
  "video_publishing_config",
];

const failures = [];
for (const table of requiredTables) {
  if (!new RegExp(`^\\s{6}${table}: \\\{$`, "m").test(source)) {
    failures.push(`Generated Supabase types are missing production table: ${table}`);
  }
}
for (const table of retiredTables) {
  if (new RegExp(`^\\s{6}${table}: \\\{$`, "m").test(source)) {
    failures.push(`Generated Supabase types still describe a retired production table: ${table}`);
  }
}
if (!source.includes('PostgrestVersion: "14.18"')) {
  failures.push("Generated Supabase types are not synchronized with the current production PostgREST schema version.");
}

if (failures.length) {
  console.error("GENERATED_SUPABASE_TYPES_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log("✅ Generated Supabase types match the canonical production table contract.");
