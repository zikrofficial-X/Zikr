import Link from "next/link";
import { getAdminSnapshot } from "@/features/admin/services/platform";
import { ADMIN_NAVIGATION } from "@/features/admin/config/navigation";
import { getCurrentProfile } from "@/features/admin/services/admin";
import { hasAdminPermission } from "@/features/admin/services/permissions";
import { deleteFailedVideoGenerationAction } from "@/features/admin/actions/video";

type AdminSnapshot = Awaited<ReturnType<typeof getAdminSnapshot>>;

async function loadAdminSnapshotSafely(): Promise<AdminSnapshot> {
  try {
    return await getAdminSnapshot();
  } catch (error) {
    console.error("[admin] failed to load platform command center snapshot", error);
    const unavailableTables = [
      ["profiles", "المستخدمون"], ["articles", "المقالات"], ["stories", "القصص"],
      ["content_library", "مكتبة المحتوى"], ["videos", "الفيديوهات"], ["hadiths", "الأحاديث"],
      ["duas", "الأدعية"], ["prophets", "الأنبياء"], ["companions", "الصحابة"],
      ["scholars", "العلماء"], ["kids_content", "محتوى الأطفال"], ["media_assets", "الوسائط"],
    ] as const;
    return {
      counts: unavailableTables.map(([table, label]) => ({ table, label, count: null, state: "unavailable" as const })),
      unavailable: ["ملخص لوحة الإدارة", "طوابير التشغيل وسجل التدقيق"],
      metrics: [
        { key: "drafts", label: "مسودات/مراجعة", value: null, tone: "neutral" as const },
        { key: "social", label: "طابور النشر", value: null, tone: "neutral" as const },
        { key: "video", label: "توليد الفيديو", value: null, tone: "neutral" as const },
        { key: "auditFailures", label: "عمليات إدارية فاشلة", value: null, tone: "neutral" as const },
      ],
      queues: {
        socialQueued: null,
        socialProcessing: null,
        socialFailed: null,
        videoPending: null,
        videoProcessing: null,
        videoFailed: null,
      },
      audit: [],
      generatedAt: new Date().toISOString(),
    } as AdminSnapshot;
  }
}

