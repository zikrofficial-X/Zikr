'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/ui/container';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SocialPublishQueueItem, SocialQueueStatus } from '@/features/social/services/social-publishing';

type Status = SocialQueueStatus;
type QueueItem = SocialPublishQueueItem;
type Health = { youtubeConfigured: boolean; facebookEnabled: boolean; facebookCredentialsConfigured: boolean; facebookAuthBlocked: number };

const STATUS_ORDER: readonly Status[] = ['queued', 'processing', 'published', 'partial', 'failed'];
const STATUS_LABELS: Record<Status, string> = { queued: 'في الانتظار', processing: 'قيد المعالجة', published: 'نُشر', partial: 'نشر جزئي', failed: 'فشل' };
const STATUS_CLASSES: Record<Status, string> = {
  queued: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
  processing: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  published: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  partial: 'border-yellow-500/25 bg-yellow-500/10 text-yellow-300',
  failed: 'border-red-500/25 bg-red-500/10 text-red-300',
};

export default function AdminSocialPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [health, setHealth] = useState<Health>({ youtubeConfigured: false, facebookEnabled: false, facebookCredentialsConfigured: false, facebookAuthBlocked: 0 });
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/admin/social', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as { items?: QueueItem[]; health?: Health; error?: string };
      if (!response.ok) throw new Error(payload.error || 'تعذر تحميل طابور النشر.');
      setItems(Array.isArray(payload.items) ? payload.items : []);
      if (payload.health) setHealth(payload.health);
      setSelected([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل طابور النشر.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => filter === 'all' ? items : items.filter((item) => item.status === filter), [filter, items]);
  const retryable = items.filter((item) => item.status === 'failed' || item.status === 'partial');
  const selectedRetryableCount = selected.filter((id) => retryable.some((item) => item.id === id)).length;
  const visibleRetryable = filtered.filter((item) => item.status === 'failed' || item.status === 'partial');
  const allVisibleRetryableSelected = visibleRetryable.length > 0 && visibleRetryable.every((item) => selected.includes(item.id));

  const runAction = useCallback(async (action: 'retry' | 'retry_all_failed' | 'delete' | 'delete_failed') => {
    if (action !== 'retry' && !window.confirm(action === 'delete_failed' ? `سيتم حذف ${retryable.length} عملية فاشلة أو نشر جزئي نهائيًا.` : 'سيتم حذف العمليات الفاشلة أو الجزئية المحددة نهائيًا.')) return;
    const ids = action === 'retry_all_failed' || action === 'delete_failed' ? [] : selected;
    if ((action === 'retry' || action === 'delete') && ids.length === 0) { setError('حدد عملية فاشلة أو نشرًا جزئيًا أولًا.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await fetch('/api/admin/social', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ids }) });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; affected?: number };
      if (!response.ok) throw new Error(payload.error || 'تعذر تنفيذ الإجراء.');
      setMessage(`تم تنفيذ الإجراء بنجاح${typeof payload.affected === 'number' ? ` (${payload.affected})` : ''}.`);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر تنفيذ الإجراء.'); }
    finally { setBusy(false); }
  }, [load, retryable.length, selected]);

  function toggleVisibleRetryable() {
    const ids = visibleRetryable.map((item) => item.id);
    setSelected((current) => allVisibleRetryableSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  }

  return (
    <Container className="space-y-6 py-10 text-right">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-3xl font-bold text-brand-gold">مركز النشر</h1><p className="mt-1 text-sm text-brand-cream/60">إدارة YouTube وFacebook من مكان واحد، بأقل عدد من الخطوات.</p></div>
        <div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={() => void load()}>تحديث</Button></div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <Card>
          <div className="text-xs text-brand-cream/50">YouTube</div>
          <div className="mt-1 font-semibold">{health.youtubeConfigured ? 'جاهز للنشر' : 'بيانات OAuth غير مكتملة'}</div>
        </Card>
        <Card>
          <div className="text-xs text-brand-cream/50">Facebook</div>
          <div className="mt-1 font-semibold">
            {!health.facebookCredentialsConfigured
              ? 'يحتاج إعداد الاعتماد'
              : !health.facebookEnabled
                ? 'معطّل من إعدادات النشر'
                : 'مفعّل ومهيأ للنشر'}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-brand-cream/50">سجلات فشل اعتماد Facebook السابقة</div>
          <div className="mt-1 font-semibold">{health.facebookAuthBlocked}</div>
        </Card>
      </section>

      {health.facebookAuthBlocked > 0 && <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-200">تم تسجيل {health.facebookAuthBlocked} عنصرًا سابقًا بفشل اعتماد Facebook. هذا العداد تاريخي للعناصر الموجودة في الطابور، ولا يعني أن اعتماد Facebook الحالي منتهي. {health.facebookCredentialsConfigured && health.facebookEnabled ? 'إعداد Facebook الحالي ما زال مفعّلًا ومهيأً للنشر.' : !health.facebookCredentialsConfigured ? 'تحقق من بيانات Page ID وPage Access Token الحالية.' : 'تحقق من مفتاح التشغيل الحالي للنشر الاجتماعي.'}</div>}
      {error && <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}

      <section className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {STATUS_ORDER.map((status) => <button key={status} type="button" onClick={() => setFilter(filter === status ? 'all' : status)} className={`rounded-2xl border p-4 text-right ${filter === status ? 'border-brand-gold/40 bg-brand-gold/10' : 'border-brand-gold/10 bg-black/15'}`}><div className="text-xs text-brand-cream/50">{STATUS_LABELS[status]}</div><div className="mt-1 text-2xl font-bold text-brand-gold">{items.filter((item) => item.status === status).length}</div></button>)}
      </section>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-brand-gold">الإجراءات السريعة</h2><p className="text-xs text-brand-cream/40">العمليات المحجوبة بسبب Facebook لا تعود تلقائيًا إلى دورة إعادة المحاولة.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!retryable.length || busy} onClick={() => void runAction('retry_all_failed')}>إعادة محاولة الفاشلة/الجزئية ({retryable.length})</Button><Button variant="outline" disabled={!selectedRetryableCount || busy} onClick={() => void runAction('retry')}>إعادة المحدد ({selectedRetryableCount})</Button><Button variant="outline" disabled={!retryable.length || busy} onClick={() => void runAction('delete_failed')}>حذف الفاشلة/الجزئية ({retryable.length})</Button></div></div>
        <div className="overflow-auto rounded-xl border border-brand-gold/10"><table className="min-w-[900px] w-full text-sm"><thead className="bg-black/20 text-brand-cream/50"><tr><th className="p-3 text-right"><input type="checkbox" checked={allVisibleRetryableSelected} onChange={toggleVisibleRetryable} disabled={!visibleRetryable.length || busy} aria-label="تحديد الفاشلة والنشر الجزئي الظاهر" /></th><th className="p-3 text-right">العنوان</th><th className="p-3 text-right">النوع</th><th className="p-3 text-right">المنصات</th><th className="p-3 text-right">الحالة</th><th className="p-3 text-right">الموعد</th><th className="p-3 text-right">الخطأ</th></tr></thead><tbody className="divide-y divide-brand-gold/10">
          {filtered.map((item) => { const status = STATUS_ORDER.includes(item.status as Status) ? item.status as Status : 'failed'; const selectable = status === 'failed' || status === 'partial'; return <tr key={item.id} className="align-top hover:bg-black/10"><td className="p-3"><input type="checkbox" checked={selected.includes(item.id)} disabled={!selectable || busy} onChange={() => setSelected((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} aria-label={`تحديد ${item.title}`} /></td><td className="p-3 text-brand-cream">{item.title}</td><td className="p-3 text-brand-cream/55">{item.content_type}</td><td className="p-3 text-brand-cream/55">{item.target_platforms.join('، ')}</td><td className="p-3"><span className={`rounded-full border px-2 py-1 text-xs ${STATUS_CLASSES[status]}`}>{STATUS_LABELS[status]}</span></td><td className="p-3 text-xs text-brand-cream/40" dir="ltr">{item.scheduled_at ?? 'فوري'}</td><td className="p-3 text-xs text-red-300/70">{item.error_message ?? '—'}</td></tr>; })}
          {!loading && filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-brand-cream/40">لا توجد عناصر مطابقة.</td></tr>}
        </tbody></table></div>
      </Card>
    </Container>
  );
}
