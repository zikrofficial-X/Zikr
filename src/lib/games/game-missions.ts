import type { GameId, GameDifficulty } from "@/lib/games/registry";

export type GameMissionMetric = "score" | "collectibles" | "distance" | "combo" | "complete";

export type GameMission = {
  id: string;
  gameId: GameId;
  titleAr: string;
  descriptionAr: string;
  metric: GameMissionMetric;
  target: number;
  difficulty: GameDifficulty;
  rewardLabel: string;
};

const MISSION_TEMPLATES: Array<Omit<GameMission, "id" | "gameId" | "titleAr" | "descriptionAr"> & { key: string }> = [
  { key: "focus", metric: "collectibles", target: 5, difficulty: "easy", rewardLabel: "شارة التركيز" },
  { key: "score", metric: "score", target: 1200, difficulty: "normal", rewardLabel: "شارة النقاط" },
  { key: "combo", metric: "combo", target: 3, difficulty: "normal", rewardLabel: "شارة السلسلة" },
  { key: "distance", metric: "distance", target: 3500, difficulty: "easy", rewardLabel: "شارة الرحلة" },
  { key: "complete", metric: "complete", target: 1, difficulty: "easy", rewardLabel: "شارة الإنجاز" },
];

const TITLES: Record<string, string> = {
  focus: "مهمة التركيز",
  score: "مهمة النقاط",
  combo: "مهمة السلسلة",
  distance: "مهمة الرحلة",
  complete: "مهمة الإكمال",
};

const DESCRIPTIONS: Record<string, (target: number) => string> = {
  focus: target => `اجمع ${target} عناصر في جولة اليوم.`,
  score: target => `حقق ${target.toLocaleString("ar-EG")} نقطة أو أكثر.`,
  combo: target => `كوّن سلسلة من ${target} حركات متتالية.`,
  distance: target => `اقطع مسافة ${target.toLocaleString("ar-EG")} مترًا.`,
  complete: () => "أكمل الجولة حتى النهاية.",
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function hash(text: string) {
  let value = 2166136261;
  for (const ch of text) value = Math.imul(value ^ ch.charCodeAt(0), 16777619);
  return value >>> 0;
}

export function getDailyMission(gameId: GameId, date = new Date()): GameMission {
  const key = dayKey(date);
  const template = MISSION_TEMPLATES[hash(gameId + ":" + key) % MISSION_TEMPLATES.length];
  return {
    id: `daily:${key}:${gameId}:${template.key}`,
    gameId,
    titleAr: TITLES[template.key],
    descriptionAr: DESCRIPTIONS[template.key](template.target),
    metric: template.metric,
    target: template.target,
    difficulty: template.difficulty,
    rewardLabel: template.rewardLabel,
  };
}

export function getMissionProgress(mission: GameMission, hud: {
  score: number;
  collectibles: number;
  distance: number;
  combo: number;
  completed: boolean;
}) {
  const value =
    mission.metric === "score"
      ? hud.score
      : mission.metric === "collectibles"
        ? hud.collectibles
        : mission.metric === "distance"
          ? hud.distance
          : mission.metric === "combo"
            ? hud.combo
            : hud.completed
              ? 1
              : 0;

  return {
    value: Math.max(0, Math.floor(value)),
    target: mission.target,
    percent: Math.min(100, Math.round((Math.max(0, value) / Math.max(1, mission.target)) * 100)),
    completed: value >= mission.target,
  };
}