export async function AdminPlatformCommandCenter() {
  const snapshot = await loadAdminSnapshotSafely();
  const failedVideoJobs = snapshot.queues.videoFailed ?? 0;

  const currentProfile = await getCurrentProfile();
  const role = currentProfile?.role ?? "user";
  const availableGroups = ADMIN_NAVIGATION
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAdminPermission(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
  const availableHrefs = new Set(availableGroups.flatMap((group) => group.items.map((item) => item.href)));
  const groups = availableGroups.filter((group) => group.key !== "operations");
  const quickActions: Array<[string, string, string]> = [
    ["إدارة المحتوى", "/admin/content", "راجع المحتوى والمسودات"],
    ["تحليلات المنصة", "/admin/analytics", "تابع الاستخدام والنمو"],
    ["الألعاب", "/admin/kids/games", "حدّث تجربة الأطفال"],
    ["سجل التدقيق", "/admin/audit", "راجع آخر العمليات"],
  ].filter(([, href]) => availableHrefs.has(href));
  const queueLabels: Record<string, string> = {
    content_agent_queue: "طابور وكيل المحتوى",
    content_agent_runs: "تشغيلات وكيل المحتوى",
    video: "طابور توليد الفيديو",
    social: "طابور النشر الاجتماعي",
    videoGeneration: "طلبات توليد الفيديو",
    socialPublish: "طابور النشر الاجتماعي",
  };
  const outcomeLabels: Record<string, string> = { success: "ناجح", denied: "مرفوض", failed: "فشل" };

  return (
    <div className="space-y-8" dir="rtl">
      <header className="rounded-3xl border border-brand-gold/15 bg-gradient-to-br from-brand-gold/10 via-black/20 to-black/5 p-6 shadow-2xl shadow-black/10 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-brand-cream/30">مركز إدارة وتشغيل ذِكر</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-gold">لوحة العمليات الرئيسية</h1>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-brand-cream/50">
              مركز واحد لمراقبة التشغيل، المحتوى، الوسائط، النشر، المستخدمين، والأمن بدون تكرار صفحات أو مؤشرات غير حقيقية.
            </p>
          </div>
          <Link href="/" className="rounded-xl border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
            عرض الموقع
          </Link>
        </div>
      </header>

      <section aria-label="إجراءات سريعة" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {quickActions.map(([label, href, description]) => (
          <Link key={href} href={href} className="group min-w-0 rounded-2xl border border-brand-gold/10 bg-black/15 p-3 transition hover:border-brand-gold/30 hover:bg-brand-gold/5 sm:p-4">
            <p className="break-words text-sm font-semibold text-brand-cream transition group-hover:text-brand-gold">{label}</p>
            <p className="mt-1 text-xs leading-5 text-brand-cream/40">{description}</p>
          </Link>
        ))}
      </section>

      {snapshot.unavailable.length > 0 ? (
        <div role="alert" className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-7 text-red-100/85">
          تعذر قراءة: {snapshot.unavailable.join("، ")}. القيم غير المتاحة معروضة كـ«غير متاح» وليست أصفارًا.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {snapshot.metrics.map((metric) => (
          <div
            key={metric.key}
            className={`rounded-2xl border p-5 ${metric.tone === "danger" ? "border-red-500/25 bg-red-500/10 text-red-200" : metric.tone === "warning" ? "border-amber-500/20 bg-amber-500/5 text-amber-200" : metric.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" : "border-brand-gold/10 bg-black/15 text-brand-cream"}`}
          >
            <p className="text-xs opacity-60">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{metric.value === null ? "غير متاح" : metric.value.toLocaleString("ar-EG-u-nu-latn")}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-gold">حالة الطوابير</h2>
            <Link href="/admin/health" className="text-xs text-brand-cream/40 hover:text-brand-gold">تفاصيل الصحة</Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(snapshot.queues).map(([key, value]) => (
              <div key={key} className="rounded-xl border border-brand-gold/8 bg-black/10 p-3">
                <p className="text-[11px] text-brand-cream/35">{queueLabels[key] ?? key}</p>
                <p className="mt-1 text-xl font-bold text-brand-cream">{value === null ? "غير متاح" : value.toLocaleString("ar-EG-u-nu-latn")}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-gold">آخر عمليات الإدارة</h2>
            <Link href="/admin/audit" className="text-xs text-brand-cream/40 hover:text-brand-gold">السجل الكامل</Link>
          </div>
          <div className="mt-4 space-y-2">
            {snapshot.audit.slice(0, 6).map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-3 rounded-xl border border-brand-gold/8 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-brand-cream/75">{event.action}</p>
                  <p className="text-[11px] text-brand-cream/30">{event.permission ?? "—"} · {event.resource_type ?? "system"}</p>
                </div>
                <span className={event.outcome === "success" ? "text-emerald-300" : event.outcome === "denied" ? "text-amber-300" : "text-red-300"}>{outcomeLabels[event.outcome] ?? event.outcome}</span>
              </div>
            ))}
            {snapshot.audit.length === 0 && <p className="text-sm text-brand-cream/35">{snapshot.unavailable.includes("سجل التدقيق") || snapshot.unavailable.includes("طوابير التشغيل وسجل التدقيق") ? "تعذر قراءة سجل التدقيق؛ لا يمكن تأكيد وجود عمليات حديثة أو عدمها." : "لا توجد عمليات حديثة مسجلة."}</p>}
          </div>
        </div>
      </section>

      {failedVideoJobs > 0 && (
        <section className="rounded-3xl border border-red-500/15 bg-red-500/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-brand-cream">عمليات توليد فاشلة تحتاج إجراء</h2>
              <p className="mt-1 text-sm text-brand-cream/45">يمكن حذف العمليات ذات الحالة failed فقط. عمليات pending وprocessing وcompleted محمية من هذا الإجراء.</p>
            </div>
            <form action={deleteFailedVideoGenerationAction}>
              <button type="submit" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200">
                حذف الفاشلة ({failedVideoJobs})
              </button>
            </form>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-brand-gold">مراكز الإدارة</h2>
          <p className="mt-1 text-sm text-brand-cream/40">الصفحات هنا تشير إلى الوحدات الفعلية المسجلة في نظام الصلاحيات.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
          {groups.map((group) => {
            const primaryItems = group.items.slice(0, 3);
            const secondaryItems = group.items.slice(3);
            return (
              <article key={group.key} className="min-w-0 rounded-2xl border border-brand-gold/10 bg-black/10 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words font-bold text-brand-gold">{group.label}</h3>
                    <p className="mt-1 text-xs text-brand-cream/35">روابط القسم حسب صلاحيات حسابك</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-brand-gold/10 px-2 py-1 text-[10px] text-brand-cream/45">
                    {group.items.length} صفحة
                  </span>
                </div>
                <div className="mt-4 space-y-1.5">
                  {primaryItems.map((item) => (
                    <Link key={item.href} href={item.href} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm text-brand-cream/70 transition hover:border-brand-gold/15 hover:bg-brand-gold/5 hover:text-brand-gold">
                      <span className="min-w-0 break-words">{item.label}</span>
                      <span className="shrink-0 text-[10px] text-brand-cream/25" dir="ltr">{item.href}</span>
                    </Link>
                  ))}
                </div>
                {secondaryItems.length > 0 && (
                  <details className="mt-3 border-t border-brand-gold/10 pt-3">
                    <summary className="cursor-pointer list-none rounded-lg px-3 py-2 text-xs font-semibold text-brand-gold/70 transition hover:bg-brand-gold/5 hover:text-brand-gold">
                      عرض باقي الصفحات ({secondaryItems.length})
                    </summary>
                    <div className="mt-1 space-y-1">
                      {secondaryItems.map((item) => (
                        <Link key={item.href} href={item.href} className="flex min-w-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs text-brand-cream/60 transition hover:bg-brand-gold/5 hover:text-brand-gold">
                          <span className="min-w-0 break-words">{item.label}</span>
                          <span className="shrink-0 text-[10px] text-brand-cream/25" dir="ltr">{item.href}</span>
                        </Link>
                      ))}
                    </div>
                  </details>
                )}
              </article>
            );
          })}
        </div>      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-brand-gold">جرد البيانات</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {snapshot.counts.map((value) => (
            <div key={value.table} className={`rounded-2xl border p-4 ${value.count === null ? "border-red-500/15 bg-red-500/5" : "border-brand-gold/8 bg-black/10"}`}>
              <p className="text-xs text-brand-cream/35">{value.label}</p>
              <p className="mt-1 text-xl font-bold text-brand-cream">
                {value.count === null ? "غير متاح" : value.count.toLocaleString("ar-EG-u-nu-latn")}
              </p>
            </div>
          ))}
        </div>
      </section>

      <p className="text-center text-xs text-brand-cream/20">آخر تحديث للبيانات: {new Date(snapshot.generatedAt).toLocaleString("ar-EG-u-nu-latn")}</p>
    </div>
  );
}
