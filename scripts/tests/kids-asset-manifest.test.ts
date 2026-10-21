import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { GAME_REGISTRY, type GameId } from "../../src/lib/games/registry";
import { KIDS_GAME_ASSET_MANIFEST } from "../../src/lib/games/asset-manifest";

const ids = Object.keys(GAME_REGISTRY) as GameId[];
assert.deepEqual(Object.keys(KIDS_GAME_ASSET_MANIFEST).sort(), [...ids].sort(),
  "asset manifest must cover exactly the canonical game registry");
const artworkPath = "src/features/kids/components/games/kids-game-art.tsx";
const artwork = readFileSync(artworkPath, "utf8");
const toneSource = readFileSync("src/lib/games/tone-feedback.ts", "utf8");
const motionCss = readFileSync("src/features/kids/components/games/kids-game-motion.css", "utf8");
const gameKit = readFileSync("src/features/kids/components/games/kids-game-kit.tsx", "utf8");
const knownEvents = ["start", "move", "jump", "collect", "success", "miss", "gameOver"];
for (const id of ids) {
  const entry = KIDS_GAME_ASSET_MANIFEST[id];
  assert.ok(artwork.includes('case "' + id + '"'), id + " needs a game-specific SVG scene");
  assert.equal(entry.scene.sourcePath, artworkPath);
  assert.equal(entry.scene.loading, "on-demand");
  assert.equal(entry.scene.viewBox, "0 0 640 320");
  assert.match(entry.background.path, /^\\/kids\\/games\\/[\\w-]+\\.webp$/, id + " must use a local background");
  const diskPath = join("public", entry.background.path.slice(1));
  assert.ok(existsSync(diskPath), id + " background is missing: " + diskPath);
  assert.ok(statSync(diskPath).size > 1000, id + " background file is suspiciously small");
  assert.equal(entry.background.width, 2560);
  assert.equal(entry.background.height, 1440);
  assert.equal(entry.background.format, "webp");
  assert.equal(entry.background.loading, "when-game-stage-mounts");
  assert.equal(entry.background.rightsStatus, "license-source-review-required");
  assert.ok(entry.props.length >= 3, id + " needs a documented prop inventory");
  assert.equal(new Set(entry.props.map(item => item.id)).size, entry.props.length, id + " prop IDs must be unique");
  assert.ok(entry.props.every(item => item.labelAr.trim() && item.labelEn.trim()), id + " prop names must be bilingual");
  assert.deepEqual([...entry.audio.events].sort(), [...knownEvents].sort());
  assert.ok(entry.audio.events.every(event => toneSource.includes(event + ":")), id + " declares an unsupported tone event");
  assert.equal(entry.audio.optional, true);
  assert.equal(entry.audio.soundOffSupported, true);
  assert.equal(entry.audio.rightsStatus, "synthesized-tone-no-external-recordings");
  assert.equal(entry.motion.reducedMotionFallback, "decorative-motion-disabled");
}
assert.match(gameKit, /kids-game-motion\\.css/);
assert.match(gameKit, /kids-game-stage/);
assert.match(motionCss, /prefers-reduced-motion:\\s*reduce/);
assert.doesNotMatch(motionCss, /https?:\\/\\//);
console.log("Kids asset manifest passed: " + ids.length + " games, local backgrounds, bilingual prop metadata, optional audio, and reduced-motion fallback.");
