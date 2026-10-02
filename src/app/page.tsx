import Link from 'next/link';
import { cookies } from 'next/headers';
import { Container } from '@/components/ui/container';
import { getSiteSetting } from '@/features/site-content/services/site-content';
import { HomeInteractive } from '@/features/home/components/home-interactive';

export const dynamic = 'force-dynamic';

const navItems = [
  ['القرآن', 'Quran', '/quran'], ['الحديث', 'Hadith', '/hadith'], ['الأذكار', 'Adhkar', '/adhkar'],
  ['الأدعية', 'Dua', '/dua'], ['الأنبياء', 'Prophets', '/prophets'], ['الصحابة', 'Companions', '/companions'],
  ['المقالات', 'Articles', '/articles'], ['الفيديوهات', 'Videos', '/videos'], ['الصلاة', 'Prayer', '/prayer-times'],
  ['القبلة', 'Qibla', '/qibla'], ['الأقسام', 'Sections', '/sections'],
] as const;

const featured = [
  { href: '/quran', title: 'القرآن الكريم', titleEn: 'The Holy Quran', desc: 'قراءة واستماع إلى سور القرآن الكريم مع تجربة هادئة وسريعة.', descEn: 'Read and listen to the Holy Quran in a calm, fast experience.', icon: '📖', badge: '114 سورة' },
  { href: '/hadith', title: 'الحديث الشريف', titleEn: 'Prophetic Hadith', desc: 'الوصول إلى الأحاديث والمصادر المختارة داخل واجهة واضحة.', descEn: 'Explore selected Prophetic hadith and sources in a clear interface.', icon: '📜', badge: 'حديث' },
  { href: '/adhkar', title: 'الأذكار اليومية', titleEn: 'Daily Adhkar', desc: 'أذكار الصباح والمساء وتذكير يومي يساعدك على الاستمرار.', descEn: 'Morning and evening remembrance with a simple daily rhythm.', icon: '📿', badge: 'يومي' },
  { href: '/prophets', title: 'قصص الأنبياء', titleEn: 'Stories of the Prophets', desc: 'قصص وسير مرتبة تساعد على القراءة والتعلّم خطوة بخطوة.', descEn: 'Structured stories and biographies for focused learning.', icon: '🌙', badge: '25 نبيًا' },
  { href: '/tafsir', title: 'التفسير', titleEn: 'Tafsir', desc: 'قراءة التفسير مع أدوات تساعدك على فهم الآيات في سياقها.', descEn: 'Study tafsir with tools that keep each verse in context.', icon: '🔎', badge: 'فهم' },
  { href: '/spiritual-ai', title: 'الرفيق الروحاني', titleEn: 'Spiritual AI', desc: 'مساعد معرفي للأسئلة الروحانية مع التنبيه إلى أهمية الرجوع للمصادر الموثوقة.', descEn: 'A knowledge assistant for spiritual questions with source-aware guidance.', icon: '✦', badge: 'AI' },
] as const;

const moreContent = [
  ['مكتبة الصوت', 'Audio', '/audio', '🎧'], ['دليل الأقسام', 'Sections', '/sections', '🧭'],\n  ['المصحف الشريف', 'Mushaf', '/mushaf', '📖'], ['الأطفال', 'Kids', '/kids', '🌟'], ['حفظ القرآن', 'Memorization', '/memorization', '🧠'],
  ['إذاعة القرآن', 'Quran Radio', '/radio', '📻'], ['القراء', 'Reciters', '/reciters', '🎙️'], ['الشعر', 'Poetry', '/poetry', '✒️'],
  ['الغزوات', 'Battles', '/battles', '☾'], ['الفتوحات', 'Conquests', '/conquests', '🏛️'], ['المداحون', 'Nasheed', '/tawasheeh', '🎵'],
  ['عداد التسبيح', 'Tasbeeh', '/tasbeeh', '◉'], ['المكتبة بلا إنترنت', 'Offline Library', '/offline-library', '⬇️'], ['البحث', 'Search', '/search', '⌕'],
] as const;

const learningPaths = [
  { href: '/quran', title: 'ابدأ بالقرآن', titleEn: 'Start with Quran', text: 'اقرأ سورة، استمع، ثم انتقل إلى التفسير عند الحاجة.', textEn: 'Read a surah, listen, then open tafsir when needed.' },
  { href: '/adhkar', title: 'ثبّت وردك اليومي', titleEn: 'Build a Daily Practice', text: 'اجعل أذكار الصباح والمساء نقطة ثابتة في يومك.', textEn: 'Make morning and evening adhkar a consistent part of your day.' },
  { href: '/memorization', title: 'ابنِ خطة حفظ', titleEn: 'Build a Memorization Plan', text: 'قسّم الحفظ إلى جلسات قصيرة مع مراجعة مستمرة.', textEn: 'Use short sessions with deliberate review.' },
] as const;

