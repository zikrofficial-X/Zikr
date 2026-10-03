import type { GameDifficulty, GameId } from "@/lib/games/registry";

export const KIDS_LEVEL_COUNT = 20;

export type KidsLevelMeta = {
  index: number;
  number: number;
  id: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  seed: number;
  pace: number;
  density: number;
  pattern: number;
  palette: number;
};

const TITLES: Record<GameId, string[]> = {
  "zikr-runner": ["حديقة الذكر","سوق الأمانة","طريق المسجد","وادي النجوم","الفجر الهادئ","البوابة الذهبية"],
  "zikr-memory": ["بطاقات البداية","ممر المواقف","حديقة التذكر","مكتبة الذكر","ساحة التركيز","نجوم الذاكرة"],
  "wudu-challenge": ["قطرة البداية","مجرى الماء","محطة النقاء","حديقة الوضوء","نافورة الهدوء","ماء الفجر"],
  "verse-puzzle": ["الكلمة الأولى","درج الآية","ممر الحروف","ساحة الترتيب","نور الكلمات","بوابة الآية"],
  "zikr-quiz": ["سؤال البداية","محطة الفهم","ممر المعرفة","جولة التركيز","اختبار النجوم","تحدي المعنى"],
  "mosque-adventure": ["البوابة","الساحة","المكتبة","الحديقة","المئذنة","بوابة النور"],
  "zikr-road": ["طريق البداية","طريق السوق","طريق المسجد","طريق النجوم","طريق الفجر","الطريق الذهبي"],
  "zikr-jump": ["أول خطوة","حديقة النجوم","الساحة الهادئة","سماء واسعة","طريق الهلال","الخاتمة الذهبية"],
  "good-deeds": ["مساعدة صغيرة","كلمة طيبة","ترتيب المكان","مشاركة جميلة","مسار التعاون","صندوق الخير"],
  "hilal-fly": ["حديقة القمر","سماء فضية","ليل الفوانيس","المدينة الهادئة","طريق النجوم","الفجر الذهبي"],
  "mosque-cleanup": ["ركن الكتب","ركن الضوء","ركن اللعب","ركن النباتات","الساحة","قاعة الترتيب"],
  "zikr-coloring": ["لوحة البداية","هلال صغير","حديقة هادئة","نجمة مضيئة","قبة المسجد","سماء الفجر"],
};

function hashSeed(gameId: GameId, difficulty: GameDifficulty, index: number) {
  let value = 2166136261;
  const input = gameId + ":" + difficulty + ":" + index;
  for (const ch of input) value = Math.imul(value ^ ch.charCodeAt(0), 16777619);
  return value >>> 0;
}

function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function getKidsLevelMeta(gameId: GameId, difficulty: GameDifficulty, levelIndex: number): KidsLevelMeta {
  const index = Math.max(0, Math.min(KIDS_LEVEL_COUNT - 1, Math.floor(levelIndex)));
  const seed = hashSeed(gameId, difficulty, index);
  const random = rng(seed);
  const difficultyBoost = difficulty === "easy" ? 0 : difficulty === "normal" ? 0.12 : 0.24;
  return {
    index,
    number: index + 1,
    id: gameId + "-" + difficulty + "-" + String(index + 1).padStart(2, "0"),
    titleAr: TITLES[gameId][index % TITLES[gameId].length] + " " + (index + 1),
    titleEn: "Level " + (index + 1),
    subtitleAr:
      index === 0
        ? "ابدأ بهدوء وتعرّف على طريقة اللعب."
        : index === KIDS_LEVEL_COUNT - 1
          ? "المرحلة الأخيرة في هذه الصعوبة. اجمع ما تستطيع."
          : "مرحلة مختلفة بنمط " + (["ألف","باء","جيم","دال","هاء","واو","زاي"][index % 7]) + "؛ ركّز قبل الحركة.",
    subtitleEn:
      index === 0
        ? "Start calmly and learn how the game works."
        : index === KIDS_LEVEL_COUNT - 1
          ? "The final level at this difficulty. Collect what you can."
          : "A different pattern is waiting. Focus before you move.",
    seed,
    pace: 0.92 + difficultyBoost + index * 0.018 + random() * 0.08,
    density: 0.86 + difficultyBoost * 0.7 + (index % 9) * 0.055 + random() * 0.08,
    pattern: Math.floor(random() * 8),
    palette: Math.floor(random() * 12),
  };
}

export function getKidsLevelSet(gameId: GameId, difficulty: GameDifficulty): KidsLevelMeta[] {
  return Array.from({ length: KIDS_LEVEL_COUNT }, (_, index) => getKidsLevelMeta(gameId, difficulty, index));
}
