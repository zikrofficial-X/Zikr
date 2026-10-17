import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const hook = read("src/features/kids/components/games/use-managed-timeouts.ts");
const learning = read("src/features/kids/components/games/kids-learning-games.tsx");
const runnerRoad = read("src/features/kids/components/games/kids-action-runner-road.tsx");
const adventure = read("src/features/kids/components/games/kids-action-adventure.tsx");

assert.ok(hook.includes("window.clearTimeout(timer.timeoutId)"), "managed timers must be cancellable");
assert.ok(hook.includes("useEffect(() => () => clearPendingTimeouts(), [clearPendingTimeouts, resetKey]);"), "managed timers must clear on reset-key changes and unmount");
assert.ok(hook.includes("pendingTimeoutsRef.current.delete(id)"), "completed timers must be removed from the pending registry");
assert.ok(hook.includes("paused = false"), "managed timeouts must accept the gameplay pause state");
assert.ok(hook.includes("const elapsed = Date.now() - timer.startedAt;"), "pausing must calculate elapsed timer time");
assert.ok(hook.includes("timer.remainingMs = Math.max(0, timer.remainingMs - elapsed);"), "pausing must preserve the remaining timeout delay");
assert.ok(hook.includes("if (timer.timeoutId === null) startTimeout(id, timer);"), "resuming must restart each paused timeout");
assert.ok(hook.includes("if (!pausedRef.current) startTimeout(id, timer);"), "new timeouts must not run while gameplay is already paused");

function section(source: string, start: string, end?: string) {
  const startIndex = source.indexOf(start);
  assert.ok(startIndex >= 0, "Missing game section: " + start);
  const endIndex = end ? source.indexOf(end, startIndex + start.length) : source.length;
  assert.ok(!end || endIndex >= 0, "Missing end marker for game section: " + start);
  return source.slice(startIndex, endIndex >= 0 ? endIndex : undefined);
}

const wudu = section(learning, "export function WuduChallengeGame", "export function VersePuzzleGame");
const verse = section(learning, "export function VersePuzzleGame", "export function ZikrQuizGame");
const quiz = section(learning, "export function ZikrQuizGame");
for (const [name, source, count] of [
  ["Wudu", wudu, 1],
  ["Verse Puzzle", verse, 2],
  ["Quiz", quiz, 2],
] as const) {
  assert.ok(source.includes('useManagedTimeouts(difficulty + ":" + restartToken + ":" + levelIndex, paused)'), name + " must scope pending callbacks to difficulty, restart, and level");
  assert.equal((source.match(/scheduleTimeout\(/g) ?? []).length, count, name + " must use managed timers for every delayed state transition");
  assert.ok(!source.includes("window.setTimeout("), name + " must not own unmanaged timeouts");
}
assert.ok(verse.includes("rules.mistakePenalty, scheduleTimeout, score]"), "Verse Puzzle completion effect must declare its managed scheduler dependency");
assert.ok(quiz.includes("onSound, scheduleTimeout, score, streak]"), "Quiz completion effect must declare its managed scheduler dependency");

const runner = section(runnerRoad, "export function ZikrRunnerGame", "export function ZikrRoadGame");
const road = section(runnerRoad, "export function ZikrRoadGame");
for (const [name, source] of [["Runner", runner], ["Road", road]] as const) {
  assert.ok(source.includes('useManagedTimeouts(difficulty + ":" + restartToken + ":"'), name + " must scope checkpoint callbacks to the current run");
  assert.equal((source.match(/scheduleTimeout\(/g) ?? []).length, 1, name + " checkpoint callbacks must use the managed scheduler");
  assert.ok(!source.includes("window.setTimeout("), name + " must not keep an unmanaged checkpoint timeout");
}

const values = read("src/features/kids/components/games/kids-values-coloring.tsx");
const deeds = section(values, "export function GoodDeedsGame", "export function MosqueCleanupGame");
const cleanup = section(values, "export function MosqueCleanupGame", "export function ZikrColoringGame");
const coloring = section(values, "export function ZikrColoringGame");
for (const [name, source] of [["Good Deeds", deeds], ["Cleanup", cleanup], ["Coloring", coloring]] as const) {
  assert.ok(source.includes('useManagedTimeouts(difficulty + ":" + restartToken + ":" + levelIndex, paused)'), name + " must scope callbacks to difficulty, restart, and level");
  assert.equal((source.split("scheduleTimeout(").length - 1), 1, name + " level advancement must use the managed scheduler");
  assert.ok(!source.includes("window.setTimeout("), name + " must not keep unmanaged level-advance timers");
}

const hilal = section(adventure, "export function HilalFlyGame", "export function MosqueAdventureGame");
assert.ok(hilal.includes('useManagedTimeouts(difficulty + ":" + restartToken + ":" + state.levelIndex, paused)'), "Hilal Fly must scope gesture cleanup to the active level");
assert.equal((hilal.match(/scheduleTimeout\(/g) ?? []).length, 1, "Hilal Fly swipe cleanup must use the managed timeout scheduler");
assert.ok(!hilal.includes("window.setTimeout("), "Hilal Fly must not retain unmanaged gesture timers");

const mosque = section(adventure, "export function MosqueAdventureGame");
assert.ok(mosque.includes('useManagedTimeouts(difficulty + ":" + restartToken + ":" + levelIndex, paused)'), "Mosque Adventure must scope timers to the current level");
assert.equal((mosque.match(/scheduleTimeout\(/g) ?? []).length, 2, "Mosque Adventure level and question callbacks must use the managed scheduler");
assert.ok(!mosque.includes("window.setTimeout("), "Mosque Adventure must not keep unmanaged progression timeouts");

console.log("Kids timer safety contract passed: all managed game callbacks pause/resume and cancel on reset or unmount.");
