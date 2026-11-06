export type VideoScene = "calm" | "dawn" | "night" | "gold" | "emerald" | "paper" | "rose";

function stableIndex(seed: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % Math.max(1, length);
}

const SCENES: Record<string, VideoScene[]> = {
  quran: ["night", "dawn", "paper", "gold", "emerald"],
  hadith: ["paper", "gold", "night", "dawn", "calm"],
  dua: ["rose", "dawn", "emerald", "gold", "calm"],
  adhkar: ["emerald", "rose", "night", "dawn", "paper"],
  story: ["dawn", "gold", "night", "paper", "emerald"],
  stories: ["dawn", "gold", "night", "paper", "emerald"],
  other: ["calm", "gold", "emerald", "night", "paper"],
  video: ["calm", "dawn", "gold", "paper", "rose"],
};

const OPENING_HOOKS: Record<string, string[]> = {
  quran: [
    "هل توقفت يومًا عند معنى هذه الآية؟",
    "اقرأها بهدوء… ثم تأمل معناها.",
    "في هذه الآية معنى يستحق أن نتوقف عنده.",
    "ما المعنى الذي تحتاج أن تتذكره اليوم؟",
    "لا تتجاوز الآية قبل أن تتأمل معناها.",
  ],
  hadith: [
    "رسالة قصيرة تستحق أن نعمل بها.",
    "كيف يظهر هذا المعنى في يومنا؟",
    "ليس المهم أن نسمعها فقط، بل أن نعمل.",
    "معنى بسيط قد يغيّر تصرفًا اليوم.",
    "توقف لحظة واسأل نفسك: كيف أطبق هذا؟",
  ],
  dua: [
    "خذ لحظة وردّد الدعاء بقلب حاضر.",
    "اجعل لهذا الدعاء لحظة من يومك.",
    "عندما تضيق الكلمات، تذكّر هذا الدعاء.",
    "ردّدها بتأنٍ ولا تستعجل.",
    "دعاء قصير يستحق أن تحفظه.",
  ],
  adhkar: [
    "امنح يومك دقيقة من الذكر.",
    "لا تمرّ على الذكر بسرعة.",
    "ابدأ لحظتك بذكرٍ يطمئن القلب.",
    "دقيقة هادئة بعيدًا عن ضجيج اليوم.",
    "ردّد الذكر وتوقف مع معناه.",
  ],
  story: [
    "تفصيلة صغيرة غيّرت مجرى الحكاية.",
    "ماذا حدث بعد هذه اللحظة؟",
    "في هذه القصة معنى لا يُنسى.",
    "تابع الحكاية حتى تعرف ما الذي تغيّر.",
    "أحيانًا تبدأ العبرة من موقف بسيط.",
  ],
  stories: [
    "تفصيلة صغيرة غيّرت مجرى الحكاية.",
    "ماذا حدث بعد هذه اللحظة؟",
    "في هذه القصة معنى لا يُنسى.",
    "تابع الحكاية حتى تعرف ما الذي تغيّر.",
    "أحيانًا تبدأ العبرة من موقف بسيط.",
  ],
  other: [
    "خذ لحظة مع هذه الرسالة.",
    "كلمات بسيطة تستحق أن نتوقف عندها.",
    "ما الفكرة التي ستأخذها معك اليوم؟",
    "لا تكمل يومك قبل أن تتأمل هذه الفكرة.",
    "رسالة قصيرة… ومعنى يستحق وقتك.",
  ],
  video: [
    "خذ لحظة مع هذه الرسالة.",
    "كلمات بسيطة تستحق أن نتوقف عندها.",
    "ما الفكرة التي ستأخذها معك اليوم؟",
    "لا تكمل يومك قبل أن تتأمل هذه الفكرة.",
    "رسالة قصيرة… ومعنى يستحق وقتك.",
  ],
};

const KIDS_HOOKS = [
  "هل نكتشف سرّ الحكاية؟",
  "هيا نعرف ماذا حدث!",
  "مغامرة صغيرة وفكرة جميلة!",
  "توقّع ماذا سيحدث بعد ذلك؟",
];

export function resolveDeterministicVideoScene(input: {
  id: string;
  category: string;
  audience?: unknown;
}): VideoScene {
  const category = input.category.trim().toLowerCase();
  if (input.audience === "kids") {
    const kidsScenes: VideoScene[] = ["emerald", "dawn", "gold", "calm"];
    return kidsScenes[stableIndex(input.id, kidsScenes.length)];
  }
  const choices = SCENES[category] ?? SCENES.other;
  return choices[stableIndex(input.id, choices.length)];
}

export function resolveDeterministicVideoHook(input: {
  id: string;
  category: string;
  audience?: unknown;
}): string {
  const hooks = input.audience === "kids"
    ? KIDS_HOOKS
    : OPENING_HOOKS[input.category.trim().toLowerCase()] ?? OPENING_HOOKS.other;
  return hooks[stableIndex(input.id, hooks.length)];
}

export function resolveDeterministicVideoMotion(id: string): "fade" | "slow" {
  return stableIndex(id, 2) === 0 ? "fade" : "slow";
}
