import type { GameSoundEvent } from "@/lib/games/tone-feedback";
import type { GameId } from "@/lib/games/registry";

export type KidsGameAssetDefinition = {
  scene: {
    kind: "inline-svg";
    sourcePath: "src/features/kids/components/games/kids-game-art.tsx";
    viewBox: "0 0 640 320";
    loading: "on-demand";
    rightsStatus: "repository-managed-source";
  };
  background: {
    path: string;
    format: "webp";
    width: 2560;
    height: 1440;
    loading: "when-game-stage-mounts";
    rightsStatus: "license-source-review-required";
  };
  props: readonly { id: string; labelAr: string; labelEn: string }[];
  audio: {
    events: readonly GameSoundEvent[];
    optional: true;
    soundOffSupported: true;
    rightsStatus: "synthesized-tone-no-external-recordings";
  };
  motion: {
    reducedMotionFallback: "decorative-motion-disabled";
    gameplayTimingPreserved: true;
  };
};
const scene = {
  kind: "inline-svg",
  sourcePath: "src/features/kids/components/games/kids-game-art.tsx",
  viewBox: "0 0 640 320",
  loading: "on-demand",
  rightsStatus: "repository-managed-source",
} as const;
const audio = {
  events: ["start", "move", "jump", "collect", "success", "miss", "gameOver"],
  optional: true,
  soundOffSupported: true,
  rightsStatus: "synthesized-tone-no-external-recordings",
} as const;
const motion = {
  reducedMotionFallback: "decorative-motion-disabled",
  gameplayTimingPreserved: true,
} as const;
const prop = (id: string, labelAr: string, labelEn: string) => ({ id, labelAr, labelEn });
function assets(background: string, props: KidsGameAssetDefinition["props"]): KidsGameAssetDefinition {
  return {
    scene,
    background: { path: "/kids/games/" + background, format: "webp", width: 2560, height: 1440,
      loading: "when-game-stage-mounts", rightsStatus: "license-source-review-required" },
    props, audio, motion,
  };
}
export const KIDS_GAME_ASSET_MANIFEST: Record<GameId, KidsGameAssetDefinition> = {
  "letter-lab": assets("scene-night-garden.webp", [
    prop("target-letter", "الحرف المطلوب", "Target letter"), prop("letter-card", "بطاقة حرف", "Letter card"), prop("round-indicator", "مؤشر الجولة", "Round indicator"),
  ]),
  "zikr-runner": assets("scene-night-garden.webp", [
    prop("runner-character", "شخصية العداء", "Runner character"), prop("path-marker", "علامة الطريق", "Path marker"), prop("learning-checkpoint", "محطة تعلم", "Learning checkpoint"),
  ]),
  "zikr-memory": assets("scene-moon-sky.webp", [
    prop("memory-card", "بطاقة ذاكرة", "Memory card"), prop("matching-pair", "زوج متطابق", "Matching pair"), prop("situation-label", "بطاقة موقف", "Situation label"),
  ]),
  "wudu-challenge": assets("scene-mosque-courtyard.webp", [
    prop("wudu-step-card", "بطاقة خطوة الوضوء", "Wudu step card"), prop("step-progress", "تقدم الخطوات", "Step progress"), prop("completion-mark", "علامة الإكمال", "Completion mark"),
  ]),
  "verse-puzzle": assets("scene-moon-sky.webp", [
    prop("verse-token", "كلمة من الآية", "Verse token"), prop("sequence-slot", "موضع الكلمة", "Sequence slot"), prop("source-reference", "مرجع الآية", "Verse source reference"),
  ]),
  "zikr-quiz": assets("scene-night-garden.webp", [
    prop("question-panel", "لوحة السؤال", "Question panel"), prop("answer-card", "بطاقة إجابة", "Answer card"), prop("streak-indicator", "مؤشر الإجابات المتتالية", "Streak indicator"),
  ]),
  "mosque-adventure": assets("scene-mosque-courtyard.webp", [
    prop("journey-map", "خريطة الرحلة", "Journey map"), prop("learning-station", "محطة تعلم", "Learning station"), prop("scenario-checkpoint", "نقطة سؤال", "Scenario checkpoint"),
  ]),
  "zikr-road": assets("scene-moon-sky.webp", [
    prop("road-lane", "مسار الطريق", "Road lane"), prop("hazard-marker", "علامة عائق", "Hazard marker"), prop("road-question", "سؤال الطريق", "Road question"),
  ]),
  "zikr-jump": assets("scene-night-garden.webp", [
    prop("jump-platform", "منصة قفز", "Jump platform"), prop("collectible-star", "نجمة", "Collectible star"), prop("landing-indicator", "علامة الهبوط", "Landing indicator"),
  ]),
  "good-deeds": assets("scene-mosque-courtyard.webp", [
    prop("kindness-task", "مهمة خير", "Kindness task"), prop("value-symbol", "رمز قيمة", "Value symbol"), prop("task-completion", "إتمام المهمة", "Task completion"),
  ]),
  "hilal-fly": assets("scene-moon-sky.webp", [
    prop("crescent-character", "شخصية الهلال", "Crescent character"), prop("flight-obstacle", "عائق طيران", "Flight obstacle"), prop("night-star", "نجمة ليلية", "Night star"),
  ]),
  "mosque-cleanup": assets("scene-mosque-courtyard.webp", [
    prop("sortable-item", "عنصر للترتيب", "Sortable item"), prop("target-area", "مكان العنصر", "Target area"), prop("cleanup-progress", "تقدم الترتيب", "Cleanup progress"),
  ]),
  "zikr-coloring": assets("scene-night-garden.webp", [
    prop("coloring-scene", "لوحة تلوين", "Coloring scene"), prop("paint-region", "منطقة تلوين", "Paint region"), prop("color-palette", "لوحة الألوان", "Color palette"),
  ]),
};
