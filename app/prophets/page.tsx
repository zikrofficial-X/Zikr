export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/server';
import { pageMetadata } from '@/lib/site';
import { mergePublishedBySlug } from '@/lib/data/content-merge';

export const metadata: Metadata = pageMetadata({
  title: 'قصص الأنبياء والرسل',
  description: 'قصص الأنبياء والرسل عليهم السلام كاملة — من آدم إلى محمد ﷺ — مع تفاصيل حياتهم ومعجزاتهم وإمكانية مشاهدة الفيديوهات.',
  path: '/prophets',
});

interface ProphetRow {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  bio_ar?: string | null;
  order_num?: number | null;
}

interface Prophet {
  id: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  bio_ar: string | null;
  order_num: number | null;
  quran_mentions?: number;
  story_chars?: number;
  story_sections?: number;
}

// Merge the full local index with Supabase so a transient database failure
// never hides the 25-prophet catalogue from the public page.
const PROPHET_SLUG_ALIASES: Record<string, string> = {
  dhulkifl: 'dhul-kifl',
  zakariyya: 'zakariya',
};

function canonicalProphetSlug(slug: string) {
  return PROPHET_SLUG_ALIASES[slug] ?? slug;
}

const staticProphets: Prophet[] = [
  { id: '1',  order_num: 1,  name_ar: 'آدم عليه السلام',          name_en: 'Adam',       slug: 'adam',      quran_mentions: 25,  bio_ar: 'أبو البشر وأول الأنبياء، خلقه الله بيده ونفخ فيه الروح وعلّمه الأسماء كلها. أُهبط إلى الأرض بعد أن أكل من الشجرة ثم تاب الله عليه.' },
  { id: '2',  order_num: 2,  name_ar: 'إدريس عليه السلام',        name_en: 'Enoch',      slug: 'idris',     quran_mentions: 2,   bio_ar: 'أول من كتب بالقلم وخاط الثياب. رفعه الله مكاناً علياً. كان صابراً صادقاً ومن الصالحين.' },
  { id: '3',  order_num: 3,  name_ar: 'نوح عليه السلام',          name_en: 'Noah',       slug: 'nuh',       quran_mentions: 43,  bio_ar: 'دعا قومه 950 سنة إلا خمسين عاماً، وبنى السفينة بأمر الله لإنجاء المؤمنين من الطوفان. يُلقَّب بشيخ الأنبياء.' },
  { id: '4',  order_num: 4,  name_ar: 'هود عليه السلام',          name_en: 'Hud',        slug: 'hud',       quran_mentions: 7,   bio_ar: 'أُرسل إلى قوم عاد أصحاب الأعمدة، فكذّبوه فأهلكهم الله بريح صرصر عاتية.' },
  { id: '5',  order_num: 5,  name_ar: 'صالح عليه السلام',         name_en: 'Salih',      slug: 'salih',     quran_mentions: 9,   bio_ar: 'أُرسل إلى قوم ثمود. أخرج الله له ناقة من الصخرة معجزة، فعقرها قومه فأخذتهم الصيحة.' },
  { id: '6',  order_num: 6,  name_ar: 'إبراهيم عليه السلام',      name_en: 'Ibrahim',    slug: 'ibrahim',   quran_mentions: 69,  bio_ar: 'خليل الله ومحطّم الأصنام، بنى الكعبة مع ابنه إسماعيل وسمّي أبا الأنبياء. ألقاه قومه في النار فجعلها الله برداً وسلاماً.' },
  { id: '7',  order_num: 7,  name_ar: 'لوط عليه السلام',          name_en: 'Lot',        slug: 'lut',       quran_mentions: 27,  bio_ar: 'ابن أخي إبراهيم عليه السلام، أُرسل إلى قوم سدوم. كذّبوه وارتكبوا الفاحشة فأهلكهم الله وأنجى لوطاً ومن آمن معه.' },
  { id: '8',  order_num: 8,  name_ar: 'إسماعيل عليه السلام',      name_en: 'Ismail',     slug: 'ismail',    quran_mentions: 12,  bio_ar: 'ابن إبراهيم من هاجر، بنى معه الكعبة المشرفة. صاحب قصة الفداء العظيم حين أراد إبراهيم ذبحه ففداه الله بكبش.' },
  { id: '9',  order_num: 9,  name_ar: 'إسحاق عليه السلام',        name_en: 'Isaac',      slug: 'ishaq',     quran_mentions: 17,  bio_ar: 'ابن إبراهيم من سارة، بشّرته الملائكة. وُلد بعد أن كبر والداه. جد أنبياء بني إسرائيل.' },
  { id: '10', order_num: 10, name_ar: 'يعقوب عليه السلام',        name_en: 'Jacob',      slug: 'yaqub',     quran_mentions: 16,  bio_ar: 'ابن إسحاق، لُقِّب بإسرائيل. أبو الأسباط الاثني عشر. حزن على ابنه يوسف حتى ابيضّت عيناه من الحزن.' },
  { id: '11', order_num: 11, name_ar: 'يوسف عليه السلام',         name_en: 'Joseph',     slug: 'yusuf',     quran_mentions: 27,  bio_ar: 'نبي الله الذي كانت قصته أحسن القصص. صبر على كيد إخوته وعزيز مصر والسجن حتى مكّنه الله في الأرض.' },
  { id: '12', order_num: 12, name_ar: 'شعيب عليه السلام',         name_en: "Shu'ayb",    slug: 'shuayb',    quran_mentions: 11,  bio_ar: 'أُرسل إلى أهل مدين وأصحاب الأيكة الذين كانوا يطففون الكيل والميزان. لُقِّب بخطيب الأنبياء.' },
  { id: '13', order_num: 13, name_ar: 'أيوب عليه السلام',         name_en: 'Job',        slug: 'ayyub',     quran_mentions: 4,   bio_ar: 'ضرب القرآن به المثل في الصبر على البلاء. ابتُلي بالمرض الشديد سنوات طويلة فصبر حتى دعا ربه فشفاه الله.' },
  { id: '14', order_num: 14, name_ar: 'ذو الكفل عليه السلام',     name_en: 'Dhul-Kifl',  slug: 'dhul-kifl', quran_mentions: 2,   bio_ar: 'نبي صبور تكفّل بقضاء الناس وأمورهم في سبيل الله. ذُكر مع إسماعيل وإدريس من الصابرين.' },
  { id: '15', order_num: 15, name_ar: 'موسى عليه السلام',         name_en: 'Moses',      slug: 'musa',      quran_mentions: 136, bio_ar: 'أكثر الأنبياء ذكراً في القرآن. كلّمه الله تكليماً مباشراً. أنقذ بني إسرائيل من فرعون وفلق البحر بعصاه بإذن الله.' },
  { id: '16', order_num: 16, name_ar: 'هارون عليه السلام',        name_en: 'Aaron',      slug: 'harun',     quran_mentions: 20,  bio_ar: 'أخو موسى ووزيره، أرسلهما الله معاً إلى فرعون. كان فصيح اللسان ومعين لموسى في تبليغ رسالته.' },
  { id: '17', order_num: 17, name_ar: 'يونس عليه السلام',         name_en: 'Jonah',      slug: 'yunus',     quran_mentions: 4,   bio_ar: 'صاحب الحوت وذو النون. خرج من قومه مغاضباً فابتلعه الحوت، فدعا في الظلمات فأنجاه الله.' },
  { id: '18', order_num: 18, name_ar: 'إلياس عليه السلام',        name_en: 'Elias',      slug: 'ilyas',     quran_mentions: 2,   bio_ar: 'أُرسل إلى قوم في بعلبك كانوا يعبدون صنماً يُسمّى بعل. نهاهم عن عبادة الأصنام.' },
  { id: '19', order_num: 19, name_ar: 'اليسع عليه السلام',        name_en: 'Elisha',     slug: 'alyasa',    quran_mentions: 2,   bio_ar: 'خليفة إلياس على بني إسرائيل. مدحه الله في القرآن في سورتي الأنعام وص. كان من الصابرين.' },
  { id: '20', order_num: 20, name_ar: 'داود عليه السلام',         name_en: 'David',      slug: 'dawud',     quran_mentions: 16,  bio_ar: 'نبي وملك آتاه الله الزبور وصوتاً جميلاً تسبح معه الجبال والطير. قتل جالوت وحكم بني إسرائيل بالعدل.' },
  { id: '21', order_num: 21, name_ar: 'سليمان عليه السلام',       name_en: 'Solomon',    slug: 'sulayman',  quran_mentions: 17,  bio_ar: 'ابن داود، آتاه الله ملكاً عظيماً وسخّر له الريح والجن والطير. فهم لغة الحيوانات وبنى بيت المقدس.' },
  { id: '22', order_num: 22, name_ar: 'زكريا عليه السلام',        name_en: 'Zechariah',  slug: 'zakariyya', quran_mentions: 7,   bio_ar: 'دعا ربه في المحراب وهو شيخ كبير وزوجته عاقر أن يهبه ولداً يرثه، فاستجاب الله له ورُزق بيحيى.' },
  { id: '23', order_num: 23, name_ar: 'يحيى عليه السلام',         name_en: 'John',       slug: 'yahya',     quran_mentions: 5,   bio_ar: 'ابن زكريا، سمّاه الله اسماً لم يُسمَّ به أحد من قبل. كان تقياً براً بوالديه.' },
  { id: '24', order_num: 24, name_ar: 'عيسى عليه السلام',         name_en: 'Jesus',      slug: 'isa',       quran_mentions: 25,  bio_ar: 'روح الله وكلمته، وُلد من غير أب من السيدة مريم. أحيا الموتى وأبرأ الأكمه والأبرص بإذن الله. رفعه الله إليه.' },
  { id: '25', order_num: 25, name_ar: 'محمد صلى الله عليه وسلم', name_en: 'Muhammad',   slug: 'muhammad',  quran_mentions: 4,   bio_ar: 'خاتم الأنبياء والمرسلين وأفضل خلق الله. بعثه الله رحمة للعالمين. أُسري به إلى السماوات وكُلِّف بالصلوات الخمس.' },
];

