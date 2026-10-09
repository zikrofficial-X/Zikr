import { getVerifiedMemoryPairs } from "@/lib/games/verified-content";

const REQUIRED_PAIRS = 11;
const REQUIRED_DIFFICULTIES = [
  { name: "easy", pairs: 3 },
  { name: "normal", pairs: 4 },
  { name: "hard", pairs: 5 },
] as const;

const pairs = getVerifiedMemoryPairs();

if (pairs.length !== REQUIRED_PAIRS) {
  throw new Error(`ZIKR Memory requires exactly ${REQUIRED_PAIRS} verified pairs; found ${pairs.length}.`);
}

const ids = new Set<string>();
for (const pair of pairs) {
  if (ids.has(pair.id)) throw new Error(`Duplicate ZIKR Memory pair id: ${pair.id}`);
  ids.add(pair.id);

  if (pair.situation.trim().length < 2) {
    throw new Error(`Invalid ZIKR Memory situation for ${pair.id}`);
  }

  if (pair.dhikr.trim().length < 2) {
    throw new Error(`Invalid ZIKR Memory dhikr for ${pair.id}`);
  }
}

for (const level of REQUIRED_DIFFICULTIES) {
  if (pairs.length < level.pairs) {
    throw new Error(`ZIKR Memory difficulty ${level.name} requires ${level.pairs} pairs.`);
  }
}

// Boards never show two pairs with identical dhikr text, so the unique-text pool must cover the largest board.
const uniqueDhikr = new Set(pairs.map(pair => pair.dhikr.trim())).size;
if (uniqueDhikr < 6) {
  throw new Error(`ZIKR Memory needs at least 6 unique dhikr texts for the largest board; found ${uniqueDhikr}.`);
}

console.log(`ZIKR Memory content check passed: ${pairs.length} verified pairs.`);
