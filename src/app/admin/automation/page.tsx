export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { retryFailedVideoGenerationAction, setVideoAutomationPausedAction } from "@/features/admin/actions/automation";
import { supabaseServerAdminCount, supabaseServerAdminRequest } from "@/lib/supabase/server";
import { saveVideoAutomationSettingAction, requestVideoAutomationRunAction } from "@/app/admin/system-actions";

export const metadata: Metadata = { title: "الأتمتة والمهام | الأدمن" };

const JOB_TABLES = [
  ["content_agent_queue", "طابور وكيل المحتوى"],
  ["content_agent_runs", "تشغيلات وكيل المحتوى"],
  ["video_generation_requests", "طلبات توليد الفيديو"],
  ["social_publish_queue", "طابور النشر الاجتماعي"],
] as const;

type QueueStatus = { status: string };
type VideoAutomationRun = {
  finished_at: string | null;
  created_count: number | null;
  processed_count: number | null;
  completed_count: number | null;
  failed_count: number | null;
  error_summary: string | null;
};

const VIDEO_SETTINGS = [
  ["video_automation_enabled", "التشغيل التلقائي", "boolean"],
  ["video_automation_batch_size", "عدد الطلبات في كل دورة", "number"],
  ["video_automation_ai_enabled", "توليد المشاهد بالـAI", "boolean"],
  ["video_automation_auto_publish", "النشر التلقائي", "boolean"],
  ["video_automation_facebook_enabled", "فيسبوك وريلز", "boolean"],
] as const;

async function readCount(table: string) {
  try {
    return { count: await supabaseServerAdminCount(table), state: "available" as const };
  } catch {
    return { count: null, state: "unavailable" as const };
  }
}