export default async function ProphetsPage() {
  let prophets: Prophet[] = [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('prophets')
      .select('id, name_ar, name_en, slug, bio_ar, order_num')
      .eq('published', true)
      .order('order_num', { ascending: true });
    if (data && data.length > 0) {
      prophets = (data as ProphetRow[]).map((r) => ({
        ...r,
        bio_ar: r.bio_ar ?? null,
        order_num: r.order_num ?? null,
        quran_mentions: undefined,
        story_chars: 0,
        story_sections: 0,
      }));

      const { data: sectionRows } = await supabase
        .from('prophet_sections')
        .select('prophet_id, content_ar')
        .in('prophet_id', prophets.map((prophet) => prophet.id));
      const stats = new Map<string, { chars: number; sections: number }>();
      for (const row of sectionRows ?? []) {
        const current = stats.get(row.prophet_id) ?? { chars: 0, sections: 0 };
        current.chars += (row.content_ar ?? '').length;
        current.sections += 1;
        stats.set(row.prophet_id, current);
      }
      prophets = prophets.map((prophet) => ({
        ...prophet,
        story_chars: stats.get(prophet.id)?.chars ?? 0,
        story_sections: stats.get(prophet.id)?.sections ?? 0,
      }));
    }
  } catch {
    // fall through to static
  }

  const databaseProphetKeys = new Set(prophets.map(prophet => canonicalProphetSlug(prophet.slug)));
  const fallbackProphets = staticProphets.filter(
    prophet => !databaseProphetKeys.has(canonicalProphetSlug(prophet.slug)),
  );
  const displayProphets = mergePublishedBySlug(prophets, fallbackProphets);

  // Prophet era colors for visual variety
  const eraColors = [
    'from-amber-900/40 to-yellow-900/40 border-amber-700/30',
    'from-emerald-900/40 to-teal-900/40 border-emerald-700/30',
    'from-sky-900/40 to-blue-900/40 border-sky-700/30',
    'from-rose-900/40 to-pink-900/40 border-rose-700/30',
    'from-violet-900/40 to-purple-900/40 border-violet-700/30',
  ];

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A2A1E] to-[#071A13] py-20 text-center">
        <div className="absolute inset-0 pointer-events-none select-none opacity-10">
          <div className="absolute top-8 left-1/4 w-px h-32 bg-brand-gold rotate-12" />
          <div className="absolute bottom-8 right-1/3 w-px h-24 bg-brand-gold -rotate-12" />
        </div>
        <Container className="relative space-y-6">
          <p className="text-brand-gold/60 text-sm tracking-widest font-arabic">﴿ وَكُلًّا نَّقُصُّ عَلَيْكَ مِنْ أَنبَاءِ الرُّسُلِ ﴾</p>
          <h1 className="text-5xl md:text-6xl font-bold text-brand-gold font-arabic leading-tight">
            قصص الأنبياء والرسل
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-8 text-brand-cream/70">
            خمسة وعشرون نبياً ورسولاً ذُكروا في القرآن الكريم — قصصهم كاملة مع التفاصيل والمعجزات والمواقف العظيمة
          </p>
          <div className="flex items-center justify-center gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-brand-gold">25</p>
              <p className="text-xs text-brand-cream/50">نبياً ورسولاً</p>
            </div>
            <div className="w-px h-10 bg-brand-gold/20" />
            <div>
              <p className="text-3xl font-bold text-brand-gold">6236</p>
              <p className="text-xs text-brand-cream/50">آية قرآنية</p>
            </div>
            <div className="w-px h-10 bg-brand-gold/20" />
            <div>
              <p className="text-3xl font-bold text-brand-gold">950+</p>
              <p className="text-xs text-brand-cream/50">سنة دعوة نوح ﷺ</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 space-y-8">
        {/* Prophet Cards Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayProphets.map((prophet, i) => {
            const colorClass = eraColors[i % eraColors.length];
            const initials = prophet.name_ar.slice(0, 2);
            return (
              <Link
                key={prophet.id}
                href={`/prophets/${canonicalProphetSlug(prophet.slug)}`}
                className="group block"
              >
                <div className={`h-full rounded-xl border bg-gradient-to-br ${colorClass} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-gold/10 hover:border-brand-gold/40`}>
                  <div className="flex items-start gap-4 mb-3">
                    {/* Order number + avatar */}
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-full bg-brand-gold/10 border-2 border-brand-gold/30 flex items-center justify-center group-hover:border-brand-gold/60 transition-colors">
                        <span className="text-brand-gold font-bold text-lg font-arabic">{initials}</span>
                      </div>
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0A2A1E] border border-brand-gold/40 flex items-center justify-center text-[9px] text-brand-gold/70 font-bold">
                        {prophet.order_num ?? i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-brand-gold leading-snug">{prophet.name_ar}</h2>
                      {prophet.name_en && (
                        <p className="text-xs text-brand-cream/40 mt-0.5" dir="ltr">{prophet.name_en}</p>
                      )}
                      {prophet.quran_mentions != null && prophet.quran_mentions > 0 && (
                        <Badge variant="outline" className="mt-1.5 text-[10px] border-brand-gold/30 text-brand-gold/70">
                          ذُكر {prophet.quran_mentions} مرة في القرآن
                        </Badge>
                      )}
                    </div>
                  </div>
                  {prophet.bio_ar && (
                    <p className="text-sm leading-relaxed text-brand-cream/70 line-clamp-2 mt-2">
                      {prophet.bio_ar}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-brand-cream/55">
                    <span className="rounded-full border border-brand-gold/20 px-2 py-1 text-brand-gold/75">
                      القصة القرآنية كاملة
                    </span>
                    {(prophet.story_sections ?? 0) > 0 && (
                      <span>{prophet.story_sections} أقسام · {(prophet.story_chars ?? 0).toLocaleString('ar-EG')} حرف</span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs text-brand-gold/50 group-hover:text-brand-gold/80 transition-colors">
                    <span>اقرأ القصة كاملة</span>
                    <span>←</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Closing Quran verse */}
        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-4 mt-8">
          <p className="text-2xl font-arabic leading-loose text-brand-cream" dir="rtl">
            ﴿ تِلْكَ الرُّسُلُ فَضَّلْنَا بَعْضَهُمْ عَلَىٰ بَعْضٍ مِّنْهُم مَّن كَلَّمَ اللَّهُ وَرَفَعَ بَعْضَهُمْ دَرَجَاتٍ ﴾
          </p>
          <p className="text-brand-gold/60 text-sm">سورة البقرة — الآية 253</p>
        </section>
      </Container>
    </main>
  );
}
