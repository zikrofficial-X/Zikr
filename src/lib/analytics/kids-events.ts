"use client";

import type { GameDifficulty, GameId, GameRuntimeKind } from "@/lib/games/registry";

export type KidsGameAnalyticsEvent =
  | "game_opened"
  | "game_started"
  | "game_completed"
  | "game_replayed";

type KidsGameAnalyticsPayload = {
  gameId: GameId;
  difficulty: GameDifficulty;
  runtimeKind: GameRuntimeKind;
  durationSeconds?: number;
};

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

const KIDS_ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_KIDS_ANALYTICS_ENABLED === "true";

/**
 * Kids analytics is disabled by default. When explicitly enabled after the
 * consent/CMP review, events contain only game-level metrics and never a
 * child, account, device, or session identifier.
 */
export function trackKidsGameEvent(
  eventName: KidsGameAnalyticsEvent,
  payload: KidsGameAnalyticsPayload,
): void {
  if (!KIDS_ANALYTICS_ENABLED || typeof window === "undefined") return;

  const gtag = (window as GtagWindow).gtag;
  if (typeof gtag !== "function") return;

  const eventPayload: Record<string, string | number> = {
    game_id: payload.gameId,
    difficulty: payload.difficulty,
    runtime_kind: payload.runtimeKind,
  };

  if (typeof payload.durationSeconds === "number" && Number.isFinite(payload.durationSeconds)) {
    eventPayload.duration_seconds = Math.max(0, Math.floor(payload.durationSeconds));
  }

  gtag("event", eventName, eventPayload);
}
