import type { WuduStep } from "@/lib/games/verified-content";

export type IndexedVerseToken = {
  id: string;
  index: number;
  text: string;
};

function seedNumber(seed: string) {
  let value = 2166136261;
  for (const character of seed) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const result = [...items];
  let state = seedNumber(seed) || 1;
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swapIndex = state % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function shuffleWuduSteps(steps: readonly WuduStep[], seed: string) {
  return seededShuffle(steps, `wudu:${seed}`);
}

export function shuffleVerseTokens(words: readonly string[], seed: string): IndexedVerseToken[] {
  return seededShuffle(
    words.map((text, index) => ({ id: `verse-token-${index}`, index, text })),
    `verse:${seed}`,
  );
}

export function isVerseOrderComplete(answer: readonly number[], tokenCount: number) {
  return answer.length === tokenCount && answer.every((sourceIndex, position) => sourceIndex === position);
}

export type GameKeyAction = "left" | "right" | "up" | "down" | "jump";

const GAME_KEY_BY_CODE: Record<string, GameKeyAction> = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  Space: "jump",
};

/**
 * Maps a keyboard event to a game action using the physical key (`code`) so
 * W/A/S/D keep working on Arabic and other non-Latin keyboard layouts, where
 * `event.key` would be a different character.
 */
export function gameKeyAction(event: { code?: string; key?: string }): GameKeyAction | null {
  const byCode = event.code ? GAME_KEY_BY_CODE[event.code] : undefined;
  if (byCode) return byCode;
  switch (event.key) {
    case "ArrowLeft":
      return "left";
    case "ArrowRight":
      return "right";
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case " ":
      return "jump";
    default:
      return null;
  }
}
