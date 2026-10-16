import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GAME_REGISTRY } from "../../src/lib/games/registry";

const gameIds = Object.keys(GAME_REGISTRY) as Array<keyof typeof GAME_REGISTRY>;
const artSource = readFileSync("src/features/kids/components/games/kids-game-art.tsx", "utf8");
const stageSource = readFileSync("src/features/kids/components/games/world-game-stage.tsx", "utf8");
const homeSource = readFileSync("src/app/kids/page.tsx", "utf8");

assert.equal(gameIds.length, 12, "the canonical Kids catalog must continue to expose 12 games");
assert.match(artSource, /useId\(\)/, "SVG artwork IDs must be unique when cards repeat on the same page");
assert.match(artSource, /aria-label": label/, "game illustrations need a localized accessible name");
assert.match(homeSource, /KidsGameArt/, "the Kids landing page must show game-specific artwork");

const artCases = artSource.match(/case "[a-z-]+":/g) ?? [];
assert.equal(artCases.length, gameIds.length, "every game needs one explicit art scene");
const runtimeCases = stageSource.match(/case "[a-z-]+":/g) ?? [];
assert.equal(runtimeCases.length, gameIds.length, "every registered game needs an explicit gameplay dispatch");

for (const id of gameIds) {
  const game = GAME_REGISTRY[id];
  assert.ok(artSource.includes('case "' + id + '":'), "missing original artwork for " + id);
  assert.ok(stageSource.includes('case "' + id + '":'), "missing gameplay runtime for " + id);
  assert.ok(game.titleAr.trim().length > 0 && game.titleEn.trim().length > 0, "game names must be localized: " + id);
  assert.ok(game.descriptionAr.trim().length > 0 && game.goalAr.trim().length > 0, "game content and goal must be defined: " + id);
  assert.ok(game.runtimeKind, "each game must have a distinct registered runtime kind: " + id);
}

assert.equal(
  new Set(gameIds.map((id) => GAME_REGISTRY[id].titleAr)).size,
  gameIds.length,
  "each game must have its own Arabic identity",
);
assert.equal(
  new Set(gameIds.map((id) => GAME_REGISTRY[id].runtimeKind)).size,
  gameIds.length,
  "each game must retain its own gameplay runtime",
);

console.log("✅ Kids visual contract passed: localized art, unique SVG ids, 12 art scenes, 12 runtime dispatches and game-specific learning goals.");