const stats = [
  ['114', 'سورة قرآنية', 'Quran Surahs'], ['6,236', 'آية كريمة', 'Verses'], ['30', 'جزءًا', "Juz'"], ['25', 'نبيًا ورسولًا', 'Prophets & Messengers'],
] as const;

const dailyVerse = 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ';

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('zikr-locale')?.value === 'en' ? 'en' : 'ar';
  const isEnglish = locale === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';
  const homepageSetting = await getSiteSetting('homepage');
  const showPrayerTimes = homepageSetting?.showPrayerTimes !== false;
  const homeTitle = !isEnglish && homepageSetting?.title?.trim() ? homepageSetting.title.trim() : 'ذِكرٌ';
  const homeBody = !isEnglish && homepageSetting?.body?.trim() ? homepageSetting.body.trim() : isEnglish ? 'Your complete spiritual platform' : 'منصتك الروحانية الشاملة';
  const visibleFeatured = featured.filter((item) => {
    if (item.href === '/quran') return homepageSetting?.showQuran !== false;
    if (item.href === '/hadith') return homepageSetting?.showHadith !== false;
    if (item.href === '/prophets') return homepageSetting?.showProphets !== false;
    return true;
  });

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-brand-emeraldDeep text-brand-cream">
      <section className="relative overflow-hidden border-b border-brand-gold/15 bg-[radial-gradient(circle_at_50%_10%,rgba(199,168,107,0.10),transparent_38%),linear-gradient(180deg,#050f0a_0%,#0A2A1E_55%,#071f16_100%)]" aria-label={isEnglish ? 'Home page' : 'الصفحة الرئيسية'}>
        <Container className="relative z-10 pb-8 pt-8 sm:pb-12 sm:pt-12">
          <div className="mx-auto max-w-5xl text-center" dir={dir}>
            <p className="text-sm tracking-[0.18em] text-brand-gold/50">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
            <div className="mx-auto my-4 h-px w-32 bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" aria-hidden="true" />
            <h1 className="text-5xl font-bold text-brand-gold sm:text-7xl" style={{ fontFamily: 'var(--font-amiri), var(--font-noto-arabic)' }}>{homeTitle}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-brand-cream/60 sm:text-lg" style={{ fontFamily: 'var(--font-amiri), var(--font-noto-arabic)' }}>{homeBody}</p>
            <HomeInteractive locale={locale} showPrayerTimes={showPrayerTimes} />
            <form action="/search" method="get" role="search" className="mx-auto mt-6 max-w-2xl">
              <label htmlFor="home-search" className="sr-only">{isEnglish ? 'Search ZIKR' : 'البحث في ذِكر'}</label>
              <div className="flex gap-2 rounded-2xl border border-brand-gold/20 bg-black/20 p-1.5">
                <input id="home-search" name="q" type="search" placeholder={isEnglish ? 'Search Quran, hadith, stories…' : 'ابحث في القرآن، الحديث، القصص…'} className="min-w-0 flex-1 rounded-xl bg-transparent px-4 py-3 text-sm text-brand-cream outline-none placeholder:text-brand-cream/30" dir={dir} />
                <button type="submit" className="shrink-0 rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-emeraldDeep transition hover:bg-brand-goldSoft">{isEnglish ? 'Search' : 'بحث'}</button>
              </div>
            </form>
          </div>
          <nav className="mx-auto mt-6 grid max-w-6xl grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-11" aria-label={isEnglish ? 'Platform sections' : 'أقسام المنصة'}>
            {navItems.map(([ar, en, href]) => <Link key={href} href={href} className="rounded-xl border border-brand-gold/10 bg-black/15 px-2 py-2.5 text-center text-[11px] text-brand-cream/65 transition hover:border-brand-gold/35 hover:text-brand-gold" dir={dir}>{isEnglish ? en : ar}</Link>)}
          </nav>
        </Container>
      </section>

      <section className="border-b border-brand-gold/10 px-3 py-9 sm:px-4 sm:py-12" aria-labelledby="featured-heading">
        <Container>
          <div className="mb-6 flex items-end justify-between gap-4" dir={dir}><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/45">{isEnglish ? 'Core experience' : 'التجربة الأساسية'}</p><h2 id="featured-heading" className="mt-2 text-2xl font-bold text-brand-gold">{isEnglish ? 'Explore ZIKR' : 'اكتشف ذِكرٌ'}</h2></div><Link href="#all-sections" className="text-sm text-brand-gold/70 hover:text-brand-gold">{isEnglish ? 'View all' : 'عرض الكل'}</Link></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleFeatured.map((item) => <Link key={item.href} href={item.href} className="group rounded-2xl border border-brand-gold/12 bg-black/15 p-5 transition-colors hover:border-brand-gold/35" dir={dir}><div className="flex items-start justify-between gap-3"><span className="text-2xl" aria-hidden="true">{item.icon}</span><span className="rounded-full border border-brand-gold/10 px-2 py-1 text-[10px] text-brand-gold/55">{item.badge}</span></div><h3 className="mt-5 text-lg font-bold text-brand-gold group-hover:text-brand-goldSoft">{isEnglish ? item.titleEn : item.title}</h3><p className="mt-2 text-sm leading-7 text-brand-cream/55">{isEnglish ? item.descEn : item.desc}</p></Link>)}
          </div>
        </Container>
      </section>

      <section id="all-sections" className="border-b border-brand-gold/10 px-3 py-9 sm:px-4 sm:py-12" aria-labelledby="all-sections-heading" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 520px' }}>
        <Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/45">{isEnglish ? 'Library' : 'المكتبة'}</p><h2 id="all-sections-heading" className="mt-2 text-2xl font-bold text-brand-gold" dir={dir}>{isEnglish ? 'Everything in one place' : 'كل أقسام المنصة في مكان واحد'}</h2><div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">{moreContent.map(([ar, en, href, icon]) => <Link key={href} href={href} className="flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-brand-gold/12 bg-black/15 p-3 text-center text-xs text-brand-cream/65 transition hover:border-brand-gold/35 hover:text-brand-gold" dir={dir}><span className="text-xl" aria-hidden="true">{icon}</span><span>{isEnglish ? en : ar}</span></Link>)}</div></Container>
      </section>

      <section className="border-b border-brand-gold/10 px-3 py-9 sm:px-4 sm:py-12" aria-labelledby="learning-heading" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 440px' }}>
        <Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/45">{isEnglish ? 'Guided learning' : 'مسارات مقترحة'}</p><h2 id="learning-heading" className="mt-2 text-2xl font-bold text-brand-gold" dir={dir}>{isEnglish ? 'A clear next step' : 'خطوة واضحة بعد كل زيارة'}</h2><div className="mt-6 grid gap-4 md:grid-cols-3">{learningPaths.map((path) => <Link key={path.href} href={path.href} className="rounded-2xl border border-brand-gold/12 bg-black/15 p-5 transition hover:border-brand-gold/35" dir={dir}><h3 className="font-bold text-brand-gold">{isEnglish ? path.titleEn : path.title}</h3><p className="mt-2 text-sm leading-7 text-brand-cream/55">{isEnglish ? path.textEn : path.text}</p><span className="mt-4 inline-block text-xs text-brand-gold/60">{isEnglish ? 'Open section →' : 'افتح القسم ←'}</span></Link>)}</div></Container>
      </section>

      <section className="border-b border-brand-gold/10 px-3 py-9 sm:px-4 sm:py-12" aria-labelledby="stats-heading" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 360px' }}>
        <Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/45">{isEnglish ? 'By the numbers' : 'بالأرقام'}</p><h2 id="stats-heading" className="mt-2 text-2xl font-bold text-brand-gold" dir={dir}>{isEnglish ? 'Quran facts' : 'أرقام من القرآن الكريم'}</h2><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">{stats.map(([value, ar, en]) => <div key={value} className="rounded-2xl border border-brand-gold/12 bg-black/15 p-4 text-center"><p className="text-xs text-brand-cream/55" dir={dir}>{isEnglish ? en : ar}</p><p className="mt-2 text-3xl font-bold text-brand-gold tabular-nums">{value}</p></div>)}</div></Container>
      </section>

      <section className="px-3 py-10 sm:px-4 sm:py-14" aria-labelledby="verse-heading" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 360px' }}>
        <Container className="mx-auto max-w-4xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold/45">{isEnglish ? 'Daily reflection' : 'تدبر اليوم'}</p><h2 id="verse-heading" className="mt-2 text-2xl font-bold text-brand-gold" dir={dir}>{isEnglish ? 'A verse to keep close' : 'آية للتدبر والعمل'}</h2><blockquote className="mt-6 rounded-3xl border border-brand-gold/12 bg-black/15 p-6 sm:p-10" dir="rtl"><p className="text-xl font-bold leading-loose text-brand-cream sm:text-3xl" style={{ fontFamily: 'var(--font-amiri)' }}>“{dailyVerse}”</p><cite className="mt-4 block text-sm not-italic text-brand-gold/55">Surah Al-Isra — Verse 9</cite></blockquote><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/quran" className="rounded-xl bg-brand-gold px-6 py-3 text-sm font-bold text-brand-emeraldDeep transition hover:bg-brand-goldSoft">{isEnglish ? 'Read Quran' : 'اقرأ القرآن'}</Link><Link href="/adhkar" className="rounded-xl border border-brand-gold/25 px-6 py-3 text-sm text-brand-cream/75 transition hover:border-brand-gold hover:text-brand-gold">{isEnglish ? 'Open Adhkar' : 'افتح الأذكار'}</Link></div></Container>
      </section>
    </div>
  );
}
