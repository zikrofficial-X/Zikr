#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const failures = [];
const read = (path) => {
  if (!existsSync(path)) {
    failures.push(`missing kids production file: ${path}`);
    return "";
  }
  return readFileSync(path, "utf8");
};

const registry = read("src/lib/games/registry.ts");
const stage = read("src/features/kids/components/games/world-game-stage.tsx");
const index = read("src/features/kids/components/games/games-index.tsx");
const page = read("src/app/kids/games/page.tsx");
const shell = read("src/features/kids/components/games/game-shell.tsx");
const packageJson = JSON.parse(read("package.json"));

const expectedIds = [
  "zikr-runner", "zikr-memory", "wudu-challenge", "verse-puzzle",
  "zikr-quiz", "mosque-adventure", "zikr-road", "zikr-jump",
  "good-deeds", "hilal-fly", "mosque-cleanup", "zikr-coloring",
];

for (const id of expectedIds) {
  if (!registry.includes(`"${id}"`)) failures.push(`registry missing game: ${id}`);
  if (!stage.includes(`"${id}"`)) failures.push(`unified game stage missing game: ${id}`);
}
if (!registry.includes('difficulties: ["easy", "normal", "hard"] as const')) failures.push("registry must expose all three difficulties");
if (!registry.includes('supportedAgeGroups: ["3-5", "6-8", "9-12"] as const')) failures.push("registry must preserve the full child age range where applicable");

if (!index.includes('fetch("/api/kids/games/progress"')) failures.push("games index must retain progress loading");
if (!index.includes("bestScores")) failures.push("games index must render persisted best scores");
if (!index.includes("filtered.length")) failures.push("games index must retain filtering/empty-state handling");
if (!page.includes("ContentGuide")) failures.push("kids games page must retain the educational safety guide");
if (!shell.includes("syncQueuedGameResults")) failures.push("game shell must retain offline result synchronization");

for (const script of [
  "kids:memory:check", "kids:wudu:check", "kids:verse:check", "kids:quiz:check",
  "kids:mosque:check", "kids:road:check", "kids:jump:check", "kids:hilal:check", "kids:games:check",
]) {
  if (!packageJson.scripts?.[script]) failures.push(`missing verification script: ${script}`);
}
if (!packageJson.scripts?.["kids:games:check"]?.includes("verify-kids-games-final")) failures.push("kids:games:check must use the final unified games verifier");
if (!packageJson.scripts?.verify?.includes("pnpm kids:games:check")) failures.push("verify must include kids games verification");
if (!packageJson.scripts?.["verify:pr"]?.includes("pnpm kids:games:check")) failures.push("verify:pr must include kids games verification");

if (existsSync("scripts/verify-kids-games-final.ts")) {
  const check = spawnSync("pnpm", ["exec", "tsx", "scripts/verify-kids-games-final.ts"], { encoding: "utf8" });
  if (check.status !== 0) {
    failures.push("verify-kids-games-final.ts failed when executed");
    if (check.stderr?.trim()) console.error(check.stderr.trim());
  }
} else {
  failures.push("scripts/verify-kids-games-final.ts is missing");
}

if (failures.length) {
  console.error("KIDS_PRODUCTION_CHECK_FAILED");
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exit(1);
}
console.log("✅ Phase 15 Kids production checks passed");
