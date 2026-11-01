export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminHealth, getAdminSettings } from "@/features/admin/services/platform";
import { supabaseServerAdminCount } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "صحة النظام | لوحة الإدارة" };

function readBooleanSetting(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.trim().toLowerCase() === "true") return true;
    if (value.trim().toLowerCase() === "false") return false;
  }
  return null;
}

const STATE_LABELS: Record<string, string> = {
  healthy: "سليم",
  degraded: "متدهور",
  available: "متاح",
  unavailable: "تعذر الفحص",
  empty: "لا توجد بيانات",
  socialQueued: "النشر الاجتماعي — في الانتظار",
  socialProcessing: "النشر الاجتماعي — قيد التنفيذ",
  socialPartial: "النشر الاجتماعي — يحتاج معالجة",
  socialFailed: "فشل النشر الاجتماعي",
  videoPending: "الفيديو — في الانتظار",
  videoProcessing: "الفيديو — قيد التنفيذ",
  videoRetryWait: "الفيديو — إعادة المحاولة",
  videoFailed: "فشل الفيديو",
};

export default async function AdminHealthPage() {
  await requireAdminPermission("system.manage");
  const [health, quranAudioCount, settings] = await Promise.all([
    getAdminHealth(),
    supabaseServerAdminCount("quran_audio").catch(() => null),
    getAdminSettings().catch(() => null),
  ]);
  // The production worker reads these canonical values from admin_settings.
  // Vercel process.env is not the worker runtime and must not be used to report its state.
  const automationEnabled = readBooleanSetting(settings?.video_automation_enabled);
  const aiEnabled = readBooleanSetting(settings?.video_automation_ai_enabled);
  const autoPublishEnabled = readBooleanSetting(settings?.video_automation_auto_publish);
  const facebookEnabled = readBooleanSetting(settings?.video_automation_facebook_enabled);
  const activeVideoOrder = aiEnabled === true
    ? "Hugging Face LTX → WAN → FFmpeg"
    : aiEnabled === false
      ? "FFmpeg template"
      : "غير متاح";
  const queueAttention =
    health.queuesAvailable.social && health.queuesAvailable.video
      ? health.queues.socialPartial +
        health.queues.socialFailed +
        health.queues.videoRetryWait +
        health.queues.videoFailed
      : null;

  return (
    <Container className="py-10 space-y-6" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.18em] text-brand-cream/30">صحة النظام</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">صحة وتشغيل النظام</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">فحص قاعدة البيانات والجداول والطوابير وحالة التشغيل. إعدادات الفيديو والنشر تُقرأ من admin_settings لأنها المصدر الذي يستهلكه عامل GitHub Actions، وليس من متغيرات خادم Vercel.</p>
      </header>

      {automationEnabled === false && (
        <div role="alert" className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100/85">
          تشغيل مصنع الفيديو معطّل من إعدادات الإدارة؛ لن ينشئ العامل طلبات جديدة حتى إعادة تفعيله.
        </div>
      )}
      {automationEnabled === true && aiEnabled === true && autoPublishEnabled === true && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm leading-7 text-emerald-100/80">
          التوليد والنشر الآلي مفعّلان في إعدادات العامل. يُنشر الفيديو بعد اكتمال التوليد والتحقق من حالة الطلب وتطابق رابط الوسائط مع المصدر؛ ويظل اتصال YouTube وFacebook شرطًا مستقلًا.
        </div>
      )}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4">
          <p className="text-xs text-brand-cream/35">محركات الفيديو</p>
          <p className="mt-1 text-sm font-bold text-brand-gold" dir="ltr">{activeVideoOrder}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4">
          <p className="text-xs text-brand-cream/35">توليد الفيديو بمزودي الذكاء الاصطناعي</p>
          <p className="mt-1 text-sm font-bold text-brand-cream/75">{aiEnabled === null ? "غير متاح — تعذر قراءة الإعداد" : aiEnabled ? "مفعل في عامل GitHub Actions" : "متوقف — القوالب المحلية فقط"}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4">
          <p className="text-xs text-brand-cream/35">النشر الآلي</p>
          <p className="mt-1 text-sm font-bold text-brand-cream/75">{autoPublishEnabled === null ? "غير متاح — تعذر قراءة الإعداد" : autoPublishEnabled ? "مفعل تلقائيًا بعد اكتمال الفيديو وفحص المصدر والوسائط" : "متوقف — يتطلب مراجعة بشرية"}</p>
          <p className="mt-1 text-xs text-brand-cream/35">Facebook: {facebookEnabled === null ? "غير متاح" : facebookEnabled ? "مسموح — العامل يتحقق من OAuth الفعلي" : "متوقف"}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${health.database === 'healthy' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/10'}`}>
          <p className="text-xs text-brand-cream/40">قاعدة البيانات</p>
          <p className="mt-2 text-xl font-bold">{health.database === 'healthy' ? 'سليمة' : 'متدهورة'}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${queueAttention === null ? 'border-brand-gold/10 bg-black/15' : queueAttention > 0 ? 'border-amber-500/25 bg-amber-500/10' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
          <p className="text-xs text-brand-cream/40">حالات تحتاج معالجة</p>
          <p className="mt-2 text-xl font-bold">{queueAttention === null ? "غير متاح" : queueAttention}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/40">آخر فحص</p>
          <p className="mt-2 text-sm text-brand-cream/70">{new Date(health.generatedAt).toLocaleString('ar-EG-u-nu-latn')}</p>
        </div>
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
          <p className="text-xs text-brand-cream/40">صوت القرآن</p>
          <p className="mt-2 text-xl font-bold text-brand-gold">{quranAudioCount === null ? "غير متاح" : quranAudioCount.toLocaleString("ar-EG-u-nu-latn")}</p>
          <p className="mt-1 text-xs text-brand-cream/30">quran_audio</p>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-brand-gold/10 bg-black/20 px-5 py-3 text-xs font-semibold text-brand-gold/70">
          <span>المورد</span><span>العدد</span><span>الحالة</span>
        </div>
        {health.tables.map((table) => (
          <div key={table.table} className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-brand-gold/8 px-5 py-3 text-sm last:border-0">
            <span className="font-mono text-brand-cream/70">{table.table}</span>
            <span className="tabular-nums text-brand-cream/50">{table.count === null ? 'غير متاح' : table.count.toLocaleString('ar-EG-u-nu-latn')}</span>
            <span className={table.state === "unavailable" ? "text-red-300" : table.state === "empty" ? "text-amber-300" : "text-emerald-300"}>{STATE_LABELS[table.state] ?? table.state}</span>
          </div>
        ))}
      </section>

      {health.tables.some((table) => table.state === "empty") && (
        <section className="rounded-2xl border border-amber-500/15 bg-amber-500/5 px-5 py-4">
          <p className="text-sm font-semibold text-amber-200">تنبيه بيانات</p>
          <p className="mt-1 text-sm leading-6 text-brand-cream/55">
            الجداول الفارغة ليست عطل اتصال، لكنها تعني أن المصدر لم تتم تعبئته بعد. راجع مكتبة المحتوى والوسائط قبل اعتبار القسم جاهزًا للإنتاج.
          </p>
        </section>
      )}

      {(!health.queuesAvailable.social || !health.queuesAvailable.video) && (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-7 text-red-100/85">
          تعذر قراءة {[!health.queuesAvailable.social && "طابور النشر الاجتماعي", !health.queuesAvailable.video && "طابور توليد الفيديو"].filter(Boolean).join(" و")}. الأرقام غير المتاحة ليست أصفارًا حقيقية.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(health.queues).map(([key, value]) => {
          const readable = key.startsWith("social") ? health.queuesAvailable.social : health.queuesAvailable.video;
          return (
            <div key={key} className="rounded-2xl border border-brand-gold/10 bg-black/10 p-4"><p className="text-xs text-brand-cream/35">{STATE_LABELS[key] ?? key}</p><p className="mt-1 text-2xl font-bold text-brand-cream">{readable ? value : "غير متاح"}</p></div>
          );
        })}
      </section>

      <section className="space-y-4 rounded-2xl border border-brand-gold/10 bg-black/15 p-5">
        <header>
          <h2 className="text-lg font-bold text-brand-gold">حالة النشر والتكاملات</h2>
          <p className="mt-1 text-sm text-brand-cream/45">قراءة مباشرة لحالة Vercel وCircleCI وعمليات GitHub Actions من آخر حالة على main.</p>
        </header>

        {!health.github.statusesAvailable && !health.github.workflowsAvailable && (
          <p role="status" className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-100/80">
            تعذر قراءة حالة GitHub. لا تعتبر هذه الحالة نجاحًا أو فشلًا؛ راجع صلاحية GitHub dispatch token.
          </p>
        )}

        {health.github.statusesAvailable && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/15 p-3">
              <span className="text-sm text-brand-cream/65">حالة آخر Commit على main</span>
              <span className={health.github.overall === "success" ? "font-bold text-emerald-300" : health.github.overall === "failure" || health.github.overall === "error" ? "font-bold text-red-300" : "font-bold text-amber-300"}>
                {health.github.overall ?? "غير متاح"}
              </span>
            </div>
            {health.github.commitSha && <p className="text-xs text-brand-cream/35" dir="ltr">Commit: {health.github.commitSha.slice(0, 12)}</p>}
            <div className="grid gap-2 sm:grid-cols-2">
              {health.github.statuses.map((status, index) => (
                <div key={status.context + index} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-brand-cream/75" dir="ltr">{status.context}</p>
                    {status.description && <p className="mt-1 text-xs text-brand-cream/35">{status.description}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={status.state === "success" ? "text-xs font-bold text-emerald-300" : status.state === "failure" || status.state === "error" ? "text-xs font-bold text-red-300" : "text-xs font-bold text-amber-300"}>{status.state}</span>
                    {status.targetUrl && <a href={status.targetUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-gold underline">فتح</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {health.github.statusesAvailable && !health.github.workflowsAvailable && (
          <p role="status" className="text-xs text-amber-200/70">تمت قراءة حالات Vercel وCircleCI، لكن تعذرت قراءة GitHub Actions. تحقق من صلاحية actions:read للرمز.</p>
        )}
        {!health.github.statusesAvailable && health.github.workflowsAvailable && (
          <p role="status" className="text-xs text-amber-200/70">تمت قراءة GitHub Actions، لكن تعذرت قراءة حالة Commit checks.</p>
        )}

        {health.github.workflowsAvailable && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-brand-cream/75">آخر تشغيلات الأتمتة</h3>
            {health.github.workflows.length === 0 ? (
              <p className="text-sm text-brand-cream/40">لا توجد تشغيلات حديثة مسجلة لهذه المهام.</p>
            ) : health.github.workflows.slice(0, 8).map((run, index) => (
              <div key={run.name + run.createdAt + index} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-brand-cream/75">{run.name}</p>
                  <p className="mt-1 text-xs text-brand-cream/35">{run.createdAt ? new Date(run.createdAt).toLocaleString("ar-EG-u-nu-latn") : "وقت غير متاح"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={(run.conclusion ?? run.status) === "success" ? "text-xs font-bold text-emerald-300" : (run.conclusion ?? run.status) === "failure" ? "text-xs font-bold text-red-300" : "text-xs font-bold text-amber-300"}>{run.conclusion ?? run.status}</span>
                  {run.url && <a href={run.url} target="_blank" rel="noreferrer" className="text-xs text-brand-gold underline">تفاصيل</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
