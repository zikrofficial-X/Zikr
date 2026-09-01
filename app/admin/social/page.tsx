export const dynamic = "force-dynamic";

import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import type { SocialPublishQueueItem } from "@/lib/services/social-publishing";

const statusLabels: Record<string, string> = {
  queued: "في الانتظار",
  processing: "قيد المعالجة",
  published: "نُشر",
  partial: "نشر جزئي",
  failed: "فشل",
};

const statusClasses: Record<Status, string> = {
  queued: 'border-sky-500/25 bg-sky-500/10 text-sky-300',
  processing: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  published: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  partial: 'border-yellow-500/25 bg-yellow-500/10 text-yellow-300',
  failed: 'border-red-500/25 bg-red-500/10 text-red-300',
};

export default function AdminSocialPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/social', { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as {
        items?: QueueItem[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'تعذر تحميل طابور النشر.');
      }
      setItems(Array.isArray(payload.items) ? payload.items : []);
      setSelected([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل طابور النشر.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  );

  const failed = items.filter((item) => item.status === 'failed');
  const selectableFiltered = filtered.filter((item) => item.status === 'failed');
  const allSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((item) => selected.includes(item.id));

  function toggleSelect(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function toggleAll() {
    if (allSelected) {
      const visibleIds = new Set(selectableFiltered.map((item) => item.id));
      setSelected((current) => current.filter((id) => !visibleIds.has(id)));
      return;
    }

    setSelected((current) => [
      ...new Set([...current, ...selectableFiltered.map((item) => item.id)]),
    ]);
  }

  async function runAction(action: 'retry' | 'delete' | 'delete_failed') {
    if (action !== 'retry') {
      const text =
        action === 'delete_failed'
          ? `سيتم حذف ${failed.length} عملية فاشلة نهائيًا.`
          : 'سيتم حذف العمليات الفاشلة المحددة نهائيًا.';
      if (!window.confirm(text)) return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selected }),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'تعذر تنفيذ الإجراء.');
      }
      setMessage('تم تنفيذ الإجراء بنجاح.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تنفيذ الإجراء.');
    } finally {
      setBusy(false);
    }
  }

  const counts = items.reduce<Record<string, number>>((accumulator, item) => {
    accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <Container className="space-y-8 py-10 text-right">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-brand-gold">النشر التلقائي</h1>
            <p className="text-sm text-brand-cream/60" dir="rtl">
              متابعة طابور نشر البوستات والفيديوهات على الموقع وفيسبوك ويوتيوب.
            </p>
          </div>
          <Link
            href="/admin/social/youtube-import"
            className="rounded-lg border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/20"
          >
            رفع فيديوهات YouTube القديمة
          </Link>
        </div>
      </section>

      {error && (
        <div
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
          role="status"
        >
          {message}
        </div>
      )}

      <section className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(filter === status ? 'all' : status)}
            className={`rounded-2xl border p-4 text-right ${
              filter === status
                ? 'border-brand-gold/40 bg-brand-gold/10'
                : 'border-brand-gold/10 bg-black/15'
            }`}
          >
            <p className="text-xs text-brand-cream/45">{labels[status]}</p>
            <p className="mt-1 text-2xl font-bold text-brand-gold">
              {counts[status] ?? 0}
            </p>
          </button>
        ))}
      </section>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-gold">الطابور</h2>
            <p className="text-xs text-brand-cream/40">
              الإجراءات الحاذفة مقصورة على العناصر الفاشلة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!selected.length || busy}
              onClick={() => void runAction('retry')}
            >
              إعادة المحاولة ({selected.length})
            </Button>
            <Button
              variant="outline"
              disabled={!selected.length || busy}
              onClick={() => void runAction('delete')}
            >
              حذف المحدد
            </Button>
            <Button
              variant="outline"
              disabled={!failed.length || busy}
              onClick={() => void runAction('delete_failed')}
            >
              حذف كل الفاشلة ({failed.length})
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-brand-gold/10 overflow-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-black/20 text-brand-cream/50">
              <tr>
                <th className="p-3 text-right">
                  <input
                    aria-label="تحديد العمليات الفاشلة الظاهرة"
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    disabled={!selectableFiltered.length || busy}
                  />
                </th>
                <th className="p-3 text-right">العنوان</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">المنصات</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">الموعد</th>
                <th className="p-3 text-right">الخطأ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gold/10">
              {filtered.map((item) => {
                const status = (STATUSES as readonly string[]).includes(item.status)
                  ? (item.status as Status)
                  : 'failed';
                return (
                  <tr key={item.id} className="align-top hover:bg-black/10">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        disabled={status !== 'failed' || busy}
                        onChange={() => toggleSelect(item.id)}
                        aria-label={`تحديد ${item.title}`}
                      />
                    </td>
                    <td className="p-3 text-brand-cream">{item.title}</td>
                    <td className="p-3 text-brand-cream/55">{item.content_type}</td>
                    <td className="p-3 text-brand-cream/55">
                      {item.target_platforms.join('، ')}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${statusClasses[status]}`}
                      >
                        {labels[status]}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-brand-cream/40" dir="ltr">
                      {item.scheduled_at ?? 'فوري'}
                    </td>
                    <td className="p-3 text-xs text-red-300/70">
                      {item.error_message ?? '—'}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-brand-cream/40">
                    لا توجد عناصر مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </Container>
  );
}
