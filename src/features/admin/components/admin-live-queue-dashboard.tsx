"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Clock3, LoaderCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";

type StatusMap = Record<string, number>;
type LiveOverview = {
  generatedAt: string;
  unavailable: string[];
  videoGeneration: StatusMap;
  socialQueue: StatusMap;
};

type QueueCardProps = {
  title: string;
  subtitle: string;
  statuses: Array<{ key: string; label: string; value: number; tone: "neutral" | "info" | "warning" | "danger" }>;
  available: boolean;
};

function isLiveOverview(payload: LiveOverview | { error?: string } | null): payload is LiveOverview {
  return Boolean(payload && "generatedAt" in payload && "videoGeneration" in payload && "socialQueue" in payload);
}

const toneClasses = {
  neutral: "border-brand-gold/10 bg-black/15 text-brand-cream",
  info: "border-sky-400/20 bg-sky-400/[0.06] text-sky-100",
  warning: "border-amber-400/20 bg-amber-400/[0.06] text-amber-100",
  danger: "border-red-400/25 bg-red-400/[0.08] text-red-100",
} as const;

function formatNumber(value: number) {
  return value.toLocaleString("ar-EG-u-nu-latn");
}

function QueueCard({ title, subtitle, statuses, available }: QueueCardProps) {
  const total = statuses.reduce((sum, status) => sum + status.value, 0);
  const active = statuses.filter((status) => status.value > 0);
  const failed = statuses.find((status) => status.tone === "danger")?.value ?? 0;

  return (
    <article className="rounded-2xl border border-brand-gold/10 bg-black/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-brand-cream">{title}</h3>
          <p className="mt-1 text-xs text-brand-cream/40">{subtitle}</p>
        </div>
        <div className="text-left">
          <p className="text-2xl font-bold tabular-nums text-brand-gold">{available ? formatNumber(total) : "—"}</p>
          <p className="text-[10px] text-brand-cream/35">إجمالي العناصر</p>
        </div>
      </div>

      {!available ? (
        <div role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-6 text-amber-100/80">
          <WifiOff size={15} /> تعذر قراءة هذا الطابور حالياً. لا تعرض اللوحة صفراً افتراضياً.
        </div>
      ) : (
        <>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-white/5" aria-label="توزيع حالات الطابور">
            {statuses.map((status) => (
              <span
                key={status.key}
                className={status.tone === "danger" ? "bg-red-400" : status.tone === "warning" ? "bg-amber-300" : status.tone === "info" ? "bg-sky-300" : "bg-brand-gold/70"}
                style={{ width: total > 0 ? `${(status.value / total) * 100}%` : "0%" }}
                title={`${status.label}: ${formatNumber(status.value)}`}
              />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {statuses.map((status) => (
              <div key={status.key} className={`rounded-xl border px-2.5 py-2 ${toneClasses[status.tone]}`}>
                <p className="text-[10px] opacity-60">{status.label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{formatNumber(status.value)}</p>
              </div>
            ))}
          </div>
          <p className={`mt-3 flex items-center gap-1.5 text-xs ${failed > 0 ? "text-red-200" : "text-emerald-200/75"}`}>
            {failed > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {failed > 0 ? `${formatNumber(failed)} عنصر يحتاج إلى تدخل` : active.length > 0 ? "الطابور يعمل دون فشل مسجل" : "لا توجد عناصر قيد المعالجة"}
          </p>
        </>
      )}
    </article>
  );
}

export function AdminLiveQueueDashboard() {
  const [data, setData] = useState<LiveOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchAt, setLastFetchAt] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store", headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => null) as LiveOverview | { error?: string } | null;
      if (!response.ok || !isLiveOverview(payload)) throw new Error(payload && "error" in payload ? payload.error : "تعذر تحديث حالة الطوابير.");
      setData(payload);
      setError(null);
      setLastFetchAt(new Date().toISOString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحديث حالة الطوابير.");
    } finally {
      setLoading(false);
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const queues = useMemo(() => {
    const unavailable = new Set(data?.unavailable ?? []);
    return {
      video: {
        available: Boolean(data) && !unavailable.has("video_generation_requests"),
        statuses: [
          { key: "pending", label: "انتظار", value: data?.videoGeneration.pending ?? 0, tone: "neutral" as const },
          { key: "processing", label: "معالجة", value: data?.videoGeneration.processing ?? 0, tone: "info" as const },
          { key: "retry_wait", label: "إعادة", value: data?.videoGeneration.retry_wait ?? 0, tone: "warning" as const },
          { key: "failed", label: "فشل", value: data?.videoGeneration.failed ?? 0, tone: "danger" as const },
        ],
      },
      social: {
        available: Boolean(data) && !unavailable.has("social_publish_queue"),
        statuses: [
          { key: "queued", label: "انتظار", value: data?.socialQueue.queued ?? 0, tone: "neutral" as const },
          { key: "processing", label: "معالجة", value: data?.socialQueue.processing ?? 0, tone: "info" as const },
          { key: "partial", label: "جزئي", value: data?.socialQueue.partial ?? 0, tone: "warning" as const },
          { key: "failed", label: "فشل", value: data?.socialQueue.failed ?? 0, tone: "danger" as const },
        ],
      },
    };
  }, [data]);

  const shownAt = data?.generatedAt ?? lastFetchAt;

  return (
    <section aria-labelledby="live-queue-dashboard-heading" className="space-y-4 rounded-3xl border border-sky-400/15 bg-gradient-to-br from-sky-400/[0.07] via-black/15 to-black/5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${error ? "bg-amber-300" : loading ? "animate-pulse bg-sky-300" : "bg-emerald-300"}`} />
            <p className="text-xs tracking-[0.18em] text-sky-200/65">LIVE OPERATIONS</p>
          </div>
          <h2 id="live-queue-dashboard-heading" className="mt-2 text-xl font-bold text-brand-cream">مراقبة حية للطوابير</h2>
          <p className="mt-1 text-sm leading-6 text-brand-cream/45">تحديث تلقائي كل 15 ثانية عند بقاء صفحة الإدارة مفتوحة.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs ${error ? "border-amber-400/25 text-amber-100" : "border-emerald-400/20 text-emerald-100/80"}`}>
            {error ? <WifiOff size={13} /> : <Wifi size={13} />}
            {error ? "تحديث متعثر" : "متصل"}
          </span>
          <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex items-center gap-1.5 rounded-xl border border-brand-gold/20 px-3 py-2 text-xs text-brand-gold transition hover:bg-brand-gold/10 disabled:cursor-wait disabled:opacity-60">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> تحديث الآن
          </button>
        </div>
      </div>

      {error ? <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs leading-6 text-amber-100/80"><AlertTriangle size={15} className="mt-1 shrink-0" /> {error} سيتم إعادة المحاولة تلقائياً.</div> : null}
      {loading && !data ? <div className="flex items-center gap-2 rounded-xl border border-brand-gold/10 bg-black/15 p-5 text-sm text-brand-cream/55"><LoaderCircle size={17} className="animate-spin" /> جارٍ تحميل حالة الطوابير…</div> : null}

      {data ? (
        <div className="grid gap-3 xl:grid-cols-2">
          <QueueCard title="طابور توليد الفيديو" subtitle="الطلبات pending وprocessing وretry_wait وfailed" statuses={queues.video.statuses} available={queues.video.available} />
          <QueueCard title="طابور النشر الاجتماعي" subtitle="العناصر queued وprocessing وpartial وfailed" statuses={queues.social.statuses} available={queues.social.available} />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-brand-gold/10 pt-3 text-[11px] text-brand-cream/35">
        <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> آخر قراءة: {shownAt ? new Date(shownAt).toLocaleTimeString("ar-EG-u-nu-latn") : "—"}</span>
        <span className="inline-flex items-center gap-1.5"><Activity size={13} /> المصدر: API إداري محمي</span>
      </div>
    </section>
  );
}
