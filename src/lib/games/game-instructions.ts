import type { GameId } from "@/lib/games/registry";

type Pair = readonly [ar: string, en: string];
type GuideRecord = {
  title: Pair;
  intro: Pair;
  steps: readonly [Pair, Pair, Pair];
  touch: Pair;
  keyboard: Pair;
  success: Pair;
};

const GUIDES: Record<GameId, GuideRecord> = {
  "letter-lab": {
    title: ["مختبر الحروف", "Arabic Letter Lab"],
    intro: [
      "تعرّف على الحرف الظاهر واختر البطاقة المطابقة.",
      "Recognize the letter shown and choose the matching card.",
    ],
    steps: [
      ["انظر إلى الحرف الكبير.", "Look at the large target letter."],
      ["انطق الحرف بصوتك.", "Say the letter aloud."],
      ["اختر البطاقة المطابقة.", "Choose the matching card."],
    ],
    touch: [
      "المس البطاقة التي تحمل الحرف نفسه.",
      "Tap the card with the same letter.",
    ],
    keyboard: [
      "استخدم Tab ثم Enter أو المسافة.",
      "Use Tab, then Enter or Space.",
    ],
    success: [
      "تعلّم من كل محاولة ولا تستعجل.",
      "Learn from each attempt and take your time.",
    ],
  },
  "zikr-runner": {
    title: ["انطلق مع نجمة ذِكر", "Run with ZIKR Star"],
    intro: [
      "رحلة حركة قصيرة؛ ركّز على الطريق واختر اللحظة المناسبة لتفادي العوائق.",
      "A short movement adventure. Watch the path and react calmly to obstacles.",
    ],
    steps: [
      [
        "تحرّك يمينًا ويسارًا لاختيار المسار الآمن.",
        "Move left or right to choose a safe lane.",
      ],
      ["اجمع النجوم التي تظهر أمامك.", "Collect the stars along the path."],
      [
        "تجنّب العوائق واستمر نحو هدف الجولة.",
        "Avoid obstacles and continue toward the round goal.",
      ],
    ],
    touch: [
      "اسحب داخل ساحة اللعب أو استخدم أزرار الاتجاهات.",
      "Swipe inside the play area or use the on-screen direction buttons.",
    ],
    keyboard: [
      "استخدم الأسهم أو A وD للحركة.",
      "Use the arrow keys or A/D to move.",
    ],
    success: [
      "اجمع النجوم وتجاوز العوائق بهدوء.",
      "Collect stars while safely avoiding obstacles.",
    ],
  },
  "zikr-memory": {
    title: ["اكتشف أزواج البطاقات", "Find the matching cards"],
    intro: [
      "درّب ذاكرتك البصرية في لوحة بطاقات مستوحاة من مواقف يومية.",
      "Train visual memory with cards inspired by everyday moments.",
    ],
    steps: [
      ["اقلب بطاقة ولاحظ الرمز.", "Reveal a card and remember its symbol."],
      [
        "اقلب بطاقة ثانية وابحث عن الزوج المطابق.",
        "Reveal a second card and look for its match.",
      ],
      [
        "تذكّر أماكن البطاقات حتى تكمل الأزواج.",
        "Remember card positions until all pairs are matched.",
      ],
    ],
    touch: ["المس بطاقتين في كل محاولة.", "Tap two cards per turn."],
    keyboard: [
      "انتقل بـ Tab واختر بـ Enter أو المسافة.",
      "Use Tab to focus a card and Enter or Space to select it.",
    ],
    success: [
      "أكمل كل الأزواج مع أقل عدد من المحاولات.",
      "Match every pair with thoughtful choices.",
    ],
  },
  "wudu-challenge": {
    title: ["رتّب خطوات الوضوء", "Put the wudu steps in order"],
    intro: [
      "نشاط تعليمي لترتيب الخطوات الواردة في الدرس المعتمد.",
      "A learning activity about ordering steps from the approved lesson.",
    ],
    steps: [
      ["اقرأ الخطوة المعروضة جيدًا.", "Read the displayed step carefully."],
      ["اختر الخطوة التي تأتي بعدها.", "Choose the step that comes next."],
      ["تابع حتى تكتمل الجولة.", "Continue until the round is complete."],
    ],
    touch: ["المس الاختيار المناسب.", "Tap the option you think is correct."],
    keyboard: [
      "استخدم Tab ثم Enter أو المسافة للاختيار.",
      "Use Tab, then Enter or Space to choose.",
    ],
    success: [
      "رتّب الخطوات التعليمية ترتيبًا صحيحًا.",
      "Place the educational steps in the correct order.",
    ],
  },
  "verse-puzzle": {
    title: ["كوّن الآية من كلماتها", "Build the verse from its words"],
    intro: [
      "استخدم الكلمات كما وردت في النص الموثّق دون تغيير أو إعادة صياغة.",
      "Use words from the verified source without changing or paraphrasing them.",
    ],
    steps: [
      ["لاحظ موضع الكلمة التالية.", "Think about which word comes next."],
      [
        "اختر الكلمة المناسبة من البطاقات.",
        "Choose a word from the available tiles.",
      ],
      [
        "استخدم التلميح عند الحاجة وأكمل النص.",
        "Use a hint when needed and complete the source text.",
      ],
    ],
    touch: [
      "المس بطاقة الكلمة التي تريد إضافتها.",
      "Tap the word tile you want to add.",
    ],
    keyboard: [
      "استخدم Tab ثم Enter أو المسافة للاختيار.",
      "Use Tab, then Enter or Space to choose a word.",
    ],
    success: [
      "أكمل ترتيب الكلمات اعتمادًا على المصدر الموثّق.",
      "Complete the word order using the verified source.",
    ],
  },
  "zikr-quiz": {
    title: ["فكّر ثم اختر", "Think, then choose"],
    intro: [
      "أسئلة قصيرة مع وقت للتفكير قبل الانتقال للسؤال التالي.",
      "Short questions with time to think before moving on.",
    ],
    steps: [
      ["اقرأ السؤال كاملًا.", "Read the whole question."],
      [
        "اختر الإجابة الأقرب لما تعلمته.",
        "Choose the answer that best matches what you learned.",
      ],
      [
        "استفد من ميزة 50/50 إذا احتجت.",
        "Use the 50/50 helper if you need a clue.",
      ],
    ],
    touch: [
      "المس الإجابة التي تريد اختيارها.",
      "Tap the answer you want to select.",
    ],
    keyboard: [
      "استخدم Tab ثم Enter أو المسافة.",
      "Use Tab, then Enter or Space to select.",
    ],
    success: [
      "تعلّم من التغذية الراجعة بعد كل إجابة.",
      "Learn from the feedback after each answer.",
    ],
  },
  "mosque-adventure": {
    title: ["استكشف المحطات", "Explore the stations"],
    intro: [
      "مغامرة في عالم خيالي؛ كل محطة متاحة تحتوي مهمة تعليمية.",
      "Explore a fictional world where each available station has a learning task.",
    ],
    steps: [
      ["ابدأ من محطة متاحة.", "Start at an available station."],
      ["اقرأ سؤال أو مهمة المحطة.", "Read the station's question or task."],
      ["أجب لتتقدم في الرحلة.", "Answer to continue the journey."],
    ],
    touch: [
      "المس المحطة المتاحة ثم اختر الإجابة.",
      "Tap an available station, then choose an answer.",
    ],
    keyboard: [
      "استخدم Tab للتنقل بين المحطات والاختيارات.",
      "Use Tab to move between stations and answer choices.",
    ],
    success: [
      "أكمل أهداف الرحلة وافتح المحطات التالية.",
      "Complete the journey objectives to unlock later stations.",
    ],
  },
  "zikr-road": {
    title: ["اختر المسار الآمن", "Choose a safe path"],
    intro: [
      "رحلة طريق تجمع بين الانتباه للحركة ونقاط التعلّم.",
      "A road journey combining careful movement with learning checkpoints.",
    ],
    steps: [
      [
        "غيّر المسار عندما يقترب عائق.",
        "Change lanes when an obstacle approaches.",
      ],
      ["اجمع العناصر الآمنة في الطريق.", "Collect safe items along the road."],
      [
        "أجب عن أسئلة المحطات ثم واصل.",
        "Answer learning checkpoints and keep moving.",
      ],
    ],
    touch: [
      "اسحب أو استخدم زري اليمين واليسار.",
      "Swipe or use the left and right buttons.",
    ],
    keyboard: [
      "استخدم السهمين أو A وD لتغيير المسار.",
      "Use Left/Right arrows or A/D to change lanes.",
    ],
    success: [
      "انتبه للأسئلة والعوائق معًا.",
      "Stay alert to both road obstacles and learning checkpoints.",
    ],
  },
  "zikr-jump": {
    title: ["اقفز بين المنصات", "Jump between platforms"],
    intro: [
      "تحتاج الجولة إلى توقيت القفزة وملاحظة مكان الهبوط.",
      "This round is about timing jumps and watching where you will land.",
    ],
    steps: [
      ["تحرّك نحو حافة المنصة.", "Move toward the edge of a platform."],
      ["اضغط القفز لتجاوز الفجوة.", "Jump to cross the gap."],
      [
        "اهبط على المنصة التالية واجمع النجوم.",
        "Land on the next platform and collect stars.",
      ],
    ],
    touch: [
      "استخدم أزرار اليمين واليسار والقفز.",
      "Use the on-screen left, right, and jump buttons.",
    ],
    keyboard: [
      "الأسهم للحركة والمسافة للقفز.",
      "Use arrow keys to move and Space to jump.",
    ],
    success: [
      "اعبر المنصات بهدوء وتعلّم من المحاولة.",
      "Cross the platforms carefully and learn from each attempt.",
    ],
  },
  "good-deeds": {
    title: ["اختر عملًا طيبًا", "Choose a kind action"],
    intro: [
      "حوّل قيمة جميلة إلى خطوة عملية صغيرة داخل سيناريو خيالي.",
      "Turn a positive value into a small practical step in a fictional scenario.",
    ],
    steps: [
      ["اختر المهمة التي تريد تجربتها.", "Choose the task you want to try."],
      ["اقرأ خطواتها القصيرة.", "Read its short action steps."],
      [
        "نفّذ خطوات المهمة حتى تكتمل.",
        "Complete the steps to finish the activity.",
      ],
    ],
    touch: [
      "المس بطاقة العمل ثم زر تنفيذ الخطوة.",
      "Tap an action card, then tap the step button.",
    ],
    keyboard: [
      "استخدم Tab للتنقل بين البطاقات والأزرار.",
      "Use Tab to move between cards and buttons.",
    ],
    success: [
      "أكمل خطوات العمل الطيب الذي اخترته.",
      "Complete the steps for your chosen kind action.",
    ],
  },
  "hilal-fly": {
    title: ["حلّق بالهلال", "Guide the crescent"],
    intro: [
      "وجّه الهلال عبر المساحات الآمنة واجمع النجوم وتجنّب العوائق.",
      "Guide the crescent through safe spaces, collecting stars and avoiding hazards.",
    ],
    steps: [
      ["ارفع الهلال أو اخفضه لتعديل مساره.", "Move the crescent up or down."],
      ["مرّ من الفتحات بين العوائق.", "Pass through openings between hazards."],
      [
        "اجمع النجوم عندما يكون الطريق آمنًا.",
        "Collect stars whenever the path is safe.",
      ],
    ],
    touch: [
      "استخدم أزرار أعلى وأسفل أو اسحب داخل الساحة.",
      "Use up/down buttons or swipe inside the play area.",
    ],
    keyboard: [
      "السهمان لأعلى وأسفل أو W وS للتحكم.",
      "Use Up/Down arrows or W/S to control height.",
    ],
    success: [
      "تقدّم لمسافة أبعد مع تفادي العوائق.",
      "Travel farther while avoiding obstacles.",
    ],
  },
  "mosque-cleanup": {
    title: ["رتّب العناصر في أماكنها", "Sort each item into place"],
    intro: [
      "نشاط تصنيف وترتيب؛ راقب علامة المنطقة قبل وضع العنصر.",
      "A sorting activity. Check the target's label before placing an item.",
    ],
    steps: [
      ["اختر العنصر الذي تريد نقله.", "Select an item to move."],
      [
        "اختر المكان الذي يناسبه أو اسحبه إليه.",
        "Choose a matching area or drag it into place.",
      ],
      ["كرّر حتى تكتمل العناصر.", "Repeat until every item is sorted."],
    ],
    touch: [
      "المس العنصر ثم مكانه الصحيح، أو اسحبه.",
      "Tap an item then its target, or drag it into place.",
    ],
    keyboard: [
      "استخدم Tab للتنقل بين العناصر والمناطق ثم Enter.",
      "Use Tab to focus items and zones, then Enter to select.",
    ],
    success: [
      "ضع كل عنصر في المنطقة المطابقة له.",
      "Place every item in its matching zone.",
    ],
  },
  "zikr-coloring": {
    title: ["اصنع لوحتك بالألوان", "Create your own color scene"],
    intro: [
      "اختر مساحة من الرسم ثم جرّب لونًا من اللوحة.",
      "Choose an area of the illustration, then try a color from the palette.",
    ],
    steps: [
      ["اختر اللون من لوحة الألوان.", "Choose a color from the palette."],
      ["المس المنطقة التي تريد تلوينها.", "Tap the area you want to paint."],
      [
        "جرّب ألوانًا مختلفة واحفظ لوحتك.",
        "Try different combinations and save your artwork.",
      ],
    ],
    touch: [
      "المس اللون ثم المنطقة المراد تلوينها.",
      "Tap a color, then the area you want to paint.",
    ],
    keyboard: [
      "استخدم Tab للتنقل بين الألوان ومناطق الرسم وأزرار الحفظ.",
      "Use Tab to navigate colors, drawing areas, and save controls.",
    ],
    success: [
      "لوّن المناطق التي تريدها واحفظ عملك محليًا.",
      "Color the areas you like and save your artwork locally.",
    ],
  },
};

export type KidsGameGuide = {
  title: string;
  intro: string;
  steps: readonly [string, string, string];
  touchControls: string;
  keyboardControls: string;
  success: string;
};

export function getGameInstructions(
  gameId: GameId,
  language: "ar" | "en"
): KidsGameGuide {
  const guide = GUIDES[gameId];
  const index = language === "en" ? 1 : 0;
  return {
    title: guide.title[index],
    intro: guide.intro[index],
    steps: [
      guide.steps[0][index],
      guide.steps[1][index],
      guide.steps[2][index],
    ],
    touchControls: guide.touch[index],
    keyboardControls: guide.keyboard[index],
    success: guide.success[index],
  };
}
