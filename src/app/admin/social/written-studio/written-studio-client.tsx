"use client";

import { useCallback, useEffect, useState } from "react";

type WrittenPost = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  created_at: string;
  published_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
};

const CATEGORY_OPTIONS = [
  { value: "auto", label: "تنوع تلقائي" },
  { value: "quran", label: "القرآن الكريم" },
  { value: "hadith", label: "الحديث النبوي" },
  { value: "dua", label: "الأدعية" },
  { value: "adhkar", label: "الأذكار — لا توجد مصادر معتمدة حاليًا", disabled: true },
  { value: "story", label: "القصص الإسلامية" },
  { value: "prophets", label: "قصص الأنبياء" },
  { value: "companions", label: "قصص الصحابة" },
  { value: "knowledge", label: "المقالات والمعرفة" },
  { value: "kids", label: "قصص الأطفال المعتمدة" },
] as const;

const STATUS_LABELS: Record<string, string> = {
  queued: "في انتظار النشر",
  processing: "جارٍ النشر",
  published: "نُشر على فيسبوك",
  partial: "نشر جزئي",
  failed: "فشل النشر",
};

const STATUS_STYLES: Record<string, string> = {
  queued: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  processing: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  published: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  partial: "border-orange-400/25 bg-orange-400/10 text-orange-200",
  failed: "border-red-400/25 bg-red-400/10 text-red-200",
};

function facebookPostUrl(metadata: Record<string, unknown> | null): string | null {
  const value = metadata?.platformResults;
  const result = Array.isArray(value)
    ? value.find((item) => item && typeof item === "object" && (item as Record<string, unknown>).platform === "facebook")
    : value && typeof value === "object"
      ? (value as Record<string, unknown>).facebook
      : null;

  if (!result || typeof result !== "object") return null;
  const row = result as Record<string, unknown>;
  if (typeof row.url === "string") {
    try {
      const url = new URL(row.url);
      if (
        url.protocol === "https:" &&
        (url.hostname === "facebook.com" || url.hostname.endsWith(".facebook.com"))
      ) {
        return url.toString();
      }
    } catch {
      // Ignore malformed or untrusted provider URLs; a validated remote ID may still be available.
    }
  }

  const remoteId = typeof row.remoteId === "string" ? row.remoteId : "";
  return /^[0-9_]{8,128}$/.test(remoteId) ? "https://www.facebook.com/" + remoteId : null;
}

function formatDate(value: string | null): string {
  if (!value) return "غير متاح";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "غير متاح" : date.toLocaleString("ar-EG-u-nu-latn");
}

function countStatus(items: WrittenPost[], status: string): number {
  return items.filter((item) => item.status === status).length;
}

