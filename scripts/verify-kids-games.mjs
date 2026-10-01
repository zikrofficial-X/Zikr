#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const read = file => fs.existsSync(path.join(root, file))
  ? fs.readFileSync(path.join(root, file), "utf8")
  : "";

const fail = message => failures.push(message);

const canonicalIds = [
  "zikr-runner",
  "zikr-memory",
  "wudu-challenge",
  "verse-puzzle",
  "zikr-quiz",
  "mosque-adventure",
  "zikr-road",
  "zikr-jump",
  "good-deeds",
  "hilal-fly",
  "mosque-cleanup",
  "zikr-coloring",
];

const registry = read("src/lib/games/registry.ts");
const stage = read("src/features/kids/components/games/world-game-stage.tsx");
const service = read("src/features/kids/services/games.ts");
const migration = read("supabase/migrations/20261001214711_kids_games_schema_reconciliation_20261002.sql");
const legacyIndex = read("src/features/kids/data/games-index.ts");
const kidsPage = read("src/app/kids/page.tsx");

if (!registry) fail("Canonical game registry is missing.");
if (!stage) fail("Kids world runtime stage is missing.");
if (!service) fail("Kids game service is missing.");
if (!migration) fail("Kids schema reconciliation migration is missing.");

const registryIds = [...registry.matchAll(/^\s{2}"([^"]+)":\s*\{/gm)].map(match => match[1]);
if (registryIds.length !== canonicalIds.length) {
  fail(`Canonical registry must contain ${canonicalIds.length} games; found ${registryIds.length}.`);
}

for (const id of canonicalIds) {
  if (!registry.includes(`"${id}": {`)) fail(`Canonical registry is missing ${id}.`);
  if (
    !stage.includes(`"${id}"`) &&
    !stage.includes(`=== "${id}"`) &&
    !(id === "zikr-coloring" && stage.includes("ColoringGame"))
  ) fail(`Runtime stage has no branch for ${id}.`);
  if (!migration.includes(`('${id}'`) && !migration.includes(`'${id}',`)) {
    fail(`Database reconciliation seed is missing ${id}.`);
  }
}

for (const token of [
  "best_distance",
  "best_level",
  "play_count",
  "best_combo",
  "client_submission_id",
  "xp_awarded",
  "metadata",
  "kids_record_game_result_internal",
  "kids_user_achievements_achievement_id_fkey",
]) {
  if (!migration.includes(token)) fail(`Kids migration is missing contract token: ${token}`);
}

for (const token of [
  "bestDistance",
  "bestLevel",
  "playCount",
  "bestCombo",
  "kids_record_game_result_internal",
]) {
  if (!service.includes(token)) fail(`Kids server service is missing canonical contract token: ${token}`);
}

if (legacyIndex.includes("const GAMES_REGISTRY: GameMetadata[] = [")) {
  fail("Legacy duplicate kids game registry is still hard-coded; it must derive from src/lib/games/registry.ts.");
}

if (!legacyIndex.includes('from "@/lib/games/registry"')) {
  fail("Legacy kids games index must import the canonical registry.");
}

if (!kidsPage.includes("KidsGamesIndex")) {
  fail("/kids must render the canonical KidsGamesIndex instead of the obsolete duplicate games catalog.");
}


if (failures.length) {
  console.error("KIDS_GAMES_INTEGRITY_CHECK_FAILED");
  for (const failure of failures) console.error("❌ " + failure);
  process.exit(1);
}

console.log("✅ Kids games registry, runtime, service, and DB schema contracts passed");
