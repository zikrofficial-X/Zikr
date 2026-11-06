"use client";

import { useEffect, useState } from "react";

const CONFIRMATION_PHRASE = "امسح كل الفيديوهات";

type PurgeResult = {
  ok: true;
  cloudinaryAssetsDeleted: number;
  cloudinaryBytesDeleted: number;
  storageObjectsDeleted: number;
  queueRowsDeleted: number;
  siteVideoRowsDeleted: number;
  generationRowsDeleted: number;
  automationRunsDeleted: number;
  externalSocialPostsDeleted: false;
};

export function PurgeGeneratedVideosControl({
  onCompleted,
}: {
  onCompleted?: () => void | Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PurgeResult | null>(null);
  const [authorized, setAuthorized] = useState(false);

  async function purge() {
    if (confirmation !== CONFIRMATION_PHRASE || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/video-purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation }),
      });
      const payload = await response.json().catch(() => ({})) as {
        error?: string;
        paused?: boolean;
        ok?: boolean;
        cloudinaryAssetsDeleted?: number;
        cloudinaryBytesDeleted?: number;
        storageObjectsDeleted?: number;
        queueRowsDeleted?: number;
        siteVideoRowsDeleted?: number;
        generationRowsDeleted?: number;
        automationRunsDeleted?: number;
        externalSocialPostsDeleted?: false;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.error ||
          (payload.paused
            ? "تم إيقاف التوليد والنشر مؤقتًا. أعد المحاولة بعد انتهاء العامل الحالي."
            : "تعذر تصفير مكتبة الفيديو."),
        );
      }
      const completed: PurgeResult = {
        ok: true,
        cloudinaryAssetsDeleted: payload.cloudinaryAssetsDeleted ?? 0,
        cloudinaryBytesDeleted: payload.cloudinaryBytesDeleted ?? 0,
        storageObjectsDeleted: payload.storageObjectsDeleted ?? 0,
        queueRowsDeleted: payload.queueRowsDeleted ?? 0,
        siteVideoRowsDeleted: payload.siteVideoRowsDeleted ?? 0,
        generationRowsDeleted: payload.generationRowsDeleted ?? 0,
        automationRunsDeleted: payload.automationRunsDeleted ?? 0,
        externalSocialPostsDeleted: false,
      };
      setResult(completed);
      setConfirmation("");
      setExpanded(false);
      setMessage("تم حذف مخرجات الفيديو المحلية وسجلاتها. التوليد التلقائي ما زال متوقفًا.");
      await onCompleted?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تصفير مكتبة الفيديو.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="w-full rounded-2xl border border-red-500/25 bg-red-950/15 p-3 text-right sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-200">تصفير مكتبة الفيديوهات</p>
          <p className="mt-1 text-xs leading-6 text-brand-cream/55">
            حذف ملفات الفيديو المولّدة من Cloudinary وSupabase Storage، ومسح سجلات التوليد وطابور الفيديو وصفحة الفيديوهات.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setExpanded(value => !value);
            setError("");
            setMessage("");
          }}
          className="shrink-0 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {expanded ? "إغلاق التصفير" : "مسح كل الفيديوهات"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-red-400/15 pt-4">
          <p className="text-sm leading-7 text-brand-cream/80">
            هذا الإجراء نهائي ولا يمكن التراجع عنه. سيحذف كل فيديو مولّد يحمل علامات ZIKR الخاصة بالتوليد، وكل عمليات التوليد وطابور الفيديو وسجلات تشغيله، وسيترك المنشورات النصية والأصوات والقوالب وإعدادات الاتصال كما هي.
          </p>
          <p className="text-xs leading-6 text-amber-200/90">
            ملاحظة: هذا يمسح النسخ المحلية من ZIKR فقط. الفيديوهات المنشورة بالفعل داخل حسابات YouTube وFacebook ستظل منشورة هناك؛ حذفها من الحسابات الخارجية ليس ضمن هذه العملية.
          </p>
          <label className="block space-y-2">
            <span className="text-xs text-brand-cream/60">
              اكتب العبارة حرفيًا لتأكيد الحذف: <span className="font-bold text-red-200">{CONFIRMATION_PHRASE}</span>
            </span>
            <input
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
              disabled={busy}
              autoComplete="off"
              spellCheck={false}
              placeholder={CONFIRMATION_PHRASE}
              className="w-full rounded-xl border border-red-400/25 bg-black/30 px-3 py-3 text-sm text-brand-cream outline-none focus:border-red-300/60"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || confirmation !== CONFIRMATION_PHRASE}
              onClick={() => void purge()}
              className="rounded-xl border border-red-400/45 bg-red-600/20 px-4 py-3 text-sm font-bold text-red-100 hover:bg-red-600/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "جارٍ الحذف والتحقق…" : "تأكيد الحذف النهائي"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setExpanded(false);
                setConfirmation("");
              }}
              className="rounded-xl border border-brand-gold/15 px-4 py-3 text-sm text-brand-cream/65 hover:bg-white/5 disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {busy && (
        <p role="status" className="mt-3 text-xs text-amber-200">
          التوليد والنشر محجوزان أثناء التصفير. لا تغلق الصفحة قبل ظهور نتيجة العملية.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs leading-6 text-red-100">
          {error}
        </p>
      )}
      {message && result && (
        <div role="status" className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs leading-6 text-emerald-100">
          <p className="font-semibold">{message}</p>
          <p className="mt-1">
            ملفات Cloudinary: {result.cloudinaryAssetsDeleted} · المساحة المحررة: {(result.cloudinaryBytesDeleted / (1024 * 1024)).toFixed(1)} MiB · عناصر Storage: {result.storageObjectsDeleted}
          </p>
          <p>
            طلبات التوليد: {result.generationRowsDeleted} · عناصر طابور الفيديو: {result.queueRowsDeleted} · فيديوهات الصفحة: {result.siteVideoRowsDeleted} · سجلات التشغيل: {result.automationRunsDeleted}
          </p>
          <p className="mt-1 text-amber-100/90">
            لم يتم حذف المنشورات من حسابات YouTube أو Facebook نفسها.
          </p>
        </div>
      )}
    </section>
  );
}