export default async function AdminAutomationPage() {
  await requireAdminPermission("system.manage");

  const jobs = await Promise.all(
    JOB_TABLES.map(async ([table, label]) => ({
      table,
      label,
      ...(await readCount(table)),
    })),
  );

  const settingsRows = await supabaseServerAdminRequest<Array<{ key: string; value: unknown }>>(
    "/rest/v1/admin_settings?key=in.(video_automation_enabled,video_automation_batch_size,video_automation_ai_enabled,video_automation_auto_publish,video_automation_facebook_enabled,video_automation_run_now)&select=key,value",
    { method: "GET" },
  ).catch(() => []);
  const settings = Object.fromEntries((settingsRows ?? []).map((row) => [row.key, row.value]));
  const latestRuns = await supabaseServerAdminRequest<VideoAutomationRun[]>(
    "/rest/v1/video_automation_runs?select=finished_at,created_count,processed_count,completed_count,failed_count,error_summary&order=finished_at.desc&limit=1",
    { method: "GET" },
  ).catch(() => []);

  const [videoQueue, socialQueue] = await Promise.all([
    supabaseServerAdminRequest<QueueStatus[]>(
      "/rest/v1/video_generation_requests?select=status&order=created_at.desc&limit=500",
      { method: "GET" },
    ).catch(() => []),
    supabaseServerAdminRequest<QueueStatus[]>(
      "/rest/v1/social_publish_queue?select=status&order=created_at.desc&limit=500",
      { method: "GET" },
    ).catch(() => []),
  ]);

  const paused = await supabaseServerAdminRequest<Array<{ value: { paused?: boolean } | null }>>(
    "/rest/v1/admin_settings?key=eq.video_automation&select=value&limit=1",
    { method: "GET" },
  )
    .then((rows) => rows?.[0]?.value?.paused === true)
    .catch(() => false);

  const countStatus = (rows: QueueStatus[], status: string) => rows.filter((row) => row.status === status).length;

  return (
    <Container className="py-10 space-y-8" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">مركز التشغيل الآلي</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">الأتمتة والتشغيل</h1>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/50">
          هذه الصفحة تعرض فقط الطوابير الموجودة فعليًا في الإنتاج. لا تُظهر جداول أو وظائف غير موجودة كأنها صفر.
        </p>
      </header>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
        <h2 className="font-semibold text-brand-gold">التحكم في التوليد والنشر التلقائي</h2>
        <p className="mt-2 text-sm leading-7 text-brand-cream/50">
          الحالة الحالية: <strong className={paused ? "text-red-400" : "text-emerald-400"}>{paused ? "متوقف مؤقتًا" : "يعمل تلقائيًا"}</strong>.
          التوليد والنشر يتمان تلقائيًا كل ساعتين، والإيقاف هنا يمنع التوليد الجديد والمعالجة في التشغيل التالي.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={setVideoAutomationPausedAction}>
            <input type="hidden" name="paused" value={paused ? "false" : "true"} />
            <button type="submit" className="rounded-xl border border-brand-gold/30 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
              {paused ? "استئناف التوليد التلقائي" : "إيقاف التوليد مؤقتًا"}
            </button>
          </form>
          <form action={retryFailedVideoGenerationAction}>
            <button type="submit" className="rounded-xl border border-brand-gold/30 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
              إعادة محاولة الطلبات الفاشلة
            </button>
          </form>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {jobs.map((job) => (
          <div key={job.table} className={`rounded-2xl border p-5 ${job.state === "available" ? "border-brand-gold/10 bg-black/15" : "border-red-500/20 bg-red-500/5"}`}>
            <p className="text-xs text-brand-cream/40">{job.label}</p>
            <p className="mt-2 font-mono text-xs text-brand-cream/30" dir="ltr">{job.table}</p>
            <p className="mt-3 text-3xl font-bold text-brand-gold">
              {job.count === null ? "غير متاح" : job.count.toLocaleString("ar-EG")}
            </p>
            <p className="mt-1 text-xs text-brand-cream/30">{job.state === "available" ? "متاح" : "تعذر الاستعلام"}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-brand-gold">تحكم تشغيل الفيديو</h2>
            <p className="mt-1 text-sm leading-6 text-brand-cream/45">الإعدادات محفوظة في قاعدة البيانات ويقرأها عامل GitHub Actions في كل دورة تشغيل.</p>
          </div>
          <form action={requestVideoAutomationRunAction}>
            <button type="submit" className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm font-semibold text-brand-gold hover:bg-brand-gold/20">تشغيل التوليد الآن</button>
          </form>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {VIDEO_SETTINGS.map(([key, label, kind]) => {
            const value = settings[key];
            const checked = value === true || value === "true";
            return (
              <form key={key} action={saveVideoAutomationSettingAction} className="rounded-xl border border-brand-gold/10 bg-black/10 p-4 space-y-3">
                <input type="hidden" name="key" value={key} />
                <div>
                  <h3 className="font-semibold text-brand-cream/80">{label}</h3>
                  <p className="mt-1 text-xs text-brand-cream/30" dir="ltr">{key}</p>
                </div>

                {kind === "boolean" ? (
                  <label className="flex items-center gap-3 text-sm text-brand-cream/60">
                    <input type="checkbox" name="value" value="true" defaultChecked={checked} className="h-4 w-4" />
                    مفعّل
                  </label>
                ) : (
                  <input
                    name="value"
                    type="number"
                    min={1}
                    max={10}
                    defaultValue={typeof value === "number" || typeof value === "string" ? String(value) : "2"}
                    className="w-full rounded-xl border border-brand-gold/15 bg-black/20 px-3 py-2 text-sm text-brand-cream"
                  />
                )}
                <button type="submit" className="rounded-lg border border-brand-gold/20 px-3 py-2 text-xs text-brand-gold hover:bg-brand-gold/10">حفظ</button>
              </form>
            );
          })}
        </div>

        <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-4 text-sm leading-7 text-sky-100/75">
          العامل يعمل خارج Vercel عبر GitHub Actions. زر «تشغيل التوليد الآن» يضع طلبًا عاجلًا، ويقوم موزّع خفيف بفحصه كل 5 دقائق ثم يشغّل عامل الفيديو، بدون انتظار الدورة الساعةية.
        </div>
        <div className="rounded-xl border border-brand-gold/10 bg-black/10 p-4 text-sm text-brand-cream/55">
          حالة الطلب العاجل: {settings.video_automation_run_now ? "مطلوب التنفيذ / في طريقه للتشغيل" : "لا يوجد طلب عاجل"}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-brand-gold">طابور توليد الفيديو</h2>
            <Link href="/admin/videos" className="text-xs text-brand-gold/70 hover:text-brand-gold">فتح الطابور</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["pending", "قيد الانتظار"],
              ["processing", "قيد التنفيذ"],
              ["completed", "مكتمل"],
              ["failed", "فشل"],
            ].map(([status, label]) => (
              <div key={status} className="rounded-xl border border-brand-gold/8 bg-black/10 p-3">
                <p className="text-xs text-brand-cream/35">{label}</p>
                <p className="mt-1 text-xl font-bold text-brand-cream">{countStatus(videoQueue, status)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-brand-gold">طابور النشر الاجتماعي</h2>
            <Link href="/admin/social" className="text-xs text-brand-gold/70 hover:text-brand-gold">فتح مركز النشر</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["queued", "في الانتظار"],
              ["processing", "قيد التنفيذ"],
              ["published", "نُشر"],
              ["failed", "فشل"],
            ].map(([status, label]) => (
              <div key={status} className="rounded-xl border border-brand-gold/8 bg-black/10 p-3">
                <p className="text-xs text-brand-cream/35">{label}</p>
                <p className="mt-1 text-xl font-bold text-brand-cream">{countStatus(socialQueue, status)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/10 p-5">
        <h2 className="font-semibold text-brand-gold">آخر تشغيل للعامل</h2>
        {latestRuns[0] ? (
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-6">
            <div><span className="text-brand-cream/35">وقت الانتهاء</span><p className="mt-1 text-brand-cream/75">{latestRuns[0].finished_at ? new Date(latestRuns[0].finished_at).toLocaleString("ar-EG") : "غير معروف"}</p></div>
            <div><span className="text-brand-cream/35">أُنشئ</span><p className="mt-1 font-bold text-brand-gold">{latestRuns[0].created_count ?? 0}</p></div>
            <div><span className="text-brand-cream/35">عولج</span><p className="mt-1 font-bold text-brand-gold">{latestRuns[0].processed_count ?? 0}</p></div>
            <div><span className="text-brand-cream/35">اكتمل</span><p className="mt-1 font-bold text-emerald-300">{latestRuns[0].completed_count ?? 0}</p></div>
            <div><span className="text-brand-cream/35">فشل</span><p className="mt-1 font-bold text-red-300">{latestRuns[0].failed_count ?? 0}</p></div>
            <div><span className="text-brand-cream/35">الحالة</span><p className="mt-1 text-brand-cream/75">{latestRuns[0].error_summary ? "توجد أخطاء" : "سليم"}</p></div>
          </div>
        ) : <p className="mt-3 text-sm text-brand-cream/40">لا يوجد سجل تشغيل للعامل حتى الآن.</p>}
      </section>

      <section className="rounded-2xl border border-brand-gold/10 bg-black/10 p-5 text-sm leading-7 text-brand-cream/50">
        التشغيل التلقائي للفيديو والنشر الاجتماعي يتم بواسطة العامل الخارجي المخصص للمشروع. مركز الإدارة يراقب الحالات ويسمح بالوصول إلى الطوابير الفعلية، بينما لا ينشئ جدولة مكررة من داخل لوحة الإدارة.
      </section>
    </Container>
  );
}
