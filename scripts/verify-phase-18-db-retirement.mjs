#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const failures=[];
const migrationPath="supabase/migrations/20261002130000_retire_coordinated_legacy_subsystems_20261002.sql";
if(!existsSync(migrationPath)) failures.push("Phase 18 retirement migration is missing");
const migration=existsSync(migrationPath)?readFileSync(migrationPath,"utf8"):"";

for(const token of [
  "INSERT INTO public.admin_audit_events",
  "legacy-admin-audit-log:",
  "legacy-admin-actions-audit:",
  "DROP VIEW IF EXISTS public.free_tier_statistics",
  "DROP FUNCTION IF EXISTS public.track_free_tier_usage()",
  "DROP TABLE IF EXISTS public.video_narrations",
  "DROP TABLE IF EXISTS public.free_tier_usage",
  "DROP TABLE IF EXISTS public.video_publishing_config",
  "DROP TABLE IF EXISTS public.admin_actions_audit",
  "DROP TABLE IF EXISTS public.admin_audit_log",
  "DROP TABLE IF EXISTS public.game_graphics",
  "DROP TABLE IF EXISTS public.kids_achievements_legacy_20261002",
]){
  if(!migration.includes(token)) failures.push("retirement migration missing contract: "+token);
}
if(migration.includes("DROP TABLE IF EXISTS public.game_scenarios")) failures.push("game_scenarios must not be dropped in Phase 18");
if(migration.includes("DROP TABLE public.game_scenarios")) failures.push("game_scenarios must not be dropped in Phase 18");

if(failures.length){
  console.error("PHASE_18_DB_RETIREMENT_CHECK_FAILED");
  for(const f of failures) console.error("❌ "+f);
  process.exit(1);
}
console.log("✅ Phase 18 retirement migration contract passed.");
