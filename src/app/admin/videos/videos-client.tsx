"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { VideoGenerationRequest } from "@/features/videos/services/video-automation";

type Status = "pending" | "processing" | "retry_wait" | "completed" | "failed";

const STATUS_LABELS: Record<Status, string> = {
  pending: "قيد الانتظار",
  processing: "قيد المعالجة",
  completed: "مكتمل",
  retry_wait: "إعادة المحاولة لاحقًا",
  failed: "فشل",
};

const STATUS_CLASSES: Record<Status, string> = {
  pending: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  processing: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  completed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  retry_wait: "border-violet-500/25 bg-violet-500/10 text-violet-300",
  failed: "border-red-500/25 bg-red-500/10 text-red-300",
};

export default function AdminVideosClient() {
  const [requests, setRequests] = useState<VideoGenerationRequest[]>([]);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<VideoGenerationRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/videos", { cache: "no-store" });
      const data = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(data.error || "تعذر تحميل طابور الفيديو.");
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل طابور الفيديو.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      processing: requests.filter((r) => r.status === "processing").length,
      completed: requests.filter((r) => r.status === "completed").length,
      retry_wait: requests.filter((r) => r.status === "retry_wait").length,
      failed: requests.filter((r) => r.status === "failed").length,
    }),
    [requests],
  );

  const visible = filter === "all"
    ? requests
    : requests.filter((request) => request.status === filter);

  async function retry(id: string) {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/admin/videos/${encodeURIComponent(id)}/retry`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر إعادة المحاولة.");
      setMessage("تمت إعادة العملية إلى الطابور.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إعادة المحاولة.");
    } finally {
      setBusyId(null);
    }
  }

  async function openDetails(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/videos/${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر تحميل التفاصيل.");
      setDetails(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تحميل التفاصيل.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Container className="space-y-7 py-10 text-right" dir="rtl">
      <nav aria-label="تنقل استوديو الفيديو" className="sticky top-0 z-20 -mx-2 overflow-x-auto rounded-2xl border border-brand-gold/10 bg-brand-emeraldDeep/95 p-2 backdrop-blur">
        <div className="flex min-w-max items-center gap-2">
          <a href="#queue" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold">الطابور</a>
          <a href="#qa" className="rounded-xl border border-brand-gold/10 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/25 hover:text-brand-gold">ضبط الجودة</a>
          <a href="#templates" className="rounded-xl border border-brand-gold/10 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/25 hover:text-brand-gold">القوالب</a>
          <a href="#visuals" className="rounded-xl border border-brand-gold/10 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/25 hover:text-brand-gold">العناصر المرئية</a>
          <a href="#voices" className="rounded-xl border border-brand-gold/10 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/25 hover:text-brand-gold">الأصوات</a>
          <span className="mx-1 h-6 w-px bg-brand-gold/10" aria-hidden="true" />
          <Link href="/admin/ai-video" className="rounded-xl border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">استوديو الإنشاء</Link>
          <Link href="/admin/social" className="rounded-xl border border-brand-gold/10 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/25 hover:text-brand-gold">النشر الاجتماعي</Link>
          <Link href="/admin/automation" className="rounded-xl border border-brand-gold/10 px-4 py-2 text-sm text-brand-cream/65 hover:border-brand-gold/25 hover:text-brand-gold">التشغيل الآلي</Link>
        </div>
      </nav>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-brand-cream/30">طابور الفيديو</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-gold">طابور توليد الفيديو</h1>
          <p className="mt-2 text-sm leading-7 text-brand-cream/50">هذه الصفحة للمراقبة وإعادة المحاولة والتفاصيل فقط. إنشاء الطلبات موجود في استوديو الفيديو حتى لا تتكرر أدوات الإنشاء.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/ai-video" className="rounded-xl border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/20">استوديو إنشاء الفيديو</Link>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>تحديث</Button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">{message}</div>}

      <section id="queue" className="grid grid-cols-2 gap-3 md:grid-cols-6 scroll-mt-24">
        {(["all", "pending", "processing", "retry_wait", "completed", "failed"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`rounded-2xl border p-4 text-right transition ${filter === status ? "border-brand-gold/40 bg-brand-gold/10" : "border-brand-gold/10 bg-black/15"}`}
          >
            <span className="text-xs text-brand-cream/45">{status === "all" ? "إجمالي" : STATUS_LABELS[status]}</span>
            <span className="mt-1 block text-2xl font-bold text-brand-gold">{counts[status]}</span>
          </button>
        ))}
      </section>

      <section className="space-y-3">
        {loading && <Card className="p-8 text-center text-sm text-brand-cream/45">جاري تحميل الطابور…</Card>}
        {!loading && visible.length === 0 && (
          <Card className="p-10 text-center">
            <p className="font-semibold text-brand-cream/75">لا توجد عمليات مطابقة.</p>
            <p className="mt-2 text-sm text-brand-cream/40">أنشئ طلبًا من استوديو الفيديو أو انتظر التشغيل التلقائي.</p>
          </Card>
        )}

        {!loading && visible.map((request) => {
          const status = request.status as Status;
          return (
            <Card key={request.id} className="border-brand-gold/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-brand-gold">{request.title}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-xs ${STATUS_CLASSES[status] ?? STATUS_CLASSES.failed}`}>
                      {STATUS_LABELS[status] ?? request.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-brand-cream/55">{request.description || "بدون وصف"}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-cream/35">
                    <span>الفئة: {request.category}</span>
                    <span>{new Date(request.created_at).toLocaleString("ar-EG")}</span>
                    {request.video_url && <a href={request.video_url} target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">فتح الفيديو</a>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={busyId === request.id} onClick={() => void openDetails(request.id)}>التفاصيل</Button>
                  {request.status === "failed" && <Button variant="primary" disabled={busyId === request.id} onClick={() => void retry(request.id)}>{busyId === request.id ? "جاري التنفيذ…" : "إعادة المحاولة"}</Button>}
                </div>
              </div>
              {request.error_message && (
                <div className="mt-4 rounded-xl border border-red-500/15 bg-red-500/5 p-3 text-xs leading-6 text-red-200">
                  <div>{request.error_message}</div>
                  {request.error_details && <pre className="mt-2 whitespace-pre-wrap break-words text-red-200/70">{request.error_details}</pre>}
                </div>
              )}
            </Card>
          );
        })}
      </section>

      <section id="qa" className="grid gap-4 lg:grid-cols-2 scroll-mt-24">
        <Card className="border-brand-gold/10 p-5">
          <h2 className="text-lg font-bold text-brand-gold">ضبط الجودة</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/50">الـworker يرفض الفيديو قبل اكتماله إذا فشل أي فحص أساسي.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {["مطابقة النص مع المصدر", "وجود مسار صوتي", "التأكد من عدم صمت الصوت", "الدقة والترميز الصحيح", "صلاحية ملف MP4", "نجاح رفع التخزين"].map(item => (
              <div key={item} className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200/80">✓ {item}</div>
            ))}
          </div>
        </Card>
        <Card id="templates" className="border-brand-gold/10 p-5 scroll-mt-24">
          <h2 className="text-lg font-bold text-brand-gold">القوالب</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/50">القوالب الحالية المستخدمة في التصيير المحلي.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[["هادئ","calm.svg"],["فجر","dawn.svg"],["ليل","night.svg"],["ذهبي","gold.svg"]].map(([label,file]) => (
              <div key={file} className="rounded-xl border border-brand-gold/10 bg-black/15 p-3">
                <p className="font-semibold text-brand-cream/80">{label}</p>
                <p className="mt-1 font-mono text-[10px] text-brand-cream/25">{file}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card id="visuals" className="border-brand-gold/10 p-5 scroll-mt-24">
          <h2 className="text-lg font-bold text-brand-gold">العناصر المرئية</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/50">ترتيب مزودي المشاهد قبل السقوط إلى قالب FFmpeg الحتمي.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {["LTX السريع","Wan","ComfyUI","مزود مرئي مجاني","قالب FFmpeg"].map(item => (
              <span key={item} className="rounded-full border border-brand-gold/10 bg-black/15 px-3 py-1.5 text-xs text-brand-cream/70">{item}</span>
            ))}
          </div>
        </Card>
        <Card id="voices" className="border-brand-gold/10 p-5 scroll-mt-24">
          <h2 className="text-lg font-bold text-brand-gold">الأصوات</h2>
          <p className="mt-2 text-sm leading-7 text-brand-cream/50">أصوات السرد العربية الافتراضية داخل العامل.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {["العربية الفصحى — رجل — Hamed","العربية المصرية — رجل — Shakir"].map(item => (
              <div key={item} className="rounded-xl border border-brand-gold/10 bg-black/15 px-3 py-2 text-xs text-brand-cream/70">{item}</div>
            ))}
          </div>
        </Card>
      </section>

      {details && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-brand-gold">تفاصيل عملية التوليد</h2>
              <Button variant="outline" onClick={() => setDetails(null)}>إغلاق</Button>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
              <div><dt className="text-brand-cream/35">المعرف</dt><dd className="mt-1 break-all font-mono text-brand-cream/75">{details.id}</dd></div>
              <div><dt className="text-brand-cream/35">الحالة</dt><dd className="mt-1 text-brand-cream/75">{details.status}</dd></div>
              <div><dt className="text-brand-cream/35">العنوان</dt><dd className="mt-1 text-brand-cream/75">{details.title}</dd></div>
              <div><dt className="text-brand-cream/35">التصنيف</dt><dd className="mt-1 text-brand-cream/75">{details.category}</dd></div>
              <div><dt className="text-brand-cream/35">تاريخ الإنشاء</dt><dd className="mt-1 text-brand-cream/75">{new Date(details.created_at).toLocaleString("ar-EG")}</dd></div>
              <div><dt className="text-brand-cream/35">آخر تحديث</dt><dd className="mt-1 text-brand-cream/75">{new Date(details.updated_at).toLocaleString("ar-EG")}</dd></div>
            </dl>
            {details.video_url && <a href={details.video_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex rounded-xl border border-emerald-500/20 px-4 py-2 text-sm text-emerald-300">فتح الفيديو الناتج</a>}
            {details.content !== null && details.content !== undefined ? <pre className="mt-5 overflow-auto rounded-xl border border-brand-gold/10 bg-black/30 p-4 text-xs text-brand-cream/55">{JSON.stringify(details.content, null, 2)}</pre> : null}
          </Card>
        </div>
      )}
    </Container>
  );
}
