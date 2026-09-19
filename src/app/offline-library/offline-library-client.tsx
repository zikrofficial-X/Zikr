'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  fetchOfflineManifest,
  hydrateOfflineContent,
  requestOfflineRouteCache,
} from '@/lib/offline-pack';

type Manifest = Awaited<ReturnType<typeof fetchOfflineManifest>>;

const SUPPLEMENTAL_ROUTE_URL = '/offline-content/v2/routes.json';
const ROUTE_BATCH_SIZE = 160;

const PUBLIC_LIBRARY_ROUTES = [
  '/', '/mushaf', '/quran', '/hadith', '/stories', '/adhkar', '/dua',
  '/prophets', '/companions', '/scholars', '/articles', '/videos', '/kids',
  '/battles', '/conquests', '/tafsir', '/tawasheeh', '/radio', '/reciters',
  '/poetry', '/memorization', '/wird', '/zakat', '/spiritual-ai',
  '/competitions', '/youtube', '/offline-library', '/about', '/contact',
  '/platform', '/faq', '/privacy', '/terms', '/editorial-policy',
] as const;

const PRIVATE_PREFIXES = ['/api', '/auth', '/admin', '/profile', '/favorites', '/settings'];

const DATASET_LABELS: Record<string, string> = {
  surahs: 'السور',
  ayahs: 'الآيات',
  tafsir: 'التفسير',
  hadith_books: 'كتب الحديث',
  hadith: 'الأحاديث',
  prophets: 'الأنبياء',
  prophet_sections: 'فصول قصص الأنبياء',
  battles: 'الغزوات',
  battle_events: 'أحداث الغزوات',
  conquests: 'الفتوحات',
  conquest_events: 'أحداث الفتوحات',
  articles: 'المقالات',
  duas: 'الأدعية',
  kids: 'محتوى الأطفال',
  companions: 'الصحابة',
  companion_stories: 'قصص الصحابة',
};

function normalizeRoute(value: string): string | null {
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    const pathname = url.pathname === '' ? '/' : url.pathname;
    if (PRIVATE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return null;
    }
    return pathname;
  } catch {
    return null;
  }
}

async function discoverSitemapRoutes(): Promise<string[]> {
  try {
    const response = await fetch('/sitemap.xml', { cache: 'no-store' });
    if (!response.ok) return [];
    const xml = await response.text();
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    return Array.from(document.querySelectorAll('loc'))
      .map(node => node.textContent?.trim() ?? '')
      .map(normalizeRoute)
      .filter((route): route is string => Boolean(route));
  } catch {
    return [];
  }
}

async function discoverSupplementalRoutes(): Promise<string[]> {
  try {
    const response = await fetch(SUPPLEMENTAL_ROUTE_URL, { cache: 'no-store' });
    if (!response.ok) return [];
    const routes: unknown = await response.json();
    return Array.isArray(routes)
      ? routes
          .filter((route): route is string => typeof route === 'string')
          .map(normalizeRoute)
          .filter((route): route is string => Boolean(route))
      : [];
  } catch {
    return [];
  }
}

