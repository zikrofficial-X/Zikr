#!/usr/bin/env node
import fs from "node:fs";

const source = fs.readFileSync("src/lib/types/supabase.ts", "utf8");
const tableStart = source.indexOf("Tables: {");
const viewsStart = source.indexOf("\n    Views:", tableStart);
if (tableStart < 0 || viewsStart < 0) {
  throw new Error("Generated Supabase types must contain a public Tables block and Views block.");
}

const tableBlock = source.slice(tableStart, viewsStart);
const tables = new Set(
  [...tableBlock.matchAll(/^\s{6}([a-z][a-z0-9_]*)\s*:\s*\{$/gm)].map(match => match[1]),
);
const requiredTables = [
  "admin_audit_events",
  "kids_games",
  "kids_content",
  "video_generation_requests",
  "social_publish_queue",
  "social_post_insights",
  "youtube_oauth_credentials",
];
const functionStart = source.indexOf("Functions: {");
const enumsStart = source.indexOf("\n    Enums:", functionStart);
if (functionStart < 0 || enumsStart < 0) {
  throw new Error("Generated Supabase types must contain a public Functions block and Enums block.");
}
const functionBlock = source.slice(functionStart, enumsStart);
const functions = new Set(
  [...functionBlock.matchAll(/^\s{6}([a-z][a-z0-9_]*)\s*:\s*\{/gm)].map(match => match[1]),
);
const requiredFunctions = [
  "admin_set_primary_site_audio_asset",
  "admin_update_user_role",
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
  if (!tables.has(table)) failures.push(`Generated Supabase types are missing production table: ${table}`);
}
for (const table of retiredTables) {
  if (tables.has(table)) failures.push(`Generated Supabase types still describe a retired production table: ${table}`);
}
for (const fn of requiredFunctions) {
  if (!functions.has(fn)) failures.push(`Generated Supabase types are missing production function: ${fn}`);
}
if (!source.includes('PostgrestVersion: "14.18"')) {
  failures.push("Generated Supabase types are not synchronized with the current production PostgREST schema version.");
}

if (failures.length) {
  console.error("GENERATED_SUPABASE_TYPES_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}
console.log(`✅ Generated Supabase types include all ${tables.size} required public table contracts and ${requiredFunctions.length} required RPC contracts.`);
