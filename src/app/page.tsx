import Link from 'next/link';
import { cookies } from 'next/headers';
import { Container } from '@/components/ui/container';
import { getSiteSetting } from '@/features/site-content/services/site-content';
import { getArticles } from '@/features/articles/services/articles';
import { HomeInteractive } from '@/features/home/components/home-interactive';
import { SITE_CATALOG, CATALOG_ITEMS } from '@/lib/navigation/catalog';

export const dynamic = 'force-dynamic';

const QUICK_ACTIONS = [
  { href: '/quran', ar: 'القرآن', en: 'Quran', icon: '📖', tone: 'قراءة وتلاوة' },
  { href: '/prayer-times', ar: 'الصلاة', en: 'Prayer', icon: '🕌', tone: 'المواقيت والتنبيهات' },
  { href: '/adhkar', ar: 'الأذكار', en: 'Adhkar', icon: '📿', tone: 'الورد اليومي' },
  { href: '/hadith', ar: 'الأحاديث', en: 'Hadith', icon: '📚', tone: 'قراءة وتحقق' },
  { href: '/audio', ar: 'الصوت', en: 'Audio', icon: '🎧', tone: 'أذان وذكر وتلاوات' },
  { href: '/search', ar: 'البحث', en: 'Search', icon: '⌕', tone: 'ابحث في ذِكر' },
  { href: '/kids', ar: 'الأطفال', en: 'Kids', icon: '🌟', tone: 'تعلم ولعب' },
] as const;

const FEATURED_GROUP_IDS = ['revelation', 'remembrance', 'daily', 'history'] as const;

const DAILY_TOOLS = [
  { href: '/wird', ar: 'الورد اليومي', en: 'Daily Wird', icon: '☀️', text: 'خطة بسيطة للقراءة والذكر والاستمرارية.' },
  { href: '/qibla', ar: 'القبلة', en: 'Qibla', icon: '🧭', text: 'حدد اتجاه القبلة من جهازك.' },
  { href: '/memorization', ar: 'الحفظ', en: 'Memorization', icon: '🧠', text: 'قسّم الحفظ والمراجعة إلى جلسات قابلة للمتابعة.' },
  { href: '/offline-library', ar: 'المكتبة بلا إنترنت', en: 'Offline Library', icon: '⬇️', text: 'ارجع للمحتوى المحفوظ عند ضعف الاتصال.' },
] as const;

const dailyVerse = 'إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ';

