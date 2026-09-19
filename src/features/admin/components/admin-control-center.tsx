'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const MANAGEMENT_LINKS = [
  ['المحتوى', '/admin/content', 'إدارة المقالات والقصص والمحتوى التحريري.'],
  ['الفيديوهات والتوليد', '/admin/videos', 'إنشاء ومراجعة وإعادة محاولة وحذف عمليات التوليد الفاشلة.'],
  ['النشر التلقائي', '/admin/social', 'مراقبة طوابير النشر والمزامنة الاجتماعية.'],
  ['الأقسام', '/admin/sections', 'إظهار وإخفاء أقسام الموقع وإدارة إعداداتها.'],
  ['الأطفال', '/admin/kids', 'إدارة محتوى قسم الأطفال.'],
  ['المعرفة الإسلامية', '/admin/knowledge', 'إدارة المعرفة والمصادر الإسلامية.'],
  ['الأنبياء', '/admin/prophets', 'إدارة قصص الأنبياء.'],
  ['الغزوات', '/admin/battles', 'إدارة الغزوات والبيانات التاريخية.'],
  ['المستخدمون', '/admin/users', 'إدارة أدوار المستخدمين.'],
  ['التحليلات', '/admin/analytics', 'مراجعة مؤشرات الاستخدام والأداء.'],
  ['الصوت', '/admin/site-audio', 'إدارة مقاطع الأذان والتذكير.'],
] as const;

type Overview = {
  counts?: Record<string, { label: string; count: number }>;
  videoGeneration?: Record<string, number>;
  socialQueue?: Record<string, number>;
  sections?: { total: number; enabled: number; disabled: number };
  generatedAt?: string;
  error?: string;
};

const tone = (value: number, danger = false) => value > 0 ? (danger ? 'border-red-500/30 bg-red-500/10 text-red-200' : 'border-brand-gold/20 bg-brand-gold/5 text-brand-gold') : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-200';

export function AdminControlCenter() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingFailed, setDeletingFailed] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/overview', { cache: 'no-store' });
      const payload = await response.json() as Overview;
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل البيانات.');
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const failed = data?.videoGeneration?.failed ?? 0;
  const totalGenerated = useMemo(() => Object.values(data?.videoGeneration ?? {}).reduce((sum, n) => sum + n, 0), [data]);
  const socialPending = (data?.socialQueue?.pending ?? 0) + (data?.socialQueue?.processing ?? 0);

  const deleteFailed = async () => {
    if (!failed) return;
    if (!window.confirm(`سيتم حذف ${failed} عملية توليد فاشلة نهائيًا. هل أنت متأكد؟`)) return;
    setDeletingFailed(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/video-generation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteFailed: true }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'تعذر حذف العمليات الفاشلة.');
      setMessage('تم حذف كل عمليات التوليد الفاشلة.');
      await load();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'تعذر الحذف.');
    } finally {
      setDeletingFailed(false);
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      <section className="rounded-3xl border border-brand-gold/20 bg-black/20 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.2em] text-brand-cream/35 uppercase">ZIKR Admin Operations</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-gold">مركز التحكم الكامل</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/55">مكان واحد للوصول إلى كل أدوات الإدارة، ومراقبة العمليات الحساسة، وتنفيذ إجراءات التنظيف دون تعديل قاعدة البيانات يدويًا.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} className="rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">تحديث</button>
            <Link href="/admin" className="rounded-xl border border-brand-cream/10 px-4 py-2 text-sm text-brand-cream/60 hover:text-brand-cream">الرئيسية</Link>
          </div>
        </div>

        {error && <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</div>}
        {message && <div className="mt-5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" role="status">{message}</div>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5"><p className="text-xs text-brand-cream/40">إجمالي عمليات التوليد</p><p className="mt-2 text-3xl font-bold text-brand-gold">{loading ? '—' : totalGenerated}</p></div>
        <div className={`rounded-2xl border p-5 ${tone(failed, true)}`}><p className="text-xs opacity-70">عمليات توليد فاشلة</p><p className="mt-2 text-3xl font-bold">{loading ? '—' : failed}</p></div>
        <div className={`rounded-2xl border p-5 ${tone(socialPending)}`}><p className="text-xs opacity-70">طابور النشر الجاري</p><p className="mt-2 text-3xl font-bold">{loading ? '—' : socialPending}</p></div>
        <div className="rounded-2xl border border-brand-gold/15 bg-black/20 p-5"><p className="text-xs text-brand-cream/40">الأقسام المفعلة</p><p className="mt-2 text-3xl font-bold text-brand-gold">{loading ? '—' : `${data?.sections?.enabled ?? 0}/${data?.sections?.total ?? 0}`}</p></div>
      </section>

      <section className="rounded-3xl border border-red-500/20 bg-red-500/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-brand-cream">تنظيف عمليات التوليد الفاشلة</h2>
            <p className="mt-1 text-sm text-brand-cream/50">الحذف مسموح للعمليات التي حالتها failed فقط، ولا يمكن حذف pending أو processing أو completed من هذا الإجراء.</p>
          </div>
          <button type="button" disabled={!failed || deletingFailed} onClick={() => void deleteFailed()} className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-40">{deletingFailed ? 'جاري الحذف…' : `حذف الفاشلة (${failed})`}</button>
        </div>
      </section>

      <section>
        <div className="mb-4"><h2 className="text-xl font-bold text-brand-gold">أدوات الإدارة</h2><p className="mt-1 text-sm text-brand-cream/40">وصول مباشر لكل وحدات الإدارة الحالية.</p></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {MANAGEMENT_LINKS.map(([title, href, description]) => (
            <Link key={href} href={href} className="group rounded-2xl border border-brand-gold/12 bg-black/15 p-5 transition hover:-translate-y-0.5 hover:border-brand-gold/30 hover:bg-black/25">
              <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-brand-cream group-hover:text-brand-gold">{title}</h3><span className="text-xs text-brand-gold/40">فتح ←</span></div>
              <p className="mt-2 text-sm leading-6 text-brand-cream/45">{description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-brand-gold">جرد قاعدة المحتوى</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data?.counts ?? {}).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4"><p className="text-xs text-brand-cream/40">{value.label}</p><p className="mt-1 text-xl font-bold text-brand-cream">{value.count.toLocaleString('ar-EG')}</p></div>
          ))}
        </div>
      </section>

      {data?.generatedAt && <p className="text-center text-xs text-brand-cream/25">آخر تحديث: {new Date(data.generatedAt).toLocaleString('ar-EG')}</p>}
    </div>
  );
}
