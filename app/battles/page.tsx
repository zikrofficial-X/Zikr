export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { pageMetadata } from '@/lib/site';
import { supabaseServerAnonRequest } from '@/lib/supabase/server';
import { mergePublishedBySlug } from '@/lib/data/content-merge';

export const metadata = pageMetadata({
  title: 'غزوات النبي ﷺ',
  description: 'جميع غزوات النبي محمد ﷺ كاملة مع التفاصيل والتواريخ والمواقع — من بدر الكبرى إلى فتح مكة المكرمة.',
  path: '/battles',
});

type Battle = {
  id: string;
  name_ar: string;
  name_en?: string;
  slug: string;
  date_hijri: string | null;
  date_gregorian: string | null;
  location_ar: string | null;
  description_ar: string | null;
  thumbnail_url: string | null;
  order_num: number | null;
};

const BATTLE_SLUG_ALIASES: Record<string, string> = {
  nadir: 'banu-nadir',
  qaynuqa: 'banu-qaynuqa',
  qurayza: 'banu-qurayza',
  mutah: 'mu-tah',
  salasel: 'dhat-salasil',
};

function canonicalBattleSlug(slug: string) {
  return BATTLE_SLUG_ALIASES[slug] ?? slug;
}

const staticBattles: Battle[] = [
  { id: '1', order_num: 1,  name_ar: 'غزوة بدر الكبرى',      name_en: 'Battle of Badr',      slug: 'badr',      date_hijri: '17 رمضان 2هـ',   date_gregorian: '13 مارس 624م', location_ar: 'وادي بدر — شمال غرب المدينة',     description_ar: 'أول معركة فاصلة في الإسلام، انتصر فيها 313 مسلماً على قريش وعددهم 950 مقاتلاً. قال الله: ﴿وَلَقَدْ نَصَرَكُمُ اللَّهُ بِبَدْرٍ وَأَنتُمْ أَذِلَّةٌ﴾.', thumbnail_url: null },
  { id: '2', order_num: 2,  name_ar: 'غزوة أُحد',            name_en: 'Battle of Uhud',       slug: 'uhud',      date_hijri: '7 شوال 3هـ',     date_gregorian: '23 مارس 625م', location_ar: 'جبل أُحد — شمال المدينة',          description_ar: 'الغزوة التي كانت فيها الهزيمة الجزئية درساً عظيماً للمسلمين بسبب مخالفة الرماة أمر النبي ﷺ. استُشهد فيها سيد الشهداء حمزة بن عبدالمطلب.', thumbnail_url: null },
  { id: '3', order_num: 3,  name_ar: 'غزوة الأحزاب (الخندق)', name_en: 'Battle of the Trench', slug: 'khandaq',   date_hijri: 'شوال 5هـ',        date_gregorian: 'مارس 627م',    location_ar: 'المدينة المنورة — شمالها',          description_ar: 'حاصرت قريش والأحزاب المدينة بعشرة آلاف مقاتل. أشار سلمان الفارسي بحفر الخندق. انسحبت الأحزاب بعد صبر المسلمين وتدخل الله بعاصفة وجيش من الملائكة.', thumbnail_url: null },
  { id: '4', order_num: 4,  name_ar: 'غزوة خيبر',            name_en: 'Battle of Khaybar',    slug: 'khaybar',   date_hijri: 'محرم 7هـ',        date_gregorian: 'مايو 628م',    location_ar: 'خيبر — شمال المدينة 153كم',        description_ar: 'فتح حصون يهود خيبر بعد حصار شهراً. أعطى النبي الراية لعلي بن أبي طالب قائلاً: لأعطينّها رجلاً يحب الله ورسوله ويحبه الله ورسوله.', thumbnail_url: null },
  { id: '5', order_num: 5,  name_ar: 'فتح مكة المكرمة',      name_en: 'Conquest of Mecca',    slug: 'fathmakka', date_hijri: '20 رمضان 8هـ',   date_gregorian: '11 يناير 630م',location_ar: 'مكة المكرمة',                      description_ar: 'أعظم الفتوحات الإسلامية. دخل النبي مكة بعشرة آلاف مقاتل. طهّر الكعبة من الأصنام وقال لقريش: اذهبوا فأنتم الطلقاء. أسلمت قريش بأجمعها.', thumbnail_url: null },
  { id: '6', order_num: 6,  name_ar: 'غزوة حنين',            name_en: 'Battle of Hunayn',     slug: 'hunayn',    date_hijri: 'شوال 8هـ',        date_gregorian: 'يناير 630م',   location_ar: 'وادي حنين — شرق مكة',              description_ar: 'بعد فتح مكة تكتّلت هوازن وثقيف. كاد المسلمون أن يُهزموا في بادئ الأمر، لكن ثبت النبي ﷺ وقاتل حتى انتصر المسلمون. قال الله: ﴿وَيَوْمَ حُنَيْنٍ إِذْ أَعْجَبَتْكُمْ كَثْرَتُكُمْ﴾.', thumbnail_url: null },
  { id: '7', order_num: 7,  name_ar: 'غزوة تبوك',            name_en: 'Battle of Tabuk',      slug: 'tabuk',     date_hijri: 'رجب 9هـ',         date_gregorian: 'أكتوبر 630م', location_ar: 'تبوك — شمال الجزيرة العربية',      description_ar: 'أكبر غزوة من حيث العدد — 30 ألف مقاتل. سمّيت بـ"غزوة العسرة" لشدة الحرارة وقلة الزاد. ذهب المسلمون لمواجهة الروم لكن الله كفى المؤمنين القتال.', thumbnail_url: null },
  { id: '8', order_num: 8,  name_ar: 'غزوة بني قينقاع',      name_en: 'Battle of Qaynuqa',    slug: 'qaynuqa',   date_hijri: '15 شوال 2هـ',    date_gregorian: 'أغسطس 624م',  location_ar: 'المدينة المنورة',                   description_ar: 'أول مواجهة مع يهود المدينة بعد نقضهم العهد. حوصروا في حصنهم خمسة عشر يوماً حتى استسلموا وأُجلوا من المدينة.', thumbnail_url: null },
  { id: '9', order_num: 9,  name_ar: 'غزوة بني النضير',      name_en: 'Battle of Al-Nadir',   slug: 'nadir',     date_hijri: 'ربيع الأول 4هـ', date_gregorian: 'أغسطس 625م',  location_ar: 'المدينة المنورة — حصون بني النضير', description_ar: 'حوصر بنو النضير بعد نقضهم العهد ومحاولة اغتيال النبي. خرجوا بأموالهم وأُجلوا إلى خيبر. نزل فيها سورة الحشر.', thumbnail_url: null },
  { id: '10', order_num: 10, name_ar: 'غزوة بني قريظة',       name_en: 'Battle of Qurayza',    slug: 'qurayza',   date_hijri: 'ذو القعدة 5هـ',  date_gregorian: 'فبراير 627م',  location_ar: 'المدينة المنورة',                   description_ar: 'بعد غزوة الخندق مباشرة نزل جبريل على النبي وأمره بالتوجه لبني قريظة الذين خانوا في الأحزاب. حوصروا خمسة وعشرين يوماً حتى استسلموا.', thumbnail_url: null },
  { id: '11', order_num: 11, name_ar: 'غزوة مؤتة',            name_en: 'Battle of Mutah',      slug: 'mutah',     date_hijri: 'جمادى الأولى 8هـ', date_gregorian: 'سبتمبر 629م', location_ar: 'مؤتة — جنوب الأردن',               description_ar: 'أول مواجهة مع الروم. استُشهد القادة الثلاثة: زيد بن حارثة وجعفر بن أبي طالب وعبدالله بن رواحة. استلم الراية خالد بن الوليد وأدار المعركة ببراعة.', thumbnail_url: null },
  { id: '12', order_num: 12, name_ar: 'سرية ذات السلاسل',      name_en: 'Expedition of Dhat al-Salasil', slug: 'salasel', date_hijri: 'جمادى الآخرة 8هـ', date_gregorian: 'نوفمبر 629م', location_ar: 'منطقة ذات السلاسل — شمال الجزيرة', description_ar: 'أُرسل عمرو بن العاص بثلاثمائة مقاتل. لما ضعف استنجد فأُرسل أبو عبيدة بمدد. نجحت السرية في تأمين الحدود الشمالية.', thumbnail_url: null },
];

