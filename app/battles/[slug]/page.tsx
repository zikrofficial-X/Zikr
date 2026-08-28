export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { supabaseServerAnonRequest } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/site";
import {
  ContentReferences,
  getContentReferences,
} from "@/components/content/content-references";

type Battle = {
  id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  description_ar: string | null;
  date_hijri: string | null;
  date_gregorian: string | null;
  location_ar: string | null;
  published: boolean;
  metadata?: Record<string, string> | null;
};

type BattleEvent = {
  id: string;
  title_ar: string;
  content_ar: string;
  event_type: string;
  order_num: number;
};

const LEGACY_BATTLE_SLUG_REDIRECTS: Record<string, string> = {
  qaynuqa: "banu-qaynuqa",
  nadir: "banu-nadir",
  qurayza: "banu-qurayza",
  mutah: "mu-tah",
  salasel: "dhat-salasil",
};

const BATTLE_STORIES: Record<
  string,
  {
    name_ar: string;
    name_en: string;
    date_hijri: string;
    date_gregorian: string;
    location_ar: string;
    description_ar: string;
    youtube_video_id?: string;
    events: { title_ar: string; event_type: string; content_ar: string }[];
  }
> = {
  badr: {
    name_ar: "غزوة بدر الكبرى",
    name_en: "Battle of Badr",
    date_hijri: "17 رمضان 2هـ",
    date_gregorian: "13 مارس 624م",
    location_ar: "وادي بدر — على بعد 130كم من المدينة",
    description_ar:
      "أول معركة فاصلة في تاريخ الإسلام. انتصر فيها 313 مسلماً على 950 من قريش بإذن الله.",
    events: [
      {
        title_ar: "الخروج وسبب الغزوة",
        event_type: "context",
        content_ar:
          "خرج المسلمون بقيادة النبي ﷺ يريدون عِير قريش التجارية القادمة من الشام بقيادة أبي سفيان. أُحيط أبو سفيان بالخبر فغيّر طريقه وأرسل إلى قريش يستغيث. جاء أبو جهل بجيش قوامه 950 مقاتلاً يريد المواجهة وإظهار القوة، قائلاً: لا نرجع حتى نَرِد بدراً فنُقيم ثلاثاً.",
      },
      {
        title_ar: "مشاورة النبي ﷺ لأصحابه",
        event_type: "story",
        content_ar:
          "لما علم النبي بخبر الجيش استشار أصحابه، فقال المهاجرون: امض يا رسول الله. ثم قال للأنصار وكانوا الأكثر عدداً: أشيروا عليّ. فقال سعد بن معاذ: يا رسول الله، قد آمنا بك وصدّقناك وأعطيناك عهودنا، فامض لما أمرت به، والذي بعثك بالحق لو استعرضت بنا هذا البحر لخضناه معك. فسُرَّ النبي ﷺ بكلامه وقال: سيروا وأبشروا.",
      },
      {
        title_ar: "نزول المطر وتهيئة أرض المعركة",
        event_type: "miracle",
        content_ar:
          "أرسل الله مطراً رحمة للمسلمين ثبّت رمال الوادي تحت أقدامهم، وأرسل وحلاً على أرض المشركين أعسر حركتهم. وأنزل الله ملائكته نصرة للمؤمنين. قال تعالى: ﴿إِذْ يُوحِي رَبُّكَ إِلَى الْمَلَائِكَةِ أَنِّي مَعَكُمْ فَثَبِّتُوا الَّذِينَ آمَنُوا﴾.",
      },
      {
        title_ar: "المعركة والنصر الإلهي",
        event_type: "story",
        content_ar:
          "بدأت المعركة بالمبارزة. برز من قريش عتبة وشيبة والوليد، فبارزهم حمزة وعلي وعبيدة. ثم اشتبك الجمعان. قبضت يد النبي على حصى ورمى وجوه المشركين قائلاً: شاهت الوجوه. فانهزمت قريش وأُسر سبعون وقُتل سبعون من صناديدهم، في مقدمتهم أبو جهل فرعون هذه الأمة.",
      },
      {
        title_ar: "الغنائم والأسرى",
        event_type: "lesson",
        content_ar:
          "نزل الوحي في شأن الأسرى: ﴿مَا كَانَ لِنَبِيٍّ أَن يَكُونَ لَهُ أَسْرَىٰ حَتَّىٰ يُثْخِنَ فِي الْأَرْضِ﴾. وأُطلق سراح الأسرى الذين لا يملكون فدية بشرط أن يعلّم كل واحد منهم عشرة من أبناء المسلمين القراءة والكتابة — أول مشروع تعليمي في الإسلام.",
      },
      {
        title_ar: "الدروس والعبر",
        event_type: "lesson",
        content_ar:
          "1. النصر من عند الله لا بكثرة العدد — 313 هزموا 950 بإذن الله.\n2. الشورى ركن الحكم الراشد — النبي استشار أصحابه قبل المعركة.\n3. الاستغفار والدعاء سلاح المؤمن — النبي دعا ليلة المعركة وطال سجوده.\n4. أعداء الإسلام يُبدَؤون بالدعوة — بعث النبي رسولاً لقريش قبل المعركة.\n5. أسرى بدر علّموا المسلمين — أول مدرسة في الإسلام كانت من أسرى الحرب.",
      },
    ],
  },
  uhud: {
    name_ar: "غزوة أُحد",
    name_en: "Battle of Uhud",
    date_hijri: "7 شوال 3هـ",
    date_gregorian: "23 مارس 625م",
    location_ar: "جبل أُحد — شمال المدينة المنورة",
    description_ar:
      "الغزوة التي كانت فيها الهزيمة الجزئية درساً عظيماً في طاعة القائد وعدم حب الدنيا.",
    events: [
      {
        title_ar: "خروج قريش للأخذ بالثأر",
        event_type: "context",
        content_ar:
          "بعد هزيمة بدر، جمع أبو سفيان ثلاثة آلاف مقاتل من قريش وحلفائها للثأر. خرجوا نحو المدينة. بلغ النبي الخبر فاستشار أصحابه: أنمكث في المدينة أم نخرج؟ رأى الشباب الخروج فخرج النبي في ألف مقاتل.",
      },
      {
        title_ar: "تمرد المنافقين وانسحابهم",
        event_type: "story",
        content_ar:
          "في الطريق انسحب عبدالله بن أُبيّ بثلاثمائة من المنافقين قائلاً: لم يسمع مشورتنا. وصل المسلمون إلى أُحد في سبعمائة مقاتل. نصب النبي الرماة على الجبل خمسين رجلاً وأمرهم: لا تتركوا مكانكم وإن رأيتمونا انتصرنا أو هُزمنا.",
      },
      {
        title_ar: "الانتصار ثم الهزيمة الجزئية",
        event_type: "story",
        content_ar:
          "في بداية المعركة انتصر المسلمون وفرّ المشركون. لما رأى الرماة الغنائم، ترك أربعون منهم مواقعهم مخالفين أمر النبي. استغل خالد بن الوليد — وكان يقاتل مع قريش — الفجوة ودار حول الجبل فأتى المسلمين من خلفهم. وقع المسلمون بين فريقين وأُصيب النبي ﷺ في وجهه وكُسرت رباعيّته وشُجّ رأسه.",
      },
      {
        title_ar: "استشهاد حمزة وثبات النبي ﷺ",
        event_type: "story",
        content_ar:
          "استُشهد سيد الشهداء حمزة بن عبدالمطلب عم النبي على يد وحشي الحبشي. مثّلت هند بجثته فحزن النبي ﷺ حزناً شديداً. لما سمع المشركون أن النبي قُتل ابتهجوا، فثبت النبي وقاتل حتى انكشف عنه المشركون. رُدّ المسلمون إلى أُحد وأُوذن بنهاية المعركة.",
      },
      {
        title_ar: "الدروس والعبر",
        event_type: "lesson",
        content_ar:
          "1. طاعة القائد واجب — معصية الرماة أوّلت المعركة إلى هزيمة جزئية.\n2. حب الدنيا سبب الهزيمة — الرماة رأوا الغنائم فتركوا مواقعهم.\n3. الابتلاء يميّز الصادق — قال الله: ﴿وَلِيَعْلَمَ اللَّهُ الَّذِينَ آمَنُوا وَيَتَّخِذَ مِنكُمْ شُهَدَاءَ﴾.\n4. الهزيمة درس لا نهاية — المسلمون انتصروا في المعارك التالية بعد أُحد.\n5. الحزن على الشهداء إنسانية — النبي بكى على حمزة وهو من هو.",
      },
    ],
  },
  khandaq: {
    name_ar: "غزوة الأحزاب (الخندق)",
    name_en: "Battle of the Trench",
    date_hijri: "شوال 5هـ",
    date_gregorian: "مارس 627م",
    location_ar: "المدينة المنورة — الجبهة الشمالية",
    description_ar:
      "الغزوة التي حاصرت فيها عشرة آلاف مقاتل من الأحزاب المدينة ولم تستطع اختراقها.",
    events: [
      {
        title_ar: "التحالف الكبير ضد المسلمين",
        event_type: "context",
        content_ar:
          "تحالف يهود بني النضير المُجلَوْن مع قريش وغطفان وآخرين لمحو المدينة. جاؤوا بعشرة آلاف مقاتل لم يجتمع مثلهم من قبل في الجزيرة العربية. بلغ المسلمين الخبر وعددهم ثلاثة آلاف مقاتل فقط.",
      },
      {
        title_ar: "فكرة الخندق — إبداع سلمان الفارسي",
        event_type: "story",
        content_ar:
          "اقترح سلمان الفارسي رضي الله عنه حفر خندق عميق حول الجهة المكشوفة من المدينة — فكرة لم يعرفها العرب من قبل. استحسن النبي الفكرة وباشر الحفر مع أصحابه. حفر النبي بيده وأنشد مع أصحابه: اللهم لا عيش إلا عيش الآخرة فاغفر للأنصار والمهاجرة. استغرق الحفر ست أيام في برد وجوع شديدين.",
      },
      {
        title_ar: "الحصار وثبات المسلمين",
        event_type: "story",
        content_ar:
          "وصل الأحزاب ووقفوا أمام الخندق حائرين لم يروا مثله. حاولوا اختراقه دون جدوى. طال الحصار قرابة شهر وأصاب المسلمين الجوع والبرد والخوف الشديد. قال الله: ﴿إِذْ جَاءُوكُم مِّن فَوْقِكُمْ وَمِنْ أَسْفَلَ مِنكُمْ وَإِذْ زَاغَتِ الْأَبْصَارُ وَبَلَغَتِ الْقُلُوبُ الْحَنَاجِرَ﴾.",
      },
      {
        title_ar: "تفريق الأحزاب وانتصار الله",
        event_type: "miracle",
        content_ar:
          "دبّر النبي خطة لنقض تحالف الأحزاب من الداخل عبر نُعيم بن مسعود. وأرسل الله على الأحزاب ريحاً عاصفة ليلاً قلعت خيامهم وأوقدت نار الفتنة بينهم. قال الله: ﴿يَا أَيُّهَا الَّذِينَ آمَنُوا اذْكُرُوا نِعْمَةَ اللَّهِ عَلَيْكُمْ إِذْ جَاءَتْكُمْ جُنُودٌ فَأَرْسَلْنَا عَلَيْهِمْ رِيحًا وَجُنُودًا لَّمْ تَرَوْهَا﴾.",
      },
      {
        title_ar: "الدروس والعبر",
        event_type: "lesson",
        content_ar:
          "1. الإبداع في التكتيك العسكري مشروع — أخذ المسلمون بأسباب الدفاع الحضاري.\n2. الصبر مع الشدة يقود للنصر — صبر المسلمون شهراً كاملاً في حصار قاسٍ.\n3. نصر الله لا يستلزم القتال — أرسل الله الريح والجنود غير المرئية.\n4. التأليف بين الأعداء طريق للنصر — استخدام نُعيم قسّم صفوف الأحزاب.\n5. الشدائد كاشفة عن المنافقين — ظهرت النفاق جلياً أمام أهوال الخندق.",
      },
    ],
  },
  fathmakka: {
    name_ar: "فتح مكة المكرمة",
    name_en: "Conquest of Mecca",
    date_hijri: "20 رمضان 8هـ",
    date_gregorian: "11 يناير 630م",
    location_ar: "مكة المكرمة",
    description_ar:
      "أعظم الفتوحات الإسلامية. دخل النبي ﷺ مكة بعشرة آلاف صحابي وعفا عن من آذوه.",
    events: [
      {
        title_ar: "سبب الفتح ونقض العهد",
        event_type: "context",
        content_ar:
          "في صلح الحديبية تعاهدت قريش والمسلمون عشر سنوات. نقضت قريش العهد حين أعانت حلفاءها بني بكر على قتل خزاعة حلفاء المسلمين. جاء وفد خزاعة إلى المدينة يستنجد بالنبي ﷺ. أمر النبي بالتجهيز وأخفى وجهته.",
      },
      {
        title_ar: "الخروج بعشرة آلاف",
        event_type: "story",
        content_ar:
          "خرج النبي في عشرة آلاف مقاتل في رمضان — أكبر جيش إسلامي حتى ذلك الوقت. نزل قريباً من مكة وأوقد الصحابة النيران. لما رأى أبو سفيان الجيش خرج حتى أسلم. قال له النبي: اذهب فمن دخل داره فهو آمن، ومن أغلق عليه بابه فهو آمن.",
      },
      {
        title_ar: "الدخول من أربعة طرق",
        event_type: "story",
        content_ar:
          "أمر النبي بدخول مكة من أربعة محاور بلا قتال إلا من قاوم. دخل النبي ﷺ وهو خاشع لله يتلو: ﴿إِنَّا فَتَحْنَا لَكَ فَتْحًا مُّبِينًا﴾. طاف بالبيت على راحلته وحطّم الأصنام بعصاه وهو يقول: جاء الحق وزهق الباطل، إن الباطل كان زهوقاً.",
      },
      {
        title_ar: "العفو التاريخي الخالد",
        event_type: "story",
        content_ar:
          "جمع النبي ﷺ أهل مكة في الكعبة. كانوا يعرفون أذاهم له ويتوقعون أشد العقوبة. قال ﷺ: ما تظنون أني فاعل بكم؟ قالوا: أخ كريم وابن أخ كريم. فقال: اذهبوا فأنتم الطلقاء. أعتقهم جميعاً وهم من كانوا يعذّبون المسلمين ويقتلونهم عشرين سنة. فأسلمت قريش بأجمعها.",
      },
      {
        title_ar: "الدروس والعبر",
        event_type: "lesson",
        content_ar:
          "1. العفو عند المقدرة أبلغ من الانتقام — فتح مكة حتى على مستوى السيرة السياسية.\n2. لا تعجّل بالفتح — صبر النبي 20 سنة كان شرطاً لهذا النصر.\n3. القوة وسيلة لا غاية — دخل بعشرة آلاف ليحقن الدماء لا ليسفكها.\n4. الأخلاق حجة الدين — قريش أسلمت بعد رؤية عدل الإسلام.\n5. نهاية المظلوم النصر لا الهزيمة — من مكة مضطهداً إلى مكة فاتحاً.",
      },
    ],
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = BATTLE_STORIES[slug];
  return pageMetadata({
    title: story?.name_ar ?? "غزوة",
    description:
      story?.description_ar?.slice(0, 160) ??
      "تفاصيل الغزوة كاملة مع الأحداث والدروس.",
    path: `/battles/${slug}`,
  });
}

export default async function BattleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonicalSlug = LEGACY_BATTLE_SLUG_REDIRECTS[slug];
  if (canonicalSlug) redirect(`/battles/${canonicalSlug}`);

  let battle: Battle | null = null;
  let events: BattleEvent[] = [];
  let youtubeVideoId: string | null = null;

  try {
    const data = await supabaseServerAnonRequest<Battle[]>(
      `/rest/v1/battles?select=*&slug=eq.${slug}&published=eq.true`
    );
    battle = data && data.length > 0 ? data[0] : null;

    if (battle) {
      youtubeVideoId = battle.metadata?.youtube_video_id ?? null;
      const eventsData = await supabaseServerAnonRequest<BattleEvent[]>(
        `/rest/v1/battle_events?select=*&battle_id=eq.${battle.id}&order=order_num.asc`
      );
      events = eventsData ?? [];
    }
  } catch {
    battle = null;
  }

  const staticStory = BATTLE_STORIES[slug];
  if (!battle && !staticStory) notFound();

  const displayName = battle?.name_ar ?? staticStory?.name_ar ?? "غزوة إسلامية";
  const displayDateHijri =
    battle?.date_hijri ?? staticStory?.date_hijri ?? null;
  const displayDateGregorian =
    battle?.date_gregorian ?? staticStory?.date_gregorian ?? null;
  const displayLocation =
    battle?.location_ar ?? staticStory?.location_ar ?? null;
  const displayDescription =
    battle?.description_ar ?? staticStory?.description_ar ?? null;
  const displayEvents =
    events.length > 0 ? events : (staticStory?.events ?? []);
  const displayVideoId =
    youtubeVideoId ?? staticStory?.youtube_video_id ?? null;
  const references = getContentReferences(battle?.metadata);

  const eventTypeLabel: Record<string, string> = {
    context: "السياق",
    story: "الأحداث",
    miracle: "النصر الإلهي",
    lesson: "الدروس والعبر",
  };
  const eventTypeColor: Record<string, string> = {
    context: "border-sky-900/40 bg-sky-950/20",
    story: "border-brand-gold/10 bg-black/20",
    miracle: "border-emerald-800/40 bg-emerald-950/20",
    lesson: "border-brand-gold/30 bg-brand-gold/5",
  };

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#1a0505] via-[#0A2A1E] to-[#071A13] py-16">
        <Container className="max-w-4xl space-y-6">
          <Link
            href="/battles"
            className="inline-flex items-center gap-2 text-sm text-brand-gold/60 hover:text-brand-gold transition-colors"
          >
            <span>←</span>
            <span>العودة إلى الغزوات</span>
          </Link>

          <h1 className="text-5xl md:text-6xl font-bold text-brand-gold font-arabic leading-tight">
            {displayName}
          </h1>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-4 text-sm">
            {displayDateHijri && (
              <div className="rounded-full border border-brand-gold/20 bg-brand-gold/5 px-4 py-1.5 text-brand-cream/70">
                {displayDateHijri}
              </div>
            )}
            {displayDateGregorian && (
              <div
                className="rounded-full border border-brand-gold/10 px-4 py-1.5 text-brand-cream/50"
                dir="ltr"
              >
                {displayDateGregorian}
              </div>
            )}
            {displayLocation && (
              <div className="rounded-full border border-brand-gold/10 px-4 py-1.5 text-brand-cream/50">
                {displayLocation}
              </div>
            )}
          </div>

          {displayDescription && (
            <p className="text-lg leading-8 text-brand-cream/80 max-w-3xl">
              {displayDescription}
            </p>
          )}
        </Container>
      </section>

      <Container className="max-w-4xl py-10 space-y-8">
        {/* YouTube Video */}
        {displayVideoId && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-brand-gold">
              مشاهدة الفيديو
            </h2>
            <div
              className="relative w-full rounded-2xl overflow-hidden border border-brand-gold/20"
              style={{ paddingBottom: "56.25%" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${displayVideoId}?rel=0&modestbranding=1`}
                title={displayName}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Events / Sections */}
        {displayEvents.length > 0 && (
          <section className="space-y-5">
            <h2 className="text-2xl font-bold text-brand-gold">
              تفاصيل الغزوة
            </h2>
            {displayEvents.map((event, i) => {
              const typeLabel = event.event_type
                ? eventTypeLabel[event.event_type]
                : null;
              const colorClass = event.event_type
                ? (eventTypeColor[event.event_type] ??
                  "border-brand-gold/10 bg-black/20")
                : "border-brand-gold/10 bg-black/20";
              return (
                <Card
                  key={(event as { id?: string }).id ?? i}
                  className={`p-8 space-y-4 ${colorClass}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center text-xs text-brand-gold font-bold">
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-brand-gold">
                        {event.title_ar}
                      </h3>
                      {typeLabel && (
                        <span className="text-xs border border-brand-gold/20 rounded-full px-2 py-0.5 text-brand-gold/50">
                          {typeLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-base leading-9 text-brand-cream/85 whitespace-pre-wrap pr-11">
                    {event.content_ar}
                  </p>
                </Card>
              );
            })}
          </section>
        )}

        <ContentReferences references={references} />

        {/* Quran verse */}
        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-4">
          <p
            className="text-xl font-arabic leading-loose text-brand-cream"
            dir="rtl"
          >
            ﴿ وَكَانَ حَقًّا عَلَيْنَا نَصْرُ الْمُؤْمِنِينَ ﴾
          </p>
          <p className="text-brand-gold/60 text-sm">سورة الروم — الآية 47</p>
          <Link
            href="/battles"
            className="inline-flex items-center gap-2 text-brand-gold hover:text-brand-gold/80 transition-colors text-sm font-medium"
          >
            <span>← عودة إلى جميع الغزوات</span>
          </Link>
        </section>
      </Container>
    </main>
  );
}
