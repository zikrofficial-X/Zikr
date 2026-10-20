import type { VideoSource, VideoSourceCategory } from "@/features/videos/services/video-sources";
import { getServerEnv } from "@/lib/env";
import { buildKidsSeriesEpisode, KIDS_SERIES_EPISODES_PER_SEASON } from "./kids-story-factory";

export type CuratedVideoSource = Omit<VideoSource, "category"> & {
  category: VideoSourceCategory | "other";
  editorialNote?: string;
};

const QURAN = "https://quran.com";
const SUNNAH = "https://sunnah.com";
const ZIKR = getServerEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export const CURATED_STORY_SOURCES: CuratedVideoSource[] = [
  { id: "curated-story-musa", category: "story", title: "موسى عليه السلام: من الخوف إلى الرسالة", text: "قصة موسى عليه السلام تمتد في القرآن عبر مشاهد متتابعة: حماية الطفل، الخروج إلى مدين، النداء عند الطور، مواجهة فرعون، ثم النجاة ببني إسرائيل. يصلح النص لفيديو وثائقي يفرق بين ما ورد في القرآن وما يروى في القصص الشعبية، ويجعل الآيات هي المرجع الأول.", sourceLabel: "القرآن الكريم — القصص وطه والشعراء", sourceUrl: `${QURAN}/28`, additionalSources: [{ label: "سورة طه", url: `${QURAN}/20` }, { label: "سورة الشعراء", url: `${QURAN}/26` }] },
  { id: "curated-story-yusuf", category: "story", title: "يوسف عليه السلام: الصبر وحسن العاقبة", text: "تقدم سورة يوسف قصة مترابطة عن الابتلاء والفراق والسجن ثم التمكين، مع التركيز على الصبر والعفة والعفو. المادة تصلح لفيديو طويل يقسم الرحلة إلى مراحل واضحة، ويؤكد أن التفاصيل المعتمدة هي ما جاء في القرآن، أما الإضافات المشهورة خارج النص فتحتاج إلى توثيق مستقل.", sourceLabel: "سورة يوسف — القرآن الكريم", sourceUrl: `${QURAN}/12` },
  { id: "curated-story-ibrahim", category: "story", title: "إبراهيم عليه السلام: التوحيد والابتلاء", text: "تعرض قصة إبراهيم عليه السلام مواقف متعددة في الدعوة إلى التوحيد، والنظر في آيات الله، والهجرة، وبناء البيت، والابتلاء. يمكن تحويلها إلى سلسلة قصيرة، كل حلقة منها ترتبط بموضع قرآني محدد بدلاً من جمع روايات غير موثقة في قصة واحدة.", sourceLabel: "القرآن الكريم — البقرة والأنعام ومريم وإبراهيم", sourceUrl: `${QURAN}/2`, additionalSources: [{ label: "سورة الأنعام", url: `${QURAN}/6` }, { label: "سورة مريم", url: `${QURAN}/19` }, { label: "سورة إبراهيم", url: `${QURAN}/14` }] },
  { id: "curated-story-nuh", category: "story", title: "نوح عليه السلام: الدعوة والصبر الطويل", text: "تروي سورة هود وسورة نوح جانباً من دعوة نوح عليه السلام إلى قومه، وتوضح طول الصبر وتنوع أساليب الدعوة ثم مشهد السفينة والنجاة. ينبغي في الفيديو عدم إضافة أرقام أو أسماء أو تفاصيل زمنية غير ثابتة، مع إبقاء التركيز على النص القرآني.", sourceLabel: "القرآن الكريم — هود ونوح", sourceUrl: `${QURAN}/11`, additionalSources: [{ label: "سورة نوح", url: `${QURAN}/71` }] },
  { id: "curated-story-ayyub", category: "story", title: "أيوب عليه السلام: البلاء والدعاء", text: "تقدم الآيات المتعلقة بأيوب عليه السلام نموذجاً في الصبر واللجوء إلى الله عند البلاء. تصلح المادة لفيديو تأملي قصير يركز على الدعاء والرجاء دون اختلاق وصف تفصيلي للمرض أو مدة البلاء ما لم يرد ذلك في مصدر موثوق.", sourceLabel: "القرآن الكريم — الأنبياء وص", sourceUrl: `${QURAN}/21`, additionalSources: [{ label: "سورة ص", url: `${QURAN}/38` }] },
  { id: "curated-story-maryam", category: "story", title: "مريم عليها السلام: العبادة والابتلاء", text: "يعرض القرآن جانباً كبيراً من قصة مريم عليها السلام في سورة آل عمران وسورة مريم، من اصطفائها وعبادتها إلى حملها بعيسى عليه السلام وما واجهته من ابتلاء. يركز السيناريو على الآيات الموثقة ويتجنب إعادة بناء مشاهد لم يذكرها النص.", sourceLabel: "القرآن الكريم — آل عمران ومريم", sourceUrl: `${QURAN}/3`, additionalSources: [{ label: "سورة مريم", url: `${QURAN}/19` }] },
  { id: "curated-story-people-cave", category: "story", title: "أصحاب الكهف: الثبات وحفظ الإيمان", text: "قصة أصحاب الكهف كما وردت في سورة الكهف تعرض مجموعة من الفتية الذين اعتزلوا قومهم حفاظاً على إيمانهم، ثم جاءت آيات الله بحفظهم وإظهار قصتهم. من المهم في الفيديو ألا نحدد أسماءهم أو عددهم أو تفاصيل حياتهم بما لم يثبته القرآن.", sourceLabel: "سورة الكهف — القرآن الكريم", sourceUrl: `${QURAN}/18` },
  { id: "curated-story-dhul-qarnayn", category: "story", title: "ذو القرنين: القوة مع المسؤولية", text: "تعرض سورة الكهف رحلة ذي القرنين ومشاهد من تعامله مع أقوام مختلفين وبنائه السد. المادة مناسبة لفيديو وثائقي يوضح ما يقوله النص وما لا يقوله، خصوصاً أن هوية ذي القرنين التاريخية محل نقاش ولا ينبغي تقديم شخصية تاريخية بعينها كحقيقة قطعية دون دليل.", sourceLabel: "سورة الكهف — القرآن الكريم", sourceUrl: `${QURAN}/18` },
  { id: "curated-story-badr", category: "story", title: "بدر: يوم الفرقان في القرآن والسنة", text: "يرتبط حديث بدر بسورة الأنفال وبمواضع من آل عمران، وتوجد روايات صحيحة في كتب الحديث تتناول أحداثاً وفضائل متعلقة بالغزوة. السيناريو المقترح يفرق بين الآيات والأحاديث الصحيحة وبين التفاصيل العسكرية التي تحتاج إلى مرجع تاريخي مستقل.", sourceLabel: "القرآن الكريم — الأنفال وآل عمران", sourceUrl: `${QURAN}/8`, additionalSources: [{ label: "سورة آل عمران", url: `${QURAN}/3` }, { label: "صحيح البخاري — أبواب المغازي", url: `${SUNNAH}/bukhari` }] },
  { id: "curated-story-abu-bakr", category: "story", title: "أبو بكر الصديق رضي الله عنه: الثبات بعد وفاة النبي ﷺ", text: "تظهر مكانة أبي بكر رضي الله عنه في مواقف ثابتة من السنة، ومن أشهرها موقفه بعد وفاة النبي ﷺ حين ثبت الناس وذكرهم بأن العبادة لله الحي الذي لا يموت. هذا النوع من الفيديو يعتمد على الحديث الصحيح ويبتعد عن الخطب المنسوبة بلا تخريج.", sourceLabel: "صحيح البخاري — حديث 1241–1242", sourceUrl: `${SUNNAH}/bukhari:1241`, additionalSources: [{ label: "صحيح البخاري — فضائل الصحابة", url: `${SUNNAH}/bukhari/62` }] },
  { id: "curated-story-umar", category: "story", title: "عمر بن الخطاب رضي الله عنه: مواقف من السيرة", text: "تجمع المادة بين مواقف ثابتة من فضائل عمر رضي الله عنه وما ورد في صحيح البخاري، مع التنبيه إلى أن السيرة الشعبية قد تتضمن تفاصيل تحتاج إلى تخريج. الهدف هو إنتاج قصة قصيرة موثقة لا سيرة كاملة بلا مراجع.", sourceLabel: "صحيح البخاري — فضائل عمر بن الخطاب", sourceUrl: `${SUNNAH}/bukhari:3683` },
  { id: "curated-story-khalid", category: "story", title: "خالد بن الوليد رضي الله عنه: من خبر مؤتة إلى سيف الله", text: "وردت أخبار صحيحة عن خالد بن الوليد رضي الله عنه في صحيح البخاري، ومنها الحديث الذي يذكر حمله الراية في مؤتة بعد استشهاد زيد وجعفر وابن رواحة رضي الله عنهم. يركز الفيديو على الرواية الثابتة ولا يضيف أرقاماً عسكرية غير موثقة.", sourceLabel: "صحيح البخاري — حديث 3757", sourceUrl: `${SUNNAH}/bukhari:3757` },
];

