'use client';

import { useEffect, useState } from 'react';
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

export default function OfflineLibraryPage() {
  const [manifest, setManifest] = useState<Manifest>(null);
  const [status, setStatus] = useState('جاري فحص الحزمة الأوفلاين…');
  const [isHydrating, setIsHydrating] = useState(false);
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [cachedRoutes, setCachedRoutes] = useState(0);
  const [failedRoutes, setFailedRoutes] = useState<string[]>([]);
  const [supplementalRoutes, setSupplementalRoutes] = useState<string[]>([]);

  useEffect(() => {
    void fetchOfflineManifest().then((next) => {
      setManifest(next);
      setStatus(
        next
          ? 'الحزمة الأساسية متاحة للتنزيل والتصفح دون اتصال.'
          : 'لم يتم العثور على manifest محلي حتى الآن.',
      );
    });

    void fetch(SUPPLEMENTAL_ROUTE_URL, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return [];
        const routes = await response.json();
        return Array.isArray(routes) ? routes.filter((r): r is string => typeof r === 'string') : [];
      })
      .then(setSupplementalRoutes)
      .catch(() => setSupplementalRoutes([]));
  }, []);

  const hydrate = async () => {
    if (!navigator.onLine) {
      setStatus('اتصل بالإنترنت أولًا لتنزيل أحدث نسخة كاملة من المحتوى للأوفلاين.');
      return;
    }

    setIsHydrating(true);
    setStatus('جاري تنزيل المحتوى وتجهيز الصفحات الكاملة للعمل دون إنترنت…');
    setCachedRoutes(0);
    setFailedRoutes([]);

    try {
      const result = await hydrateOfflineContent({ force: true, cacheRoutes: true });
      let totalCachedRoutes = result?.cachedRoutes ?? 0;
      let allFailedRoutes = result?.failedRoutes ?? [];

      if (supplementalRoutes.length > 0) {
        const supplementalResult = await requestOfflineRouteCache(supplementalRoutes);
        totalCachedRoutes += supplementalResult.cachedRoutes;
        allFailedRoutes = Array.from(
          new Set([...allFailedRoutes, ...supplementalResult.failedRoutes]),
        );
      }

      setManifest(result?.manifest ?? null);
      setIsComplete(result?.complete ?? false);
      setCachedRoutes(totalCachedRoutes);
      setFailedRoutes(allFailedRoutes);

      if (!result) {
        setStatus('تعذر تنزيل الحزمة؛ تحقق من الاتصال ثم أعد المحاولة.');
      } else if (result.complete && allFailedRoutes.length === 0) {
        setStatus(`تم حفظ جميع datasets وتجهيز ${totalCachedRoutes} صفحة محتوى للعمل دون إنترنت.`);
      } else if (result.complete) {
        setStatus(
          `تم حفظ جميع datasets. تم تجهيز ${totalCachedRoutes} صفحة، وتعذر تجهيز ${allFailedRoutes.length} صفحة ويمكن إعادة المحاولة.`,
        );
      } else {
        setStatus(
          `اكتمل التنزيل جزئيًا. datasets التي تحتاج إعادة المحاولة: ${result.failedDatasets.join('، ') || 'غير محدد'}.`,
        );
      }
    } catch (error) {
      console.warn('[OfflineLibrary] Offline pack refresh failed', error);
      setStatus('تعذر تحديث الحزمة. سيتم الاحتفاظ بالبيانات التي تم حفظها بالفعل.');
    } finally {
      setIsHydrating(false);
    }
  };

  const datasets = manifest ? Object.entries(manifest.datasets) : [];
  const total = datasets.reduce((sum, [, item]) => sum + item.count, 0);
  const routeTotal = manifest ? new Set([...manifest.routes, ...supplementalRoutes]).size : supplementalRoutes.length;

  return (
    <Container className="space-y-8 py-10 text-right">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-brand-gold">PWA · IndexedDB · Cache Storage</p>
          <h1 className="mt-2 text-3xl font-bold text-foreground">مكتبة ذِكر الأوفلاين</h1>
          <p className="mt-3 max-w-3xl leading-8 text-muted-foreground">
            نزّل الحزمة وأنت متصل بالإنترنت مرة واحدة. بعدها تظل المحتويات العامة وصفحاتها الأساسية، بما فيها صفحات الأقسام والتفاصيل الحالية، متاحة حتى عند انقطاع الشبكة. بيانات الحساب الخاصة وعمليات الإدارة لا تُحفظ داخل الحزمة.
          </p>
        </div>
        <Button onClick={hydrate} disabled={isHydrating}>
          {isHydrating ? 'جاري التجهيز…' : 'تحديث وتجهيز المكتبة كاملة'}
        </Button>
      </div>

      <Card className="space-y-3 border-brand-gold/20">
        <p className="text-sm text-brand-gold">الحالة</p>
        <p className="leading-8 text-foreground">{status}</p>
        {manifest && (
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <p>الإصدار: {manifest.version}</p>
            <p>datasets: {datasets.length}</p>
            <p>إجمالي السجلات: {total.toLocaleString('ar-EG')}</p>
            <p>صفحات المحتوى المستهدفة: {routeTotal}</p>
            <p>الصفحات التي تم تجهيزها: {cachedRoutes}</p>
            <p>الحالة: {isComplete === true ? 'مكتملة' : isComplete === false ? 'تحتاج إعادة محاولة' : 'غير مفحوصة'}</p>
            {failedRoutes.length > 0 && (
              <p className="sm:col-span-2 text-amber-300">
                صفحات تحتاج إعادة محاولة: {failedRoutes.slice(0, 8).join('، ')}{failedRoutes.length > 8 ? ' …' : ''}
              </p>
            )}
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {datasets.map(([name, item]) => (
          <Card key={name} className="space-y-2 border-brand-gold/10">
            <h2 className="font-semibold text-brand-gold">{name}</h2>
            <p className="text-2xl font-bold text-foreground">{item.count.toLocaleString('ar-EG')}</p>
            <p className="text-xs text-muted-foreground">سجل محفوظ في الحزمة الأساسية</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/mushaf" className="text-sm text-brand-gold underline-offset-4 hover:underline">فتح المصحف</Link>
        <Link href="/prophets" className="text-sm text-brand-gold underline-offset-4 hover:underline">قصص الأنبياء</Link>
        <Link href="/battles" className="text-sm text-brand-gold underline-offset-4 hover:underline">الغزوات</Link>
        <Link href="/conquests" className="text-sm text-brand-gold underline-offset-4 hover:underline">الفتوحات</Link>
        <Link href="/scholars" className="text-sm text-brand-gold underline-offset-4 hover:underline">العلماء</Link>
        <Link href="/videos" className="text-sm text-brand-gold underline-offset-4 hover:underline">الفيديوهات</Link>
        <Link href="/kids" className="text-sm text-brand-gold underline-offset-4 hover:underline">عالم الأطفال</Link>
      </div>
    </Container>
  );
}
