"use client";

import { useEffect, useState } from "react";
import { redirectToAdminStepUp } from "@/features/admin/utils/step-up-client";

const CONFIRMATION_PHRASE = "امسح الفيديوهات المولّدة فقط";
type PurgeScope = "files" | "memory" | "both";

type PurgeResult = {
  ok: true;
  scope: PurgeScope;
  automationResumed: boolean;
  cloudinaryAssetsDeleted: number;
  cloudinaryBytesDeleted: number;
  storageObjectsDeleted: number;
  socialQueueRowsPreserved: boolean;
  publicVideoCatalogPreserved: boolean;
  manualPublicVideoCatalogPreserved: boolean;
  generatedCatalogRecordsHidden: number;
  catalogRecordsHidden: number;
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
  const [scope, setScope] = useState<PurgeScope | "">("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<PurgeResult | null>(null);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/video-purge", { cache: "no-store" })
      .then(async response => {
        const payload = await response.json().catch(() => ({})) as { allowed?: unknown };
        return response.ok && payload.allowed === true;
      })
      .then(allowed => { if (active) setAuthorized(allowed); })
      .catch(() => { if (active) setAuthorized(false); });
    return () => { active = false; };
  }, []);

  async function purge() {
    if (!scope || confirmation !== CONFIRMATION_PHRASE || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/video-purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, scope }),
      });
      const payload = await response.json().catch(() => ({})) as {
        error?: string;
        nextPath?: string;
        paused?: boolean;
        ok?: boolean;
        scope?: PurgeScope;
        automationResumed?: boolean;
        cloudinaryAssetsDeleted?: number;
        cloudinaryBytesDeleted?: number;
        storageObjectsDeleted?: number;
        socialQueueRowsPreserved?: boolean;
        publicVideoCatalogPreserved?: boolean;
        manualPublicVideoCatalogPreserved?: boolean;
        generatedCatalogRecordsHidden?: number;
        catalogRecordsHidden?: number;
        generationRowsDeleted?: number;
        automationRunsDeleted?: number;
        externalSocialPostsDeleted?: false;
      };
      if (payload.error === "step_up_required" && redirectToAdminStepUp(payload.nextPath)) return;
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
        scope: payload.scope ?? (scope || "files"),
        automationResumed: payload.automationResumed === true,
        cloudinaryAssetsDeleted: payload.cloudinaryAssetsDeleted ?? 0,
        cloudinaryBytesDeleted: payload.cloudinaryBytesDeleted ?? 0,
        storageObjectsDeleted: payload.storageObjectsDeleted ?? 0,
        socialQueueRowsPreserved: payload.socialQueueRowsPreserved === true,
        publicVideoCatalogPreserved: payload.publicVideoCatalogPreserved === true,
        manualPublicVideoCatalogPreserved: payload.manualPublicVideoCatalogPreserved === true || payload.publicVideoCatalogPreserved === true,
        generatedCatalogRecordsHidden: payload.generatedCatalogRecordsHidden ?? payload.catalogRecordsHidden ?? 0,
        catalogRecordsHidden: payload.catalogRecordsHidden ?? 0,
        generationRowsDeleted: payload.generationRowsDeleted ?? 0,
        automationRunsDeleted: payload.automationRunsDeleted ?? 0,
        externalSocialPostsDeleted: false,
      };
      setResult(completed);
      setConfirmation("");
      setScope("");
      setExpanded(false);
      setMessage(
        scope === "files"
          ? "تم حذف ملفات الفيديو من التخزين، مع الاحتفاظ بذاكرة المصدر وسجلات التوليد."
          : scope === "memory"
            ? "تم إخفاء ذاكرة الفيديوهات داخل ZIKR وفصلها عن المكتبة، مع الاحتفاظ بملفات Cloudinary."
            : "تم حذف ملفات الفيديو المولّدة وإخفاء ذاكرة التوليد الداخلية، مع الاحتفاظ بسجل التدقيق.",
      );
      await onCompleted?.();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر تصفير مكتبة الفيديو.");
    } finally {
      setBusy(false);
    }
  }

  if (!authorized) return null;

  return (
    <section className="w-full rounded-2xl border border-red-500/25 bg-red-950/15 p-3 text-right sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-200">تصفير مكتبة الفيديوهات</p>
          <p className="mt-1 text-xs leading-6 text-brand-cream/55">
            تنظيف ذاكرة المشروع الداخلية فقط متاح حاليًا. حذف ملفات Cloudinary وSupabase Storage متوقف مؤقتًا حتى يكتمل فحص جميع مراجع الملفات في جداول المشروع.
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            const nextExpanded = !expanded;
            setExpanded(nextExpanded);
            if (!nextExpanded) {
              setScope("");
              setConfirmation("");
            }
            setError("");
            setMessage("");
          }}
          className="shrink-0 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {expanded ? "إغلاق التصفير" : "مسح الفيديوهات المولّدة"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-red-400/15 pt-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-brand-cream/75" htmlFor="video-purge-scope">نطاق الحذف</label>
            <select
              id="video-purge-scope"
              value={scope}
              onChange={event => setScope(event.target.value as PurgeScope)}
              disabled={busy}
              className="w-full rounded-xl border border-brand-gold/20 bg-black/30 px-3 py-3 text-sm text-brand-cream"
            >
              <option value="" disabled>اختر نطاق الحذف صراحةً</option>
              <option value="files" disabled>ملفات الفيديو — متوقفة مؤقتًا لحماية المراجع</option>
              <option value="memory">ذاكرة المشروع فقط — إخفاء مكتبة ZIKR وسجلات التوليد، مع إبقاء الملفات</option>
              <option value="both" disabled>الملفات وذاكرة المشروع — متوقفة مؤقتًا لحماية المراجع</option>
            </select>
            <p className="text-xs leading-6 text-brand-cream/55">
              {scope === "files"
                ? "سيتم حذف ملفات MP4، وإخفاء سجلات الفيديو حتى لا تظهر روابط مكسورة. ستبقى عناوينها ومصادرها وسجلات التوليد."
                : scope === "memory"
                  ? "سيتم إخفاء سجلات الفيديو الداخلية وإزالة طلبات وسجلات التوليد، بينما تبقى ملفات Cloudinary دون حذف."
                  : scope === "both"
                  ? "سيتم حذف ملفات MP4 وإخفاء ذاكرة الفيديو الداخلية وإزالة سجلات التوليد. ستبقى سجلات التدقيق والمنصات الخارجية دون تغيير."
                  : "اختر نطاق الحذف قبل كتابة عبارة التأكيد."}
            </p>
          </div>
          <p className="text-xs leading-6 text-amber-200/90">
            حذف الملفات معطّل حتى يكتمل فحص المراجع المشتركة في جميع الجداول. خيار ذاكرة المشروع لا يحذف أي ملف أو عنصر Storage. سجلات النشر الاجتماعي التاريخية ومنشورات الحسابات الخارجية لن تُحذف أو تُعدّل.
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
              disabled={busy || !scope || confirmation !== CONFIRMATION_PHRASE}
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
                setScope("");
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
          التوليد الداخلي محجوز أثناء التصفير. لا تغلق الصفحة قبل ظهور نتيجة العملية.
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
            النطاق: {result.scope === "files" ? "الملفات فقط" : result.scope === "memory" ? "ذاكرة المشروع فقط" : "الملفات والذاكرة"} · إعادة تشغيل التلقائي: {result.automationResumed ? "تمت إعادة تشغيله" : "ظل متوقفًا كما كان قبل العملية"}
          </p>
          <p>
            ملفات Cloudinary: {result.cloudinaryAssetsDeleted} · المساحة المحررة: {(result.cloudinaryBytesDeleted / (1024 * 1024)).toFixed(1)} MiB · عناصر Storage: {result.storageObjectsDeleted}
          </p>
          <p>
            طلبات التوليد: {result.generationRowsDeleted} · سجل المنصات التاريخي: {result.socialQueueRowsPreserved ? "محفوظ" : "غير مؤكد"} · سجلات الفيديوهات المولّدة المخفية: {result.generatedCatalogRecordsHidden} · الكتالوج اليدوي: {result.manualPublicVideoCatalogPreserved ? "محفوظ" : "غير مؤكد"} · سجلات التشغيل: {result.automationRunsDeleted}
          </p>
          <p className="mt-1 text-amber-100/90">
            لم يتم إرسال أي طلب حذف إلى منصات خارجية.
          </p>
        </div>
      )}
    </section>
  );
}