/** Season one is editor-visible; the worker can continue future seasons from the same factory. */
export const CURATED_KIDS_STORY_SOURCES: CuratedVideoSource[] = Array.from(
  { length: KIDS_SERIES_EPISODES_PER_SEASON },
  (_, index) => {
    const episode = buildKidsSeriesEpisode(index + 1);
    return {
      id: episode.sourceId,
      category: "story",
      title: episode.title,
      text: episode.text,
      sourceLabel: "قصة تربوية خيالية أصلية من ذِكر — ليست آية أو حديثًا أو واقعة تاريخية.",
      sourceUrl: `${ZIKR}/kids`,
      audience: "kids",
      seriesId: episode.seriesId,
      seriesTitle: episode.seriesTitle,
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      episodeTitle: episode.episodeTitle,
      ageGroup: episode.ageGroup,
      learningObjective: episode.learningObjective,
      visualTheme: episode.visualTheme,
      generationMode: episode.generationMode,
      editorialNote: `موسم ${episode.seasonNumber} — الحلقة ${episode.episodeNumber}. ${episode.learningObjective}. قصة خيالية تعليمية لا تنسب نصًا دينيًا أو حدثًا تاريخيًا إلى مصدر.`,
    };
  },
);

export const CURATED_ADHKAR_SOURCES: CuratedVideoSource[] = [
  { id: "curated-adhkar-subhanallah-100", category: "adhkar", title: "سبحان الله وبحمده — مائة مرة", text: "ذكر مأثور يمكن تقديمه في فيديو هادئ للصباح والمساء: سبحان الله وبحمده. ثبت في رياض الصالحين نقلاً عن صحيح مسلم فضل قوله مائة مرة في الصباح والمساء، ويجب عرض العدد والمرجع كما هما دون إضافة وعود غير ثابتة.", sourceLabel: "رياض الصالحين 1451 — رواه مسلم", sourceUrl: `${SUNNAH}/riyadussalihin:1451` },
  { id: "curated-adhkar-audhu-kalimat", category: "adhkar", title: "أعوذ بكلمات الله التامات من شر ما خلق", text: "من أذكار المساء المشهورة الثابتة: أعوذ بكلمات الله التامات من شر ما خلق. يقدم الفيديو العبارة مع عدد التكرار والمرجع بوضوح، مع تجنب تحويل الفضائل الواردة في الحديث إلى وعود دنيوية عامة.", sourceLabel: "حصن المسلم 97 — مع تخريج المصادر المذكورة فيه", sourceUrl: `${SUNNAH}/hisn:97` },
  { id: "curated-adhkar-bismillah-protection", category: "adhkar", title: "بسم الله الذي لا يضر مع اسمه شيء", text: "ذكر الصباح والمساء الذي يبدأ ببسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم. يمكن عرضه في بطاقة صوتية قصيرة مع بيان أنه يقال ثلاث مرات وفق المرجع المذكور.", sourceLabel: "حصن المسلم 86 — تخريج أبي داود والترمذي وابن ماجه", sourceUrl: `${SUNNAH}/hisn:86` },
  { id: "curated-adhkar-tawhid-100", category: "adhkar", title: "لا إله إلا الله وحده لا شريك له", text: "من أذكار التوحيد التي وردت في السنة قول: لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير. يذكر الفيديو العدد المروي في المصدر، ويعرض الفضل بصياغة منضبطة من الحديث نفسه.", sourceLabel: "حصن المسلم 93 — مع الإحالة إلى البخاري ومسلم", sourceUrl: `${SUNNAH}/hisn:93` },
  { id: "curated-adhkar-post-prayer", category: "adhkar", title: "التسبيح والتحميد والتكبير بعد الصلاة", text: "يمكن تحويل ذكر ما بعد الصلاة إلى مقطع صوتي تعليمي يذكّر المستخدم بالتسبيح والتحميد والتكبير بعد الفريضة. المرجع يذكر صيغاً وعدداً محدداً، لذلك لا ينبغي دمج صيغ مختلفة في بطاقة واحدة دون بيان الرواية.", sourceLabel: "صحيح البخاري 843 — كتاب الأذان", sourceUrl: `${SUNNAH}/bukhari:843` },
  { id: "curated-adhkar-two-light-words", category: "adhkar", title: "كلمتان خفيفتان على اللسان", text: "سبحان الله وبحمده، سبحان الله العظيم: ذكر قصير يصلح لمقطع لا يتجاوز دقيقة، مع شرح أن الحديث وصف الكلمتين بفضائل عظيمة. الأفضل إبقاء الفيديو على النص الثابت وعدم إضافة أرقام أو نتائج لم ترد في المصدر.", sourceLabel: "رياض الصالحين 1408 — متفق عليه", sourceUrl: `${SUNNAH}/riyadussalihin/15/3` },
  { id: "curated-adhkar-istighfar", category: "adhkar", title: "الاستغفار والتوبة", text: "مادة قصيرة عن ملازمة الاستغفار والتوبة، مع التفريق بين نصوص الاستغفار الثابتة وبين الأدعية العامة التي يصوغها المستخدم لنفسه. يمكن جعل الفيديو تذكيراً عملياً لا فتوى ولا وعداً بنتيجة محددة.", sourceLabel: "رياض الصالحين — كتاب الاستغفار", sourceUrl: `${SUNNAH}/riyadussalihin/19` },
  { id: "curated-adhkar-morning-evening", category: "adhkar", title: "ورد الصباح والمساء", text: "فيديو تجميعي يشرح فكرة ورد الصباح والمساء ويقسمه إلى وحدات: التوحيد، الاستعاذة، التسبيح، والاستغفار. كل ذكر يجب أن يحتفظ بمرجعه وعدده الخاص به، ولا يصح دمج الفضائل بين أحاديث مختلفة.", sourceLabel: "رياض الصالحين — كتاب الذكر", sourceUrl: `${SUNNAH}/riyadussalihin/15` },
  { id: "curated-adhkar-dhikr-after-salah", category: "adhkar", title: "ذكر الله بعد الصلاة", text: "تذكير صوتي هادئ بعد الصلاة يوجه المستخدم إلى المحافظة على الأذكار الثابتة بعد الفريضة. يفضل في الفيديو إظهار المرجع والعدد، مع إتاحة خيار الإيقاف أو التكرار دون ادعاء أن التسجيل نفسه عبادة مستقلة.", sourceLabel: "صحيح البخاري — كتاب الأذان", sourceUrl: `${SUNNAH}/bukhari/10` },
  { id: "curated-adhkar-dhikr-without-exaggeration", category: "adhkar", title: "الذكر الصحيح بلا مبالغات", text: "مقطع توعوي يشرح للمستخدم أن الذكر الثابت شيء، والعبارات المنتشرة المنسوبة إلى السنة شيء آخر. كل بطاقة في ذِكر يجب أن تذكر المصدر أو تصف نفسها صراحة بأنها دعاء عام غير منسوب.", sourceLabel: "منهج توثيق ذِكر + أبواب الذكر في كتب السنة", sourceUrl: `${SUNNAH}/riyadussalihin/15` },
  { id: "curated-adhkar-counts", category: "adhkar", title: "لماذا يظهر العدد بجوار الذكر؟", text: "العدد في واجهة الأذكار ليس رقماً تجميلياً؛ إذا ورد في الرواية عدد محدد يظهر كما هو، وإذا لم يثبت عدد فلا نخترع عدداً. هذه القاعدة تمنع الخلط بين السنة والتصميم التعليمي.", sourceLabel: "سياسة التوثيق التحريرية في ذِكر", sourceUrl: `${ZIKR}/about` },
];