export default async function BattlesPage() {
  let battles: Battle[] = [];
  try {
    const data = await supabaseServerAnonRequest<Battle[]>(
      '/rest/v1/battles?select=id,name_ar,name_en,slug,date_hijri,date_gregorian,location_ar,description_ar,thumbnail_url,order_num&published=eq.true&order=order_num.asc'
    );
    battles = data || [];
  } catch {
    battles = [];
  }

  const databaseBattleKeys = new Set(battles.map(battle => canonicalBattleSlug(battle.slug)));
  const fallbackBattles = staticBattles.filter(
    battle => !databaseBattleKeys.has(canonicalBattleSlug(battle.slug)),
  );
  const displayBattles = mergePublishedBySlug(battles, fallbackBattles);

  return (
    <main className="min-h-screen" dir="rtl">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#1a0a0a] via-[#0A2A1E] to-[#071A13] py-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-5 select-none">
          <div className="absolute top-10 right-10 text-9xl font-arabic text-brand-gold">⚔</div>
          <div className="absolute bottom-10 left-10 text-7xl font-arabic text-brand-gold">⚔</div>
        </div>
        <Container className="relative space-y-6">
          <p className="text-brand-gold/60 text-sm tracking-widest font-arabic">
            ﴿ كَمْ مِّن فِئَةٍ قَلِيلَةٍ غَلَبَتْ فِئَةً كَثِيرَةً بِإِذْنِ اللَّهِ ﴾
          </p>
          <h1 className="text-5xl md:text-6xl font-bold text-brand-gold font-arabic leading-tight">
            غزوات النبي ﷺ
          </h1>
          <p className="max-w-2xl mx-auto text-lg leading-8 text-brand-cream/70">
            جميع غزوات سيد الأنام محمد صلى الله عليه وسلم — مع التفاصيل والتواريخ والدروس المستفادة
          </p>
          <div className="flex items-center justify-center gap-8">
            <div>
              <p className="text-3xl font-bold text-brand-gold">{displayBattles.length}+</p>
              <p className="text-xs text-brand-cream/50">غزوة موثّقة</p>
            </div>
            <div className="w-px h-10 bg-brand-gold/20" />
            <div>
              <p className="text-3xl font-bold text-brand-gold">27</p>
              <p className="text-xs text-brand-cream/50">غزوة قادها النبي بنفسه</p>
            </div>
            <div className="w-px h-10 bg-brand-gold/20" />
            <div>
              <p className="text-3xl font-bold text-brand-gold">38</p>
              <p className="text-xs text-brand-cream/50">سرية عسكرية</p>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12 space-y-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayBattles.map((battle, i) => (
            <Link
              key={battle.id}
              href={`/battles/${canonicalBattleSlug(battle.slug)}`}
              className="group block"
            >
              <div className="h-full rounded-xl border border-red-900/20 bg-gradient-to-br from-red-950/30 to-[#0A2A1E]/80 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-900/10 hover:border-brand-gold/40">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-red-900/20 border border-red-700/30 flex items-center justify-center text-brand-gold font-bold text-sm group-hover:border-brand-gold/40 transition-colors">
                    {battle.order_num ?? i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-brand-gold leading-snug">{battle.name_ar}</h2>
                    {battle.date_hijri && (
                      <p className="text-xs text-brand-cream/50 mt-0.5">{battle.date_hijri}</p>
                    )}
                  </div>
                </div>
                {battle.location_ar && (
                  <p className="text-xs text-brand-cream/40 mb-2">المكان: {battle.location_ar}</p>
                )}
                {battle.description_ar && (
                  <p className="text-sm leading-relaxed text-brand-cream/70 line-clamp-2">
                    {battle.description_ar}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-1 text-xs text-brand-gold/50 group-hover:text-brand-gold/80 transition-colors">
                  <span>اقرأ التفاصيل</span>
                  <span>←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <section className="rounded-2xl border border-brand-gold/20 bg-brand-gold/5 p-8 text-center space-y-4 mt-8">
          <p className="text-2xl font-arabic leading-loose text-brand-cream" dir="rtl">
            ﴿ يَا أَيُّهَا الَّذِينَ آمَنُوا إِن تَنصُرُوا اللَّهَ يَنصُرْكُمْ وَيُثَبِّتْ أَقْدَامَكُمْ ﴾
          </p>
          <p className="text-brand-gold/60 text-sm">سورة محمد — الآية 7</p>
        </section>
      </Container>
    </main>
  );
}