export default async function HomePage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('zikr-locale')?.value === 'en' ? 'en' : 'ar';
  const isEnglish = locale === 'en';
  const dir = isEnglish ? 'ltr' : 'rtl';
  const homepageSetting = await getSiteSetting('homepage');
  const showPrayerTimes = homepageSetting?.showPrayerTimes !== false;
  const homeTitle =
    !isEnglish && homepageSetting?.title?.trim()
      ? homepageSetting.title.trim()
      : 'ذِكرٌ';
  const homeBody =
    !isEnglish && homepageSetting?.body?.trim()
      ? homepageSetting.body.trim()
      : isEnglish
        ? 'A focused Islamic knowledge and worship platform.'
        : 'منصة إسلامية مرتبة للقراءة والذكر والتعلّم والعمل.';

  const visibleQuickActions = QUICK_ACTIONS.filter(item => {
    if (item.href === '/quran') return homepageSetting?.showQuran !== false;
    if (item.href === '/hadith') return homepageSetting?.showHadith !== false;
    return true;
  });

  const visibleGroups = SITE_CATALOG.filter(group =>
    FEATURED_GROUP_IDS.includes(group.id as (typeof FEATURED_GROUP_IDS)[number]),
  );

  const articles = await getArticles(undefined, 6);

  return (
    <div className="min-h-screen overflow-x-hidden bg-brand-emeraldDeep text-brand-cream">
      <section
        className="relative overflow-hidden border-b border-brand-gold/15 bg-[radial-gradient(circle_at_50%_10%,rgba(199,168,107,0.14),transparent_34%),linear-gradient(180deg,#050f0a_0%,#0A2A1E_58%,#071f16_100%)]"
        aria-label={isEnglish ? 'Home page' : 'الصفحة الرئيسية'}
      >
        <Container className="relative z-10 pb-8 pt-8 sm:pb-12 sm:pt-12">
          <div className="mx-auto max-w-5xl text-center" dir={dir}>
            <p className="text-xs font-semibold tracking-[0.22em] text-brand-gold/50">
              {isEnglish ? 'ZIKR PLATFORM' : 'منصة ذِكر'}
            </p>
            <div
              className="mx-auto my-4 h-px w-28 bg-gradient-to-r from-transparent via-brand-gold/45 to-transparent"
              aria-hidden="true"
            />
            <h1
              className="text-5xl font-bold text-brand-gold sm:text-7xl"
              style={{ fontFamily: 'var(--font-amiri), var(--font-noto-arabic)' }}
            >
              {homeTitle}
            </h1>
            <p
              className="mx-auto mt-4 max-w-3xl text-base leading-8 text-brand-cream/65 sm:text-lg"
              style={{ fontFamily: 'var(--font-amiri), var(--font-noto-arabic)' }}
            >
              {homeBody}
            </p>
            <HomeInteractive locale={locale} showPrayerTimes={showPrayerTimes} />
          </div>
        </Container>
      </section>

      <main>
        <section
          className="border-b border-brand-gold/10 px-3 py-8 sm:px-4 sm:py-10"
          aria-labelledby="quick-start-heading"
        >
          <Container>
            <div className="mb-5 flex items-end justify-between gap-4" dir={dir}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold/45">
                  {isEnglish ? 'Quick start' : 'ابدأ بسرعة'}
                </p>
                <h2 id="quick-start-heading" className="mt-2 text-2xl font-bold text-brand-gold">
                  {isEnglish ? 'The six most useful entry points' : 'أهم ستة مداخل في المنصة'}
                </h2>
              </div>
              <Link href="/sections" className="text-sm text-brand-gold/65 hover:text-brand-gold">
                {isEnglish ? 'All sections' : 'كل الأقسام'}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {visibleQuickActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl border border-brand-gold/12 bg-black/15 p-4 text-center transition hover:-translate-y-0.5 hover:border-brand-gold/35"
                  dir={dir}
                >
                  <span className="text-2xl" aria-hidden="true">
                    {action.icon}
                  </span>
                  <h3 className="mt-3 font-bold text-brand-cream group-hover:text-brand-gold">
                    {isEnglish ? action.en : action.ar}
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-brand-cream/40">
                    {isEnglish ? action.tone : action.tone}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        <section
          className="border-b border-brand-gold/10 px-3 py-9 sm:px-4 sm:py-12"
          aria-labelledby="journeys-heading"
        >
          <Container>
            <div dir={dir}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold/45">
                {isEnglish ? 'Organized journeys' : 'مسارات مرتبة'}
              </p>
              <h2 id="journeys-heading" className="mt-2 text-2xl font-bold text-brand-gold">
                {isEnglish ? 'Choose a subject, not a pile of links' : 'اختر مسارًا بدل قائمة روابط طويلة'}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/55">
                {isEnglish
                  ? 'Each group below contains related sections. The complete directory remains in the Sections page, while Home only highlights the main paths.'
                  : 'كل مجموعة تجمع الوظائف المتقاربة. الدليل الكامل موجود في صفحة الأقسام، بينما الصفحة الرئيسية تركز على أهم المسارات فقط.'}
              </p>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {visibleGroups.map(group => (
                <article
                  key={group.id}
                  className="rounded-3xl border border-brand-gold/12 bg-black/15 p-5 sm:p-6"
                  dir={dir}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-2xl" aria-hidden="true">{group.icon}</p>
                      <h3 className="mt-3 text-xl font-bold text-brand-gold">
                        {isEnglish ? group.en : group.ar}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-brand-cream/55">
                        {isEnglish ? group.descriptionEn : group.descriptionAr}
                      </p>
                    </div>
                    <Link
                      href={'/sections#' + group.id}
                      className="shrink-0 rounded-xl border border-brand-gold/20 px-3 py-2 text-xs text-brand-gold/70 hover:border-brand-gold/40 hover:text-brand-gold"
                    >
                      {isEnglish ? 'Explore' : 'استكشف'}
                    </Link>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {group.items.slice(0, 3).map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-2xl border border-brand-gold/10 bg-black/15 p-3 hover:border-brand-gold/30"
                      >
                        <p className="text-sm font-bold text-brand-cream">{isEnglish ? item.en : item.ar}</p>
                        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-brand-cream/45">
                          {isEnglish ? item.descriptionEn : item.descriptionAr}
                        </p>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section
          className="border-b border-brand-gold/10 px-3 py-9 sm:px-4 sm:py-12"
          aria-labelledby="editorial-heading"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 560px' }}
        >
          <Container>
            <div className="flex items-end justify-between gap-4" dir={dir}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold/45">
                  {isEnglish ? 'Editorial library' : 'المكتبة التحريرية'}
                </p>
                <h2 id="editorial-heading" className="mt-2 text-2xl font-bold text-brand-gold">
                  {isEnglish ? 'New material to read and revisit' : 'محتوى جديد للقراءة والمراجعة'}
                </h2>
              </div>
              <Link href="/articles" className="text-sm text-brand-gold/65 hover:text-brand-gold">
                {isEnglish ? 'Open library' : 'فتح المكتبة'}
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {articles.slice(0, 6).map(article => (
                <Link
                  key={article.slug}
                  href={'/articles/' + article.slug}
                  className="group rounded-2xl border border-brand-gold/12 bg-black/15 p-5 hover:border-brand-gold/35"
                  dir={dir}
                >
                  <span className="text-[10px] uppercase tracking-[0.16em] text-brand-gold/45">
                    ZIKR EDITORIAL
                  </span>
                  <h3 className="mt-3 line-clamp-2 text-lg font-bold text-brand-cream group-hover:text-brand-gold">
                    {article.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-7 text-brand-cream/50">
                    {article.summary}
                  </p>
                  <span className="mt-4 inline-block text-xs text-brand-gold/60">
                    {isEnglish ? 'Read article →' : 'اقرأ المقال ←'}
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        <section
          className="border-b border-brand-gold/10 px-3 py-9 sm:px-4 sm:py-12"
          aria-labelledby="tools-heading"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 420px' }}
        >
          <Container>
            <div dir={dir}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold/45">
                {isEnglish ? 'Daily tools' : 'الأدوات اليومية'}
              </p>
              <h2 id="tools-heading" className="mt-2 text-2xl font-bold text-brand-gold">
                {isEnglish ? 'Useful utilities without clutter' : 'أدوات مفيدة بدون ازدحام'}
              </h2>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              {DAILY_TOOLS.map(tool => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-2xl border border-brand-gold/12 bg-black/15 p-4 hover:border-brand-gold/35"
                  dir={dir}
                >
                  <span className="text-xl" aria-hidden="true">{tool.icon}</span>
                  <h3 className="mt-3 font-bold text-brand-gold">{isEnglish ? tool.en : tool.ar}</h3>
                  <p className="mt-2 text-xs leading-6 text-brand-cream/50">{tool.text}</p>
                </Link>
              ))}
            </div>
            <p className="mt-5 text-xs leading-6 text-brand-cream/35" dir={dir}>
              {isEnglish
                ? 'The homepage deliberately avoids repeating the entire navigation tree. Use Sections for the complete map.'
                : 'الصفحة الرئيسية لا تكرر شجرة الموقع كاملة عمدًا؛ استخدم دليل الأقسام للوصول إلى كل شيء.'}
              {' · '}
              {CATALOG_ITEMS.length} {isEnglish ? 'organized paths' : 'مسارًا منظمًا'}
            </p>
          </Container>
        </section>

        <section className="px-3 py-10 sm:px-4 sm:py-14" aria-labelledby="verse-heading">
          <Container className="mx-auto max-w-4xl text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold/45">
              {isEnglish ? 'Daily reflection' : 'تدبر اليوم'}
            </p>
            <h2 id="verse-heading" className="mt-2 text-2xl font-bold text-brand-gold">
              {isEnglish ? 'A verse to keep close' : 'آية للتدبر والعمل'}
            </h2>
            <blockquote className="mt-6 rounded-3xl border border-brand-gold/12 bg-black/15 p-6 sm:p-10" dir="rtl">
              <p className="text-xl font-bold leading-loose text-brand-cream sm:text-3xl" style={{ fontFamily: 'var(--font-amiri)' }}>
                “{dailyVerse}”
              </p>
              <cite className="mt-4 block text-sm not-italic text-brand-gold/55">
                Surah Al-Isra — Verse 9
              </cite>
            </blockquote>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/quran" className="rounded-xl bg-brand-gold px-6 py-3 text-sm font-bold text-brand-emeraldDeep hover:bg-brand-goldSoft">
                {isEnglish ? 'Read Quran' : 'اقرأ القرآن'}
              </Link>
              <Link href="/adhkar" className="rounded-xl border border-brand-gold/25 px-6 py-3 text-sm text-brand-cream/75 hover:border-brand-gold hover:text-brand-gold">
                {isEnglish ? 'Open Adhkar' : 'افتح الأذكار'}
              </Link>
            </div>
          </Container>
        </section>
      </main>
    </div>
  );
}