export const CURATED_GENERAL_MESSAGES: CuratedVideoSource[] = [
  { id: "curated-message-prayer", category: "other", title: "الصلاة: موعد يتكرر كل يوم", text: "الصلاة ليست مجرد تنبيه على الهاتف؛ هي نقاط توقف تعيد ترتيب اليوم. ضع لكل صلاة مساحة قصيرة للاستعداد والهدوء، وأغلق المشتتات قدر الإمكان، واجعل التنبيه بداية للتهيؤ لا نهاية له.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-quran", category: "other", title: "ورد القرآن: القليل المستمر", text: "بدلاً من انتظار وقت طويل لقراءة القرآن، ابدأ بورد ثابت يناسب يومك ثم زد تدريجياً. الاستمرارية أهم من تصميم خطة مثالية لا تستطيع المحافظة عليها، ويمكن تقسيم الورد بين الصلوات أو أوقات الهدوء.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-dhikr", category: "other", title: "اجعل الذكر قريباً منك", text: "استخدم الأذكار كجزء من روتينك اليومي: في الصباح، بعد الصلاة، أثناء الانتظار، وقبل النوم. اختر نصوصاً موثقة من مكتبة ذِكر، وإذا وجدت عبارة منسوبة إلى حديث فراجع مصدرها قبل نشرها.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-family", category: "other", title: "عبادة الأسرة تبدأ بالعادات الصغيرة", text: "بدلاً من تحويل التربية الدينية إلى محاضرة طويلة، اصنع عادة مشتركة قصيرة: قراءة آية، سؤال عن معنى، ذكر بعد الصلاة، أو قصة موثقة قبل النوم. الهدف هو بناء بيئة مستمرة لا ضغط مؤقت.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-children", category: "other", title: "تعليم الأطفال بلا تعقيد", text: "ابدأ مع الطفل من المعنى والسلوك قبل كثرة المصطلحات: الصدق، الأمانة، الرحمة، احترام الوالدين، والمحافظة على الصلاة. استخدم القصص الموثقة كمدخل، ووضح للطفل عندما تكون القصة شرحاً تعليمياً لا نصاً حرفياً.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-tawbah", category: "other", title: "التوبة ليست كلمة عابرة", text: "عندما يخطئ الإنسان، لا تجعل الندم نهاية الطريق. حوّل التوبة إلى خطوات: الاعتراف بالخطأ، ترك سببه، إصلاح ما يمكن إصلاحه، ثم بناء عادة جديدة تقلل تكرار الخطأ.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-gratitude", category: "other", title: "الشكر عادة يومية", text: "اكتب كل يوم نعمة واحدة لاحظتها، ثم اسأل نفسك كيف يمكن تحويل الشكر إلى عمل. بهذه الطريقة يصبح الامتنان سلوكاً عملياً لا مجرد عبارة متكررة، مع الحفاظ على نسبة النصوص الدينية إلى مصادرها الأصلية.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-anger", category: "other", title: "قبل أن ترد وأنت غاضب", text: "خذ مسافة قصيرة قبل الرد، وأعد قراءة رسالتك كأن شخصاً آخر كتبها. إن كان الموقف يحتاج اعتذاراً فاعتذر، وإن كان يحتاج وقتاً فاطلبه، ولا تستخدم نصاً دينياً لإثبات رأي شخصي بلا مصدر.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-neighbor", category: "other", title: "الإيمان يظهر في المعاملة", text: "العبادة اليومية لا تنفصل عن طريقة التعامل مع الناس. في العمل والبيت والطريق، اجعل الصدق والعدل والرحمة معايير عملية، ولا تجعل التدين مجرد محتوى تشاهده ثم تنتهي علاقته بسلوكك.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-time", category: "other", title: "الوقت أمانة عملية", text: "قسم يومك إلى فترات واضحة للعبادة والعمل والراحة والأسرة. لا تحتاج إلى تطبيق عشرات العادات في يوم واحد؛ اختر عادة واحدة قابلة للاستمرار، ثم راقبها أسبوعاً قبل إضافة عادة جديدة.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-source-check", category: "other", title: "تحقق قبل أن تنشر", text: "إذا وصلتك عبارة تقول إنها حديث أو آية، لا تنشرها فوراً. ابحث عن النص في مصدر موثوق، راجع المرجع والدرجة إن كانت حديثاً، وإذا لم تجد نسبة صحيحة فقدمها ككلام عام أو اتركها دون نشر.", sourceLabel: "سياسة التوثيق التحريرية في ذِكر", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
  { id: "curated-message-balanced-learning", category: "other", title: "تعلم بتدرج", text: "اجمع بين القراءة والاستماع والتطبيق. اقرأ النص الأصلي عندما يكون متاحاً، ثم استخدم الشرح لفهم السياق، واكتب سؤالاً واضحاً عند وجود مسألة تحتاج إلى عالم أو مختص بدلاً من تحويل مقطع قصير إلى فتوى.", sourceLabel: "مادة تحريرية من ذِكر — ليست آية ولا حديثاً", sourceUrl: `${ZIKR}/about`, editorialNote: "رسالة عامة غير منسوبة إلى نص ديني." },
];

export const CURATED_VIDEO_SOURCES: CuratedVideoSource[] = [...CURATED_STORY_SOURCES, ...CURATED_KIDS_STORY_SOURCES, ...CURATED_ADHKAR_SOURCES, ...CURATED_GENERAL_MESSAGES];

export function listCuratedVideoSources(category: VideoSourceCategory | "other") {
  return CURATED_VIDEO_SOURCES.filter(item => item.category === category);
}

export function resolveCuratedVideoSource(id: string) {
  return CURATED_VIDEO_SOURCES.find(item => item.id === id) ?? null;
}