export default function OfflineLibraryClient() {
  const [manifest, setManifest] = useState<Manifest>(null);
  const [discoveredRoutes, setDiscoveredRoutes] = useState<string[]>([]);
  const [status, setStatus] = useState('جاري فحص مكتبة ذِكر ومصادر المحتوى…');
  const [isHydrating, setIsHydrating] = useState(false);
  const [cachedRoutes, setCachedRoutes] = useState(0);
  const [failedRoutes, setFailedRoutes] = useState<string[]>([]);
  const [activeBatch, setActiveBatch] = useState(0);
  const [quota, setQuota] = useState<{ usage?: number; quota?: number }>({});

  useEffect(() => {
    let mounted = true;

    void Promise.all([
      fetchOfflineManifest(),
      discoverSupplementalRoutes(),
      discoverSitemapRoutes(),
    ]).then(([nextManifest, supplementalRoutes, sitemapRoutes]) => {
      if (!mounted) return;
      setManifest(nextManifest);
      const routes = Array.from(
        new Set([
          ...PUBLIC_LIBRARY_ROUTES,
          ...(nextManifest?.routes ?? []),
          ...supplementalRoutes,
          ...sitemapRoutes,
        ]),
      );
      setDiscoveredRoutes(routes);
      setStatus(
        `تم اكتشاف ${routes.length.toLocaleString('ar-EG')} صفحة عامة من الـ sitemap والحزم المحلية، جاهزة للتنزيل.`
      );
    }).catch(() => {
      if (!mounted) return;
      setStatus('تعذر اكتشاف كل الصفحات تلقائيًا؛ يمكنك إعادة المحاولة لتنزيل الحزمة الحالية.');
    });

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      void navigator.storage.estimate().then(result => {
        if (!mounted) return;
        setQuota({ usage: result.usage, quota: result.quota });
      }).catch(() => undefined);
    }

    return () => { mounted = false; };
  }, []);

  const datasets = manifest ? Object.entries(manifest.datasets) : [];
  const totalRecords = datasets.reduce((sum, [, item]) => sum + item.count, 0);
  const completionPercent = discoveredRoutes.length === 0
    ? 0
    : Math.min(100, Math.round((cachedRoutes / discoveredRoutes.length) * 100));

  const quotaText = useMemo(() => {
    if (!quota.usage || !quota.quota) return null;
    const usedMb = quota.usage / 1024 / 1024;
    const quotaMb = quota.quota / 1024 / 1024;
    return `${usedMb.toFixed(1)} MB / ${quotaMb.toFixed(1)} MB`;
  }, [quota]);

  const hydrate = async () => {
    if (!navigator.onLine) {
      setStatus('اتصل بالإنترنت أولًا لتنزيل أحدث نسخة كاملة من مكتبة ذِكر.');
      return;
    }

    setIsHydrating(true);
    setCachedRoutes(0);
    setFailedRoutes([]);
    setActiveBatch(0);

    try {
      // First hydrate every structured dataset. Route caching is handled below
      // in controlled batches because the service worker intentionally limits
      // a single CACHE_OFFLINE_ROUTES message.
      setStatus('المرحلة 1/2: تنزيل جميع قواعد البيانات والمحتويات المنظمة…');
      const result = await hydrateOfflineContent({ force: true, cacheRoutes: false });
      if (!result) {
        setStatus('تعذر تنزيل الحزمة الأساسية. تحقق من الاتصال ثم أعد المحاولة.');
        return;
      }

      const routes = Array.from(new Set(discoveredRoutes));
      const batches: string[][] = [];
      for (let index = 0; index < routes.length; index += ROUTE_BATCH_SIZE) {
        batches.push(routes.slice(index, index + ROUTE_BATCH_SIZE));
      }

      let cached = 0;
      let failures: string[] = [];
      for (let index = 0; index < batches.length; index += 1) {
        const batch = batches[index];
        setActiveBatch(index + 1);
        setStatus(
          `المرحلة 2/2: تجهيز الصفحات دون اتصال — الدفعة ${index + 1} من ${batches.length} (${cached.toLocaleString('ar-EG')} / ${routes.length.toLocaleString('ar-EG')})…`,
        );
        const batchResult = await requestOfflineRouteCache(batch);
        cached += batchResult.cachedRoutes;
        failures = Array.from(new Set([...failures, ...batchResult.failedRoutes]));
        setCachedRoutes(cached);
        setFailedRoutes(failures);
      }

      const complete = result.complete && failures.length === 0 && cached === routes.length;
      setManifest(result.manifest);
      setStatus(
        complete
          ? `اكتملت مكتبة ذِكر أوفلاين: ${routes.length.toLocaleString('ar-EG')} صفحة عامة + ${totalRecords.toLocaleString('ar-EG')} سجل من datasets.`
          : `تم تنزيل datasets كاملة وتجهيز ${cached.toLocaleString('ar-EG')} من ${routes.length.toLocaleString('ar-EG')} صفحة. ${failures.length.toLocaleString('ar-EG')} صفحة تحتاج إعادة محاولة.`,
      );
    } catch (error) {
      console.warn('[OfflineLibrary] Full offline refresh failed', error);
      setStatus('حدث خطأ أثناء تجهيز المكتبة. أعد المحاولة بعد التأكد من الاتصال ومساحة التخزين.');
    } finally {
      setActiveBatch(0);
      setIsHydrating(false);
    }
  };

  return (
    <Container className="space-y-8 py-10 text-right">
      <section className="space-y-5">
        <p className="text-sm font-medium tracking-wide text-brand-gold">PWA · IndexedDB · Cache Storage · Sitemap</p>
        <h1 className="text-4xl font-bold text-foreground">مكتبة ذِكر الكاملة دون إنترنت</h1>
        <p className="max-w-4xl text-lg leading-9 text-muted-foreground">
          هذه ليست حزمة لجزء من الموقع فقط. تقوم المكتبة باكتشاف المحتوى العام من manifest المحلي، والـ routes الإضافية، وملف sitemap الفعلي، ثم تحفظ قواعد البيانات والصفحات العامة في دفعات صغيرة حتى لا تسقط العملية بسبب حد عدد الصفحات في طلب واحد.
        </p>
      </section>

      <Card className="space-y-5 border-brand-gold/20 bg-brand-gold/5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs text-muted-foreground">الإصدار</p><p className="mt-1 font-semibold text-brand-gold">{manifest?.version ?? 'غير متاح'}</p></div>
          <div><p className="text-xs text-muted-foreground">datasets</p><p className="mt-1 text-2xl font-bold text-foreground">{datasets.length.toLocaleString('ar-EG')}</p></div>
          <div><p className="text-xs text-muted-foreground">إجمالي السجلات</p><p className="mt-1 text-2xl font-bold text-foreground">{totalRecords.toLocaleString('ar-EG')}</p></div>
          <div><p className="text-xs text-muted-foreground">الصفحات العامة المكتشفة</p><p className="mt-1 text-2xl font-bold text-foreground">{discoveredRoutes.length.toLocaleString('ar-EG')}</p></div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">تقدم تجهيز الصفحات</span>
            <span className="font-bold text-brand-gold">{completionPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-black/30" aria-label={`تقدم ${completionPercent}%`}>
            <div className="h-full rounded-full bg-brand-gold transition-all" style={{ width: `${completionPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">{cachedRoutes.toLocaleString('ar-EG')} صفحة محفوظة · {failedRoutes.length.toLocaleString('ar-EG')} فشلت وتحتاج إعادة محاولة</p>
        </div>
        <p className="leading-8 text-foreground">{status}</p>
        {quotaText && <p className="text-xs text-muted-foreground">مساحة التخزين التقريبية: {quotaText}</p>}
        {activeBatch > 0 && <p className="text-xs text-brand-gold">الدفعة الحالية: {activeBatch}</p>}
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {datasets.map(([name, item]) => (
          <Card key={name} className="space-y-2 border-brand-gold/10">
            <p className="text-xs text-muted-foreground">Dataset</p>
            <h2 className="font-semibold text-brand-gold">{DATASET_LABELS[name] ?? name}</h2>
            <p className="text-2xl font-bold text-foreground">{item.count.toLocaleString('ar-EG')}</p>
            <p className="text-xs leading-6 text-muted-foreground">سجل/سجلات محفوظة محليًا ضمن الحزمة الأساسية.</p>
          </Card>
        ))}
      </section>

      <Card className="space-y-4 border-brand-gold/10">
        <h2 className="text-2xl font-bold text-brand-gold">ماذا تشمل المكتبة؟</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 leading-8 text-muted-foreground">
            <p><strong className="text-foreground">المحتوى النصي والبيانات:</strong> القرآن والآيات، التفسير المتاح، كتب الحديث والأحاديث، قصص الأنبياء والصحابة، الغزوات والفتوحات وأحداثها، المقالات، الأدعية ومحتوى الأطفال، وكل datasets التي يوفرها manifest المحلي.</p>
            <p><strong className="text-foreground">الصفحات العامة:</strong> صفحات الأقسام والتفاصيل العامة تُكتشف من sitemap ومن قوائم المسارات المحلية، لذلك لا تعتمد الحزمة على قائمة ثابتة قد تصبح قديمة بعد إضافة صفحة جديدة.</p>
          </div>
          <div className="space-y-3 leading-8 text-muted-foreground">
            <p><strong className="text-foreground">ما لا ننزله تلقائيًا:</strong> ملفات الصوت والفيديو الخارجية الضخمة، وحسابات المستخدمين وبيانات الإدارة. الصفحات والبيانات الوصفية تظل متاحة عند انقطاع الشبكة، بينما البث الخارجي يحتاج اتصالًا.</p>
            <p><strong className="text-foreground">التحديث:</strong> استخدم زر التحديث وأنت متصل لإعادة مزامنة البيانات والصفحات. العملية مقسمة إلى دفعات حتى تتعامل بأمان مع مكتبة كبيرة.</p>
          </div>
        </div>
      </Card>

      <Card className="space-y-5 border-brand-gold/10">
        <h2 className="text-2xl font-bold text-brand-gold">الصفحات والبحث السريع</h2>
        <div className="flex flex-wrap gap-3">
          {[
            ['/mushaf', 'المصحف'], ['/quran', 'القرآن'], ['/hadith', 'الحديث'], ['/adhkar', 'الأذكار'],
            ['/dua', 'الأدعية'], ['/prophets', 'الأنبياء'], ['/companions', 'الصحابة'], ['/scholars', 'العلماء'],
            ['/articles', 'المقالات'], ['/stories', 'القصص'], ['/battles', 'الغزوات'], ['/conquests', 'الفتوحات'],
            ['/kids', 'الأطفال'], ['/videos', 'الفيديوهات'], ['/tafsir', 'التفسير'], ['/reciters', 'القراء'],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">{label}</Link>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={hydrate} disabled={isHydrating}>
          {isHydrating ? 'جاري تجهيز المكتبة الكاملة…' : 'تحديث وتجهيز المكتبة كاملة'}
        </Button>
        <span className="text-sm text-muted-foreground">يتم الحفظ محليًا في IndexedDB وCache Storage.</span>
      </div>

      {failedRoutes.length > 0 && (
        <Card className="border-brand-gold/10">
          <h2 className="text-lg font-semibold text-brand-gold">صفحات تحتاج إعادة محاولة</h2>
          <p className="mt-3 break-words text-sm leading-7 text-muted-foreground">{failedRoutes.slice(0, 30).join('، ')}{failedRoutes.length > 30 ? ' …' : ''}</p>
        </Card>
      )}
    </Container>
  );
}