export default function WrittenStudioClient() {
  const [category, setCategory] = useState("auto");
  const [batch, setBatch] = useState("1");
  const [items, setItems] = useState<WrittenPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/social/written", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل المنشورات المكتوبة.");
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل المنشورات المكتوبة.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setSending(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/social/written", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, batchSize: Number(batch) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تشغيل مولّد المنشورات.");

      setNotice(data.message || "تم إرسال طلب التوليد. ستظهر المنشورات في الطابور بعد اكتمال التحقق.");
      await load();
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "تعذر تشغيل مولّد المنشورات.");
    } finally {
      setSending(false);
    }
  }

  const publishedCount = countStatus(items, "published");
  const queuedCount = countStatus(items, "queued") + countStatus(items, "processing");
  const failedCount = countStatus(items, "failed") + countStatus(items, "partial");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 px-4 py-8 text-right" dir="rtl">
      <header className="space-y-3 rounded-3xl border border-brand-gold/15 bg-gradient-to-br from-brand-gold/10 via-black/20 to-black/5 p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand-cream/45">SOCIAL / WRITTEN CONTENT</p>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-gold md:text-3xl">مصنع المنشورات المكتوبة</h1>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-brand-cream/60">
              إنشاء منشورات مستقلة عن الفيديوهات من مصادر منشورة ومعتمدة، ثم إضافتها إلى طابور ناشر Facebook الحالي.
            </p>
          </div>
          <span className="rounded-full border border-brand-gold/20 bg-black/20 px-3 py-1.5 text-xs text-brand-gold">
            منشورات نصية فقط
          </span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-brand-gold/10 bg-black/15 p-4">
          <p className="text-xs text-brand-cream/45">منشورات معروضة</p>
          <p className="mt-2 text-3xl font-bold text-brand-gold">{loading ? "—" : items.length}</p>
          <p className="mt-1 text-xs text-brand-cream/35">آخر 100 منشور مكتوب</p>
        </article>
        <article className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
          <p className="text-xs text-brand-cream/45">تم نشرها</p>
          <p className="mt-2 text-3xl font-bold text-emerald-200">{loading ? "—" : publishedCount}</p>
          <p className="mt-1 text-xs text-brand-cream/35">حالة الطابور: published</p>
        </article>
        <article className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
          <p className="text-xs text-brand-cream/45">قيد الانتظار أو تحتاج متابعة</p>
          <p className="mt-2 text-3xl font-bold text-amber-200">{loading ? "—" : queuedCount + failedCount}</p>
          <p className="mt-1 text-xs text-brand-cream/35">انتظار ومعالجة وفشل أو نشر جزئي</p>
        </article>
      </section>

      <section className="space-y-5 rounded-2xl border border-brand-gold/15 bg-black/15 p-5 md:p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-brand-gold">إنشاء دفعة جديدة</h2>
          <p className="text-sm leading-6 text-brand-cream/50">
            الطلب يطلق مهمة التوليد فقط؛ النشر يتم عبر العامل والطابور بعد التحقق من المصدر وسياسة النشر.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-end">
          <label className="block space-y-2 text-sm font-medium text-brand-cream/80">
            <span>تصنيف المحتوى</span>
            <select
              className="w-full rounded-xl border border-brand-gold/20 bg-brand-emeraldDeep px-3 py-3 text-brand-cream focus:border-brand-gold focus:outline-none"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              disabled={sending}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} disabled={"disabled" in option && option.disabled}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-medium text-brand-cream/80">
            <span>عدد المنشورات</span>
            <select
              className="w-full rounded-xl border border-brand-gold/20 bg-brand-emeraldDeep px-3 py-3 text-brand-cream focus:border-brand-gold focus:outline-none"
              value={batch}
              onChange={(event) => setBatch(event.target.value)}
              disabled={sending}
            >
              <option value="1">منشور واحد</option>
              <option value="2">منشوران</option>
              <option value="3">ثلاثة منشورات</option>
            </select>
          </label>
          <button
            type="button"
            disabled={sending || loading}
            onClick={() => void generate()}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-gold px-5 py-3 text-sm font-bold text-brand-emeraldDeep transition hover:bg-brand-goldSoft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sending ? "جارٍ إرسال طلب التوليد..." : "إنشاء المنشورات"}
          </button>
        </div>
      </section>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-emerald-100">
          {notice}
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-gold">سجل المنشورات</h2>
            <p className="mt-1 text-xs text-brand-cream/40">المحتوى والحالة وروابط المنشورات المنشورة على Facebook.</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-xl border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold transition hover:bg-brand-gold/10 disabled:opacity-50"
          >
            {loading ? "جارٍ التحديث..." : "تحديث السجل"}
          </button>
        </div>

        {loading ? (
          <div role="status" className="rounded-2xl border border-brand-gold/10 bg-black/15 p-8 text-center text-sm text-brand-cream/55">
            جارٍ تحميل المنشورات المكتوبة...
          </div>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((item) => {
              const postUrl = facebookPostUrl(item.metadata);
              const statusStyle = STATUS_STYLES[item.status] ?? "border-brand-gold/15 bg-black/15 text-brand-cream/60";
              return (
                <article key={item.id} className="space-y-3 rounded-2xl border border-brand-gold/10 bg-black/15 p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold leading-7 text-brand-cream">{item.title}</h3>
                      <p className="mt-1 text-xs text-brand-cream/40">تاريخ الإنشاء: {formatDate(item.created_at)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${statusStyle}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </div>

                  {item.body ? (
                    <details className="rounded-xl border border-brand-gold/10 bg-black/15 p-3">
                      <summary className="cursor-pointer text-sm font-medium text-brand-gold">معاينة نص المنشور</summary>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-brand-cream/75">{item.body}</p>
                    </details>
                  ) : null}

                  {item.error_message ? (
                    <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm leading-6 text-red-200">
                      {item.error_message}
                    </p>
                  ) : null}

                  {item.published_at ? (
                    <p className="text-xs text-emerald-200/70">تاريخ النشر: {formatDate(item.published_at)}</p>
                  ) : null}

                  {postUrl ? (
                    <a
                      href={postUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-lg border border-brand-gold/20 px-3 py-2 text-sm font-medium text-brand-gold transition hover:bg-brand-gold/10"
                    >
                      عرض المنشور على Facebook ↗
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-brand-gold/20 bg-black/10 p-8 text-center">
            <h3 className="font-semibold text-brand-cream/80">لا توجد منشورات مكتوبة بعد</h3>
            <p className="mt-2 text-sm leading-6 text-brand-cream/45">
              بعد إنشاء أول دفعة، ستظهر هنا حالة كل منشور ومعاينته ورابطه عند نجاح النشر.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
