import Link from "next/link";
import { Activity, AlertTriangle, BellRing, Radio, ShieldCheck } from "lucide-react";
import { getAdminSnapshot } from "@/features/admin/services/platform";
import { ADMIN_NAVIGATION } from "@/features/admin/config/navigation";
import { getCurrentProfile } from "@/features/admin/services/admin";
import { hasAdminPermission } from "@/features/admin/services/permissions";
import { deleteFailedVideoGenerationAction } from "@/features/admin/actions/video";
import { AdminModuleDirectory } from "@/features/admin/components/admin-module-directory";

type AdminSnapshot = Awaited<ReturnType<typeof getAdminSnapshot>>;

async function loadAdminSnapshotSafely(): Promise<AdminSnapshot> {
  try {
    return await getAdminSnapshot();
  } catch (error) {
    console.error("[admin] failed to load platform command center snapshot", error);
    const unavailableTables = [
      ["articles", "المقالات"], ["stories", "القصص"], ["content_library", "مكتبة المحتوى"],
      ["hadiths", "الأحاديث"], ["duas", "الأدعية"], ["prophets", "الأنبياء"],
      ["companions", "الصحابة"], ["scholars", "العلماء"], ["quran_surahs", "السور القرآنية"],
      ["quran_reciters", "القراء"], ["quran_audio", "ملفات التلاوة"], ["tawasheeh", "التواشيح"],
      ["site_audio_assets", "مكتبة صوت الموقع"], ["kids_content", "محتوى الأطفال"],
      ["kids_games", "الألعاب"], ["kids_game_levels", "مستويات الألعاب"],
      ["videos", "الفيديوهات"], ["media_assets", "أصول الوسائط"], ["profiles", "المستخدمون"],
      ["video_generation_requests", "طلبات الفيديو"], ["social_publish_queue", "عناصر النشر الاجتماعي"],
      ["admin_audit_events", "سجلات التدقيق"],
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
  const roleLabels: Record<string, string> = {
    admin: "مدير النظام",
    editor: "محرر",
    moderator: "مشرف",
    analyst: "محلل",
    user: "مستخدم",
  };
  const availableGroups = ADMIN_NAVIGATION
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasAdminPermission(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
  const availableHrefs = new Set(availableGroups.flatMap((group) => group.items.map((item) => item.href)));
  const canReadAudit = hasAdminPermission(role, "audit.read");
  const canReadSocialQueue = hasAdminPermission(role, "social.manage");
  const canReadVideoQueue = hasAdminPermission(role, "video.manage");
  const visibleMetrics = snapshot.metrics.filter((metric) => {
    if (metric.key === "auditFailures") return canReadAudit;
    if (metric.key === "social") return canReadSocialQueue;
    if (metric.key === "video") return canReadVideoQueue;
    if (metric.key === "drafts") {
      return hasAdminPermission(role, "content.manage") ||
        hasAdminPermission(role, "library.manage") ||
        hasAdminPermission(role, "knowledge.manage");
    }
    return true;
  });
  const availableRoute = (...routes: string[]) => routes.find((href) => availableHrefs.has(href));
  const metricValue = (key: string) => snapshot.metrics.find((metric) => metric.key === key)?.value ?? null;
  type AttentionItem = { key: string; title: string; description: string; count: number | null; href: string | undefined; tone: "warning" | "danger" };
  const attentionCandidates: AttentionItem[] = [
    { key: "drafts", title: "محتوى ينتظر المراجعة", description: "راجع المسودات والعناصر التي لم تكتمل موافقتها.", count: metricValue("drafts"), href: availableRoute("/admin/editorial", "/admin/library", "/admin/content"), tone: "warning" },
    { key: "social", title: "منشورات فاشلة", description: "تحقق من سبب الفشل قبل إعادة محاولة النشر.", count: canReadSocialQueue ? snapshot.queues.socialFailed : null, href: availableRoute("/admin/social"), tone: "danger" },
    { key: "video", title: "طلبات فيديو فاشلة", description: "افحص الطلبات قبل إعادة المحاولة أو تنظيفها.", count: canReadVideoQueue ? snapshot.queues.videoFailed : null, href: availableRoute("/admin/video-factory/queue", "/admin/video-factory", "/admin/ai-video"), tone: "danger" },
    { key: "audit", title: "عمليات إدارية فاشلة", description: "راجع حالات الفشل الظاهرة ضمن أحدث أحداث التدقيق.", count: canReadAudit ? metricValue("auditFailures") : null, href: canReadAudit ? availableRoute("/admin/audit") : undefined, tone: "warning" },
  ];
  const attentionItems = attentionCandidates.filter(
    (item): item is AttentionItem & { count: number; href: string } =>
      typeof item.count === "number" && item.count > 0 && typeof item.href === "string",
  );
  const queueEntries = Object.entries(snapshot.queues).filter(([key]) =>
    key.startsWith("social") ? canReadSocialQueue : canReadVideoQueue,
  );
  const quickActionCandidates: Array<[string, string, string]> = [
    ["إدارة المحتوى", "/admin/content", "راجع المحتوى والمسودات"],
    ["تحليلات المنصة", "/admin/analytics", "تابع الاستخدام والنمو"],
    ["الألعاب", "/admin/kids/games", "حدّث تجربة الأطفال"],
    ["سجل التدقيق", "/admin/audit", "راجع آخر العمليات"],
  ];
  const quickActions = quickActionCandidates.filter(([, href]) => availableHrefs.has(href));
  const queueLabels: Record<string, string> = {
    content_agent_queue: "طابور وكيل المحتوى",
    content_agent_runs: "تشغيلات وكيل المحتوى",
    video: "طابور توليد الفيديو",
    social: "طابور النشر الاجتماعي",
    videoGeneration: "طلبات توليد الفيديو",
    socialPublish: "طابور النشر الاجتماعي",
  };
  const outcomeLabels: Record<string, string> = { success: "ناجح", denied: "مرفوض", failed: "فشل" };
  const queueTotal = queueEntries.reduce((sum, [, value]) => sum + (typeof value === "number" ? value : 0), 0);
  const failedQueueTotal = (canReadSocialQueue ? snapshot.queues.socialFailed ?? 0 : 0) + (canReadVideoQueue ? snapshot.queues.videoFailed ?? 0 : 0);
  const dataStatus = snapshot.unavailable.length ? "جزئية" : "مباشرة";
  const queueAlerts = [
    canReadVideoQueue && snapshot.queues.videoFailed !== null && snapshot.queues.videoFailed > 0
      ? {
          key: "video",
          title: "فشل في طابور توليد الفيديو",
          description: "توجد طلبات فيديو فاشلة تحتاج إلى فحص السجل أو إعادة المحاولة.",
          count: snapshot.queues.videoFailed,
          href: availableRoute("/admin/video-factory/queue", "/admin/video-factory", "/admin/ai-video") ?? "/admin",
        }
      : null,
    canReadSocialQueue && snapshot.queues.socialFailed !== null && snapshot.queues.socialFailed > 0
      ? {
          key: "social",
          title: "فشل في طابور النشر الاجتماعي",
          description: "توجد منشورات لم تكتمل. راجع سبب الفشل قبل إعادة تنفيذ النشر.",
          count: snapshot.queues.socialFailed,
          href: availableRoute("/admin/social") ?? "/admin",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  const countSections: Array<{ key: string; title: string; description: string; tables: string[] }> = [
    {
      key: "content",
      title: "المحتوى والمعرفة",
      description: "الأقسام المعرفية الرئيسية، وتشمل المنشور والمسودات.",
      tables: ["articles", "stories", "content_library", "hadiths", "duas", "prophets", "companions", "scholars"],
    },
    {
      key: "quran-audio",
      title: "القرآن والصوت",
      description: "السور، القراء، ملفات التلاوة، التواشيح، والأصول الصوتية.",
      tables: ["quran_surahs", "quran_reciters", "quran_audio", "tawasheeh", "site_audio_assets"],
    },
    {
      key: "kids",
      title: "الأطفال والألعاب",
      description: "محتوى الأطفال والألعاب ومراحل اللعب المسجلة.",
      tables: ["kids_content", "kids_games", "kids_game_levels"],
    },
    {
      key: "media",
      title: "الفيديو والوسائط",
      description: "الفيديوهات المنشورة وسجل أصول الوسائط.",
      tables: ["videos", "media_assets"],
    },
    {
      key: "operations",
      title: "المستخدمون والتشغيل",
      description: "الحسابات، طلبات التوليد، النشر الاجتماعي، وسجل التدقيق.",
      tables: ["profiles", "video_generation_requests", "social_publish_queue", "admin_audit_events"],
    },
  ];

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
        <div className="mt-6 grid gap-2 border-t border-brand-gold/10 pt-4 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-2.5 text-xs text-emerald-200/80">
            <Radio size={15} /> <span>حالة البيانات: {dataStatus}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-brand-gold/10 bg-black/15 px-3 py-2.5 text-xs text-brand-cream/60">
            <ShieldCheck size={15} className="text-brand-gold/80" /> <span>الدور: {roleLabels[role] ?? role}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-brand-gold/10 bg-black/15 px-3 py-2.5 text-xs text-brand-cream/60">
            <Activity size={15} className="text-sky-300/80" /> <span>{queueTotal.toLocaleString("ar-EG-u-nu-latn")} عنصر في الطوابير · {failedQueueTotal.toLocaleString("ar-EG-u-nu-latn")} فاشل</span>
          </div>
        </div>
      </header>

      {queueAlerts.length > 0 ? (
        <section aria-labelledby="automatic-queue-alerts-heading" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BellRing size={18} className="text-red-300" />
              <h2 id="automatic-queue-alerts-heading" className="text-lg font-bold text-red-100">تنبيهات تشغيلية تلقائية</h2>
            </div>
            {hasAdminPermission(role, "notifications.manage") ? (
              <Link href="/admin/notifications" className="text-xs text-brand-gold hover:underline">سجل التنبيهات</Link>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {queueAlerts.map((alert) => (
              <Link
                key={alert.key}
                href={alert.href}
                role="alert"
                className="group rounded-2xl border border-red-500/25 bg-red-500/[0.08] p-4 transition hover:border-red-300/45 hover:bg-red-500/[0.13]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 rounded-lg bg-red-500/15 p-2 text-red-200"><AlertTriangle size={17} /></span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-red-100">{alert.title}</h3>
                      <p className="mt-1 text-xs leading-6 text-red-100/65">{alert.description}</p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-red-500/15 px-2.5 py-1 text-lg font-bold tabular-nums text-red-100">{alert.count.toLocaleString("ar-EG-u-nu-latn")}</span>
                </div>
                <span className="mt-3 inline-flex text-xs font-semibold text-red-200 group-hover:text-white">فتح مركز المعالجة ←</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
        {visibleMetrics.map((metric) => (
          <div
            key={metric.key}
            className={`rounded-2xl border p-5 ${metric.tone === "danger" ? "border-red-500/25 bg-red-500/10 text-red-200" : metric.tone === "warning" ? "border-amber-500/20 bg-amber-500/5 text-amber-200" : metric.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200" : "border-brand-gold/10 bg-black/15 text-brand-cream"}`}
          >
            <p className="text-xs opacity-60">{metric.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">{metric.value === null ? "غير متاح" : metric.value.toLocaleString("ar-EG-u-nu-latn")}</p>
          </div>
        ))}
      </section>

      {attentionItems.length > 0 ? (
        <section className="space-y-3" aria-labelledby="admin-attention-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="admin-attention-heading" className="text-lg font-bold text-brand-gold">تحتاج متابعة</h2>
              <p className="mt-1 text-xs text-brand-cream/40">مهام مبنية على بيانات الطوابير والمراجعة المتاحة لهذا الدور.</p>
            </div>
            <span className="rounded-full border border-amber-400/20 px-2.5 py-1 text-[10px] text-amber-200">{attentionItems.length} تنبيه</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {attentionItems.map((item) => (
              <Link key={item.key} href={item.href} className={"rounded-2xl border p-4 transition hover:bg-white/[0.03] " + (item.tone === "danger" ? "border-red-500/20 bg-red-500/5" : "border-amber-400/20 bg-amber-400/5")}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-brand-cream/85">{item.title}</p>
                  <span className={"rounded-lg px-2 py-1 text-sm font-bold tabular-nums " + (item.tone === "danger" ? "bg-red-500/10 text-red-200" : "bg-amber-400/10 text-amber-200")}>{item.count.toLocaleString("ar-EG-u-nu-latn")}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-brand-cream/45">{item.description}</p>
                <span className="mt-3 inline-flex text-xs font-semibold text-brand-gold">فتح صفحة المعالجة ←</span>
              </Link>
            ))}
          </div>
        </section>
      ) : snapshot.unavailable.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-200/80" role="status">
          لا توجد عناصر حرجة تحتاج متابعة بحسب البيانات المتاحة حالياً.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-brand-gold/10 bg-black/15 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-gold">حالة الطوابير</h2>
            {hasAdminPermission(role, "system.manage") ? <Link href="/admin/health" className="text-xs text-brand-cream/40 hover:text-brand-gold">تفاصيل الصحة</Link> : null}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {queueEntries.map(([key, value]) => (
              <div key={key} className="rounded-xl border border-brand-gold/8 bg-black/10 p-3">
                <p className="text-[11px] text-brand-cream/35">{queueLabels[key] ?? key}</p>
                <p className="mt-1 text-xl font-bold text-brand-cream">{value === null ? "غير متاح" : value.toLocaleString("ar-EG-u-nu-latn")}</p>
              </div>
            ))}
          </div>
          {queueEntries.length === 0 ? <p className="mt-3 text-xs text-brand-cream/40">لا توجد طوابير متاحة لصلاحيات حسابك.</p> : null}
        </div>

        {canReadAudit ? (
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
        ) : (
          <div className="rounded-3xl border border-brand-gold/10 bg-black/15 p-6">
            <h2 className="text-lg font-bold text-brand-gold">سجل التدقيق</h2>
            <p className="mt-2 text-sm leading-6 text-brand-cream/40">لا يعرض هذا الدور تفاصيل العمليات الإدارية. يلزم وجود صلاحية قراءة سجل التدقيق.</p>
          </div>
        )}
      </section>

      {failedVideoJobs > 0 && hasAdminPermission(role, "video.delete") && (
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

      <AdminModuleDirectory groups={availableGroups} />

      <section className="space-y-5">
        <header>
          <h2 className="text-xl font-bold text-brand-gold">جرد المنصة حسب المجال</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-brand-cream/40">
            أعداد من قاعدة البيانات الفعلية، منظّمة بحسب وظيفة كل جزء من المنصة. الأرقام تمثل السجلات ولا تعني وحدها أن كل عنصر منشور أو معتمد.
          </p>
        </header>
        {countSections.map((section) => {
          const values = snapshot.counts.filter((value) => section.tables.includes(value.table));
          if (!values.length) return null;
          return (
            <section key={section.key} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-brand-cream">{section.title}</h3>
                  <p className="mt-1 text-xs text-brand-cream/35">{section.description}</p>
                </div>
                <span className="rounded-full border border-brand-gold/10 px-2.5 py-1 text-[10px] text-brand-cream/40">
                  {values.length} مؤشر
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {values.map((value) => (
                  <div key={value.table} className={`min-w-0 rounded-2xl border p-4 ${value.count === null ? "border-red-500/15 bg-red-500/5" : "border-brand-gold/8 bg-black/10"}`}>
                    <p className="text-xs leading-5 text-brand-cream/40">{value.label}</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-brand-cream">
                      {value.count === null ? "غير متاح" : value.count.toLocaleString("ar-EG-u-nu-latn")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </section>

      <p className="text-center text-xs text-brand-cream/20">آخر تحديث للبيانات: {new Date(snapshot.generatedAt).toLocaleString("ar-EG-u-nu-latn")}</p>
    </div>
  );
}
