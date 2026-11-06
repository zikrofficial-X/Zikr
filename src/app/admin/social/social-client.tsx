"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type {
  SocialPublishQueueItem,
  SocialQueueStatus,
} from "@/features/social/services/social-publishing";

type Status = SocialQueueStatus;
type QueueItem = SocialPublishQueueItem;
type Health = {
  youtubeConfigured: boolean;
  youtubeConnectionStatus?: "not_configured" | "not_tested" | "connected" | "public_data_only" | "reauthorization_required" | "permission_missing" | "channel_not_found" | "unavailable";
  youtubeReadSource?: "oauth" | "api_key" | null;
  youtubeChannelId?: string | null;
  youtubeChannelName?: string | null;
  youtubeLastCheckedAt?: string | null;
  youtubeConnectionMessage?: string;
  youtubeSubscribers?: number | null;
  youtubeTotalViews?: number | null;
  youtubeVideoCount?: number | null;
  facebookEnabled: boolean;
  facebookCredentialsConfigured: boolean;
  facebookEnvironmentTokenConfigured: boolean;
  facebookAuthBlocked: number;
  facebookConnectionStatus?: "connected" | "disabled" | "not_connected" | "reauthorization_required" | "permission_error" | "error";
  facebookPageName?: string | null;
  facebookTokenSource?: "database" | "environment" | "missing";
  facebookLastCheckedAt?: string | null;
  facebookTokenExpiresAt?: string | null;
  facebookConnectionMessage?: string;
  facebookInsightsPermissionGranted?: boolean;
};
type SocialView = "overview" | "queue" | "analytics";
type PlatformFilter = "all" | "youtube" | "facebook" | "facebook_reels";
type PlatformStats = Record<
  string,
  { queued: number; published: number; failed: number }
>;
type SocialAnalytics = {
  platform: Record<string, { posts: number; views: number; likes: number; comments: number; shares: number }>;
  audience: {
    youtube: { status: string; channelName: string | null; subscribers: number | null; totalViews: number | null; videoCount: number | null; subscribersGained: number | null; subscribersLost: number | null; views28d: number | null; likes28d: number | null; comments28d: number | null; shares28d: number | null; watchMinutes28d: number | null };
    facebook: { status: string; pageName: string | null; followers: number | null; pageLikes: number | null };
  };
  posts: Array<{ id: string; title: string; contentType: string; platform: string; publishedAt: string; remoteId: string | null; url: string | null; views: number | null; likes: number | null; comments: number | null; shares: number | null; metricsCapturedAt: string | null; metricsStatus: string }>;
  capturedAt: string;
};
type AutomationStatus = {
  enabled: boolean;
  provider: string;
  scheduleMinutes: number;
  note: string;
};

const STATUS_ORDER: readonly Status[] = [
  "queued",
  "processing",
  "published",
  "partial",
  "failed",
];
const STATUS_LABELS: Record<Status, string> = {
  queued: "في الانتظار",
  processing: "قيد المعالجة",
  published: "نُشر",
  partial: "نشر جزئي",
  failed: "فشل",
};
const STATUS_CLASSES: Record<Status, string> = {
  queued: "border-sky-500/25 bg-sky-500/10 text-sky-300",
  processing: "border-amber-500/25 bg-amber-500/10 text-amber-300",
  published: "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
  partial: "border-yellow-500/25 bg-yellow-500/10 text-yellow-300",
  failed: "border-red-500/25 bg-red-500/10 text-red-300",
};

function facebookReelsDeferredUntil(item: QueueItem): string | null {
  const metadata = item.metadata ?? {};
  const deferredPlatforms = metadata.deferredPlatforms;
  const legacyCooldownMessage = /Facebook Reels publishing paused by provider cooldown until/i.test(item.error_message ?? "");
  const isDeferred =
    (Array.isArray(deferredPlatforms) && deferredPlatforms.includes("facebook_reels")) ||
    legacyCooldownMessage;
  if (!isDeferred) return null;

  const candidate = metadata.nextRetryAt ?? metadata.facebookReelsNextAllowedAt ?? item.scheduled_at;
  return typeof candidate === "string" && Number.isFinite(Date.parse(candidate)) ? candidate : null;
}

function formatDeferredAt(value: string): string {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
}

function youtubeInsightsSummary(item: QueueItem): string {
  const raw = item.metadata?.platformInsights;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return item.target_platforms.includes("youtube") && item.status === "published"
      ? "إحصاءات YouTube ستظهر بعد أول مزامنة"
      : "—";
  }
  const youtube = (raw as Record<string, unknown>).youtube;
  if (!youtube || typeof youtube !== "object" || Array.isArray(youtube)) {
    return item.target_platforms.includes("youtube") && item.status === "published"
      ? "إحصاءات YouTube ستظهر بعد أول مزامنة"
      : "—";
  }
  const stats = youtube as Record<string, unknown>;
  const count = (value: unknown) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0
      ? new Intl.NumberFormat("ar-EG").format(value)
      : null;
  const views = count(stats.views);
  const likes = count(stats.likes);
  const comments = count(stats.comments);
  if (views === null && likes === null && comments === null) return "لا توجد إحصاءات عامة متاحة";
  return [
    views === null ? null : views + " مشاهدة",
    likes === null ? null : likes + " إعجاب",
    comments === null ? null : comments + " تعليق",
  ].filter(Boolean).join(" · ");
}

function facebookReelsInsightsSummary(item: QueueItem, permissionGranted: boolean): string {
  const raw = item.metadata?.platformInsights;
  const reels = raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as Record<string, unknown>).facebookReels
    : null;
  if (!reels || typeof reels !== "object" || Array.isArray(reels)) {
    return item.target_platforms.includes("facebook_reels") && item.status === "published"
      ? permissionGranted ? "إحصاءات Reels تنتظر أول مزامنة" : "إحصاءات Reels تنتظر صلاحية read_insights"
      : "—";
  }
  const metrics = (reels as Record<string, unknown>).metrics;
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return "لا توجد إحصاءات Reels متاحة";
  const values = metrics as Record<string, unknown>;
  const count = (value: unknown) =>
    typeof value === "number" && Number.isSafeInteger(value) && value >= 0
      ? new Intl.NumberFormat("ar-EG").format(value)
      : null;
  const plays = count(values.fb_reels_total_plays);
  const averageMs = typeof values.post_video_avg_time_watched === "number"
    ? values.post_video_avg_time_watched
    : null;
  const averageSeconds = averageMs !== null && Number.isFinite(averageMs) && averageMs >= 0
    ? (averageMs / 1000).toFixed(1) + " ث مشاهدة/متوسط"
    : null;
  const replays = count(values.fb_reels_replay_count);
  return [
    plays === null ? null : plays + " تشغيل Reels",
    averageSeconds,
    replays === null ? null : replays + " إعادة تشغيل",
  ].filter(Boolean).join(" · ") || "لا توجد إحصاءات Reels متاحة";
}

export default function AdminSocialPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [health, setHealth] = useState<Health>({
    youtubeConfigured: false,
    facebookEnabled: false,
    facebookCredentialsConfigured: false,
    facebookEnvironmentTokenConfigured: false,
    facebookAuthBlocked: 0,
  });
  const [platformStats, setPlatformStats] = useState<PlatformStats>({});
  const [socialAnalytics, setSocialAnalytics] = useState<SocialAnalytics | null>(null);
  const [automation, setAutomation] = useState<AutomationStatus>({
    enabled: true,
    provider: "GitHub Actions",
    scheduleMinutes: 15,
    note: "النشر التلقائي مفعّل كل 15 دقيقة.",
  });
  const [oldestQueuedAt, setOldestQueuedAt] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState<SocialView>("overview");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/social", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        items?: QueueItem[];
        health?: Health;
        platformStats?: PlatformStats;
        socialAnalytics?: SocialAnalytics;
        automation?: AutomationStatus;
        oldestQueuedAt?: string | null;
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "تعذر تحميل طابور النشر.");
      setItems(Array.isArray(payload.items) ? payload.items : []);
      if (payload.health) setHealth(payload.health);
      setPlatformStats(payload.platformStats ?? {});
      setSocialAnalytics(payload.socialAnalytics ?? null);
      setAutomation(payload.automation ?? {
        enabled: false,
        provider: "GitHub Actions",
        scheduleMinutes: 15,
        note: "تعذر التحقق من حالة النشر؛ يظل النشر متوقفًا بأمان.",
      });
      setOldestQueuedAt(payload.oldestQueuedAt ?? null);
      setSelected([]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "تعذر تحميل طابور النشر."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const youtubeStatus = query.get("youtube");
    if (youtubeStatus === "connected") {
      setMessage("تم ربط YouTube بصلاحيات القراءة والرفع وAnalytics. جارٍ تحديث حالة القناة.");
      void load();
    } else if (youtubeStatus) {
      const youtubeMessages: Record<string, string> = {
        configuration_missing: "إعداد Google OAuth غير مكتمل. تحقق من YOUTUBE_CLIENT_ID وYOUTUBE_CLIENT_SECRET.",
        redirect_uri_mismatch: "عنوان العودة غير مسجل في Google Cloud. أضف https://zikrmediaofficial.vercel.app/api/admin/social/youtube/callback إلى Authorized redirect URIs.",
        permission_missing: "لم تُمنح صلاحيات YouTube المطلوبة. أعد التفويض ووافق على قراءة القناة ورفع الفيديو وتقارير Analytics.",
        authorization_denied: "تم إلغاء تفويض YouTube. لم يتم تغيير اتصال النشر الحالي.",
        state_mismatch: "انتهت جلسة ربط YouTube لأسباب أمنية. ابدأ الربط من جديد.",
        admin_session_missing: "انتهت جلسة الإدارة أثناء الرجوع من Google. سجّل الدخول ثم أعد ربط YouTube.",
        missing_code: "لم يُرجع Google رمز التفويض المطلوب.",
        refresh_token_missing: "لم يُرجع Google Refresh Token جديدًا. أعد الربط مع الموافقة على Offline access.",
        channel_read_failed: "تم التفويض لكن تعذرت قراءة القناة المرتبطة بحساب Google.",
        channel_mismatch: "القناة التي تم تفويضها لا تطابق YOUTUBE_CHANNEL_ID المضبوط في ZIKR.",
        oauth_failed: "فشل تفويض Google. تحقق من إعدادات OAuth Authorized redirect URI وحاول مرة أخرى.",
      };
      setError(youtubeMessages[youtubeStatus] || "تعذر إكمال ربط YouTube.");
    }

    const facebookStatus = query.get("facebook");
    if (!facebookStatus) return;
    if (facebookStatus === "connected") {
      const insights = query.get("insights");
      setMessage(insights === "missing"
        ? "تم تجديد اتصال Facebook للنشر، لكن read_insights لم تُمنح بعد؛ إحصاءات Reels ستظل معلّقة حتى اعتماد الصلاحية وإعادة الربط."
        : "تم تجديد اتصال Facebook بنجاح. سيستأنف النشر التلقائي، وأُعيدت العناصر المحجوبة إلى الطابور.");
      return;
    }
    const facebookMessages: Record<string, string> = {
      configuration_missing: "إعداد تطبيق Meta غير مكتمل. تحقق من FACEBOOK_APP_ID وFACEBOOK_APP_SECRET.",
      redirect_uri_mismatch: "عنوان العودة غير مسجل في إعدادات تطبيق Meta. أضف /api/admin/social/facebook/callback إلى Valid OAuth Redirect URIs.",
      permission_missing: "لم تُمنح جميع صلاحيات صفحة Facebook المطلوبة. وافق على pages_show_list وpages_read_engagement وpages_manage_posts، وread_insights لإحصاءات Reels، ثم أعد الربط.",
      authorization_denied: "تم إلغاء تفويض Facebook. لن يتم تشغيل النشر قبل ربط الصفحة.",
      state_mismatch: "انتهت جلسة الربط لأسباب أمنية. ابدأ الربط من جديد.",
      page_not_found: "الحساب الذي تم تفويضه لا يدير صفحة Facebook المحددة في إعدادات ZIKR.",
      page_selection_required: "Meta أعادت أكثر من صفحة ولا تطابق أيٌّ منها رقم الصفحة المضبوط في ZIKR. يلزم ضبط FACEBOOK_PAGE_ID على معرّف صفحة Zikr الصحيح ثم إعادة الربط.",
      page_validation_failed: "تعذر التحقق من صفحة Facebook المختارة. لم يتم حفظ الاعتماد.",
      reauthorization_required: "رفض Meta التوكن الحالي. اربط صفحة Facebook من جديد.",
      admin_session_missing: "انتهت جلسة الإدارة أثناء الرجوع من Facebook. سجّل الدخول وافتح مركز النشر مرة أخرى.",
      missing_code: "لم يُرجع Facebook رمز التفويض المطلوب. أعد الربط.",
      oauth_failed: "فشل تفويض Facebook. تحقق من إعدادات تطبيق Meta وحاول مرة أخرى.",
    };
    setError(facebookMessages[facebookStatus] || "تعذر استكمال ربط Facebook.");
  }, [load]);

  const connectFacebook = useCallback(() => {
    // Full-page navigation is intentional because this API route starts the server-side OAuth redirect to Meta.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- OAuth must leave the current client route.
    window.location.href = "/api/admin/social/facebook/connect";
  }, []);

  const connectYouTube = useCallback(() => {
    // Full-page navigation is intentional because the server starts the Google OAuth consent flow.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- OAuth must leave the current client route.
    window.location.href = "/api/admin/social/youtube/connect";
  }, []);

  const testFacebook = useCallback(async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_facebook" }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        health?: Health;
      };
      if (!response.ok) throw new Error(payload.error || "تعذر اختبار اتصال Facebook.");
      if (payload.health) setHealth(current => ({ ...current, ...payload.health }));
      const status = payload.health?.facebookConnectionStatus;
      if (status === "connected") {
        setMessage("اختبار Facebook ناجح. النشر التلقائي مفعّل.");
      } else {
        setError(payload.health?.facebookConnectionMessage || "لم يجتز اتصال Facebook الاختبار.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر اختبار اتصال Facebook.");
    } finally {
      setBusy(false);
    }
  }, []);

  const testYouTube = useCallback(async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test_youtube" }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        health?: { status?: Health["youtubeConnectionStatus"]; readSource?: Health["youtubeReadSource"]; channelId?: string | null; channelName?: string | null; subscribers?: number | null; totalViews?: number | null; videoCount?: number | null; checkedAt?: string; message?: string };
      };
      if (!response.ok || !payload.health) throw new Error(payload.error || "تعذر اختبار اتصال YouTube.");
      setHealth(current => ({
        ...current,
        youtubeConnectionStatus: payload.health?.status,
        youtubeReadSource: payload.health?.readSource ?? null,
        youtubeChannelId: payload.health?.channelId ?? null,
        youtubeSubscribers: payload.health?.subscribers ?? null,
        youtubeTotalViews: payload.health?.totalViews ?? null,
        youtubeVideoCount: payload.health?.videoCount ?? null,
        youtubeChannelName: payload.health?.channelName ?? null,
        youtubeLastCheckedAt: payload.health?.checkedAt ?? null,
        youtubeConnectionMessage: payload.health?.message ?? "انتهى اختبار YouTube.",
      }));
      if (payload.health.status === "connected") setMessage("اختبار YouTube ناجح. تم التحقق من قناة النشر.");
      else if (payload.health.status === "public_data_only") setMessage(payload.health.message || "تمت قراءة بيانات القناة العامة.");
      else setError(payload.health.message || "لم يجتز اتصال YouTube الاختبار.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر اختبار اتصال YouTube.");
    } finally {
      setBusy(false);
    }
  }, []);

  const adoptServerToken = useCallback(async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "adopt_server_facebook_token" }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        adopted?: boolean;
        pageName?: string;
        released?: number;
        queueUpdateFailed?: boolean;
        workerDispatched?: boolean;
        health?: Health;
      };
      if (!response.ok) {
        throw new Error(payload.error || "تعذر اعتماد توكن Facebook المحفوظ على الخادم.");
      }
      if (payload.health) {
        setHealth(current => ({ ...current, ...payload.health }));
      }
      const summary = [
        "تم التحقق من التوكن وحفظ اعتماد الصفحة " + (payload.pageName || "Facebook") + ".",
        "تم تحرير " + (payload.released ?? 0) + " عنصرًا قديمًا لإعادة المعالجة دون تكرار ما نُشر بنجاح.",
        payload.queueUpdateFailed ? "لكن تعذر تحديث بعض عناصر الطابور؛ أعد تحديث الصفحة قبل تشغيل العامل." : "",
        (payload.released ?? 0) > 0 && !payload.workerDispatched ? "سيكمل العامل المجدول المعالجة خلال دورة النشر التالية." : "",
      ].filter(Boolean);
      setMessage(summary.join(" "));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر اعتماد توكن Facebook من إعدادات الخادم.");
    } finally {
      setBusy(false);
    }
  }, [load]);

  const runWorker = useCallback(async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run_worker" }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(payload.error || "تعذر تشغيل عامل النشر.");
      setMessage(
        "تم إرسال طلب تشغيل العامل إلى GitHub Actions. سيعالج العامل العناصر الجاهزة للنشر الآن."
      );
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "تعذر تشغيل عامل النشر."
      );
    } finally {
      setBusy(false);
    }
  }, [load]);

  const filtered = useMemo(() => items.filter(item => {
    const matchesStatus = filter === "all" || item.status === filter;
    const matchesPlatform = platformFilter === "all" || item.target_platforms.includes(platformFilter);
    return matchesStatus && matchesPlatform;
  }), [filter, items, platformFilter]);
  const retryable = items.filter(
    item => item.status === "failed" || item.status === "partial"
  );
  const selectedRetryableCount = selected.filter(id =>
    retryable.some(item => item.id === id)
  ).length;
  const visibleRetryable = filtered.filter(
    item => item.status === "failed" || item.status === "partial"
  );
  const allVisibleRetryableSelected =
    visibleRetryable.length > 0 &&
    visibleRetryable.every(item => selected.includes(item.id));

  const runAction = useCallback(
    async (
      action: "retry" | "retry_all_failed" | "delete" | "delete_failed"
    ) => {
      if (
        action !== "retry" &&
        !window.confirm(
          action === "delete_failed"
            ? `سيتم حذف ${retryable.length} عملية فاشلة أو نشر جزئي نهائيًا.`
            : "سيتم حذف العمليات الفاشلة أو الجزئية المحددة نهائيًا."
        )
      )
        return;
      const ids =
        action === "retry_all_failed" || action === "delete_failed"
          ? []
          : selected;
      if ((action === "retry" || action === "delete") && ids.length === 0) {
        setError("حدد عملية فاشلة أو نشرًا جزئيًا أولًا.");
        return;
      }
      setBusy(true);
      setError("");
      setMessage("");
      try {
        const response = await fetch("/api/admin/social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, ids }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          affected?: number;
        };
        if (!response.ok)
          throw new Error(payload.error || "تعذر تنفيذ الإجراء.");
        setMessage(
          `تم تنفيذ الإجراء بنجاح${typeof payload.affected === "number" ? ` (${payload.affected})` : ""}.`
        );
        await load();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "تعذر تنفيذ الإجراء."
        );
      } finally {
        setBusy(false);
      }
    },
    [load, retryable.length, selected]
  );

  function toggleVisibleRetryable() {
    const ids = visibleRetryable.map(item => item.id);
    setSelected(current =>
      allVisibleRetryableSelected
        ? current.filter(id => !ids.includes(id))
        : [...new Set([...current, ...ids])]
    );
  }

  return (
    <Container className="space-y-6 py-10 text-right">
      <section className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-brand-gold/60">النشر الاجتماعي</p>
            <h1 className="text-2xl font-bold text-brand-gold sm:text-3xl">مركز النشر</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-brand-cream/60">
              مكان واحد لحالة الاتصال، ومتابعة العناصر، ومعالجة الأعطال دون تكرار المنشورات الناجحة.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button variant="outline" disabled={busy} onClick={() => void connectYouTube()}>
              إعادة ربط YouTube بصلاحيات القراءة
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void connectFacebook()}>
              ربط Facebook عبر OAuth
            </Button>
            {health.facebookEnvironmentTokenConfigured && (
              <Button disabled={busy} onClick={() => void adoptServerToken()}>
                اعتماد توكن الخادم
              </Button>
            )}
            <Button variant="outline" disabled={busy || loading} onClick={() => void load()}>
              تحديث البيانات
            </Button>
            <Button disabled={busy} onClick={() => void runWorker()}>
              تشغيل العامل الآن
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-cream">حالة النشر التلقائي</p>
              <p className={`mt-1 text-sm font-semibold ${automation.enabled ? "text-emerald-300" : "text-amber-300"}`}>
                {automation.enabled ? "مفعّل" : "متوقف بأمان"}
              </p>
              <p className="mt-1 text-xs leading-5 text-brand-cream/55">
                {automation.note}
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full border border-brand-gold/15 px-3 py-1 text-xs text-brand-gold/80">
              {automation.enabled ? `الجدولة: كل ${automation.scheduleMinutes} دقيقة` : "النشر متوقف"}
            </span>
          </div>
        </div>
      </section>
      <div
        role="tablist"
        aria-label="أقسام مركز النشر"
        className="grid grid-cols-3 gap-2 rounded-2xl border border-brand-gold/10 bg-black/20 p-1.5"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "overview"}
          onClick={() => setActiveView("overview")}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${activeView === "overview" ? "bg-brand-gold text-brand-emeraldDeep" : "text-brand-cream/60 hover:bg-white/5"}`}
        >
          الملخص والاتصالات
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "queue"}
          onClick={() => setActiveView("queue")}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${activeView === "queue" ? "bg-brand-gold text-brand-emeraldDeep" : "text-brand-cream/60 hover:bg-white/5"}`}
        >
          طابور النشر ({items.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "analytics"}
          onClick={() => setActiveView("analytics")}
          className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${activeView === "analytics" ? "bg-brand-gold text-brand-emeraldDeep" : "text-brand-cream/60 hover:bg-white/5"}`}
        >
          تحليلات المنصات والتفاعل
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
        >
          {error}
        </div>
      )}
      {message && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-200"
        >
          {message}
        </div>
      )}

      {activeView === "overview" && (
        <>
      <section className="grid gap-3 md:grid-cols-3">
        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs text-brand-cream/50">YouTube</div>
            <span className={`text-xs ${health.youtubeConnectionStatus === "connected" ? "text-emerald-300" : "text-amber-200/80"}`}>
              {health.youtubeConnectionStatus === "connected" ? "متصل" : health.youtubeConnectionStatus === "public_data_only" ? "قراءة عامة فقط" : health.youtubeConnectionStatus === "reauthorization_required" ? "يحتاج إعادة تفويض" : health.youtubeConnectionStatus === "permission_missing" ? "صلاحية قراءة القناة ناقصة" : health.youtubeConfigured ? "لم يُختبر الاتصال" : "غير مضبوط"}
            </span>
          </div>
          <p className="text-sm font-semibold text-brand-cream/85">{health.youtubeChannelName || (health.youtubeConfigured ? "قناة YouTube — يلزم الاختبار" : "بيانات YouTube غير مكتملة")}</p>
          {health.youtubeConnectionMessage && <p className="text-xs leading-5 text-brand-cream/55">{health.youtubeConnectionMessage}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void connectYouTube()}>
              منح صلاحية قراءة القناة
            </Button>
            <Button variant="outline" size="sm" disabled={busy || !health.youtubeConfigured} onClick={() => void testYouTube()}>
              اختبار اتصال YouTube
            </Button>
          </div>
        </Card>
        <Card className="space-y-3">
          <div className="text-xs text-brand-cream/50">Facebook</div>
          <div className="mt-1 font-semibold">
            {health.facebookConnectionStatus === "reauthorization_required"
              ? "التوكن منتهي أو مرفوض — يحتاج إعادة ربط"
              : health.facebookConnectionStatus === "permission_error"
                ? "الاتصال موجود لكن الصلاحيات ناقصة"
                : health.facebookConnectionStatus === "error"
                  ? "تعذر التحقق من الاتصال"
                  : health.facebookConnectionStatus === "connected" && health.facebookEnabled
                    ? "متصل — النشر التلقائي مفعّل"
                    : health.facebookConnectionStatus === "disabled"
                      ? "تم التحقق من الصفحة، لكن النشر معطّل"
                      : !health.facebookCredentialsConfigured
                        ? "الصفحة غير مربوطة"
                        : !health.facebookEnabled
                          ? "بحاجة إلى إكمال الربط لتفعيل النشر"
                          : "جارٍ التحقق من الاتصال"}
          </div>
          {health.facebookPageName && (
            <p className="text-xs text-brand-cream/55">الصفحة: {health.facebookPageName}</p>
          )}
          {health.facebookConnectionMessage && (
            <div className="space-y-1">
              <p className="text-xs leading-5 text-brand-cream/55">{health.facebookConnectionMessage}</p>
              <p className="text-xs leading-5 text-brand-cream/55">إحصاءات Facebook Reels: {health.facebookInsightsPermissionGranted ? "صلاحية read_insights متاحة." : "تحتاج read_insights من Meta ثم إعادة ربط الصفحة؛ النشر الحالي لا يتأثر."}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void connectFacebook()}>
              تجديد الاتصال
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void testFacebook()}>
              اختبار الاتصال
            </Button>
          </div>
        </Card>
        <Card>
          <div className="text-xs text-brand-cream/50">
            <span aria-hidden="true">Facebook Auth Blocks</span>
            <span className="sr-only">سجلات فشل اعتماد Facebook السابقة</span>
          </div>
          <div className="mt-1 font-semibold">{health.facebookAuthBlocked}</div>
        </Card>
      </section>

      {health.facebookAuthBlocked > 0 && (
        <div
          role="status"
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-200"
        >
          يوجد {health.facebookAuthBlocked} عنصرًا قديمًا محجوبًا بسبب فشل اعتماد Facebook.
          هذا عدّاد للطابور وليس تشخيصًا للتوكن الحالي. بعد اعتماد توكن صالح، سيعاد فتح العناصر تلقائيًا مع الاحتفاظ بنتائج النشر الناجحة لتجنب تكرارها.
        </div>
      )}
        </>
      )}

      {activeView === "overview" && (
        <>
      <div className="flex items-center justify-between gap-3 pt-2">
        <h2 className="text-lg font-bold text-brand-cream">ملخص الطابور</h2>
        <p className="text-xs text-brand-cream/45">{loading ? "جارٍ التحديث..." : "آخر قراءة مباشرة"}</p>
      </div>
      <section className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {STATUS_ORDER.map(status => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setFilter(filter === status ? "all" : status);
              setActiveView("queue");
            }}
            className={`rounded-2xl border p-4 text-right ${filter === status ? "border-brand-gold/40 bg-brand-gold/10" : "border-brand-gold/10 bg-black/15"}`}
          >
            <div className="text-xs text-brand-cream/50">
              {STATUS_LABELS[status]}
            </div>
            <div className="mt-1 text-2xl font-bold text-brand-gold">
              {items.filter(item => item.status === status).length}
            </div>
          </button>
        ))}
      </section>
      <section className="grid gap-3 md:grid-cols-3">
        {(["youtube", "facebook_reels", "facebook"] as const).map(platform => {
          const stats = platformStats[platform] ?? {
            queued: 0,
            published: 0,
            failed: 0,
          };
          const total = stats.published + stats.failed;
          const successRate = total
            ? Math.round((stats.published / total) * 100)
            : null;
          return (
            <Card key={platform}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-brand-gold">
                  {platform === "youtube"
                    ? "YouTube"
                    : platform === "facebook_reels"
                      ? "Facebook Reels"
                      : "Facebook"}
                </span>
                <span className="text-xs text-brand-cream/40">
                  {successRate === null
                    ? "لا توجد نتائج"
                    : `${successRate}% نجاح`}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <b className="block text-lg text-emerald-300">
                    {stats.published}
                  </b>
                  نُشر
                </div>
                <div>
                  <b className="block text-lg text-sky-300">{stats.queued}</b>
                  قيد الانتظار
                </div>
                <div>
                  <b className="block text-lg text-red-300">{stats.failed}</b>
                  فشل
                </div>
              </div>
            </Card>
          );
        })}
      </section>
      {oldestQueuedAt && (
        <p className="text-xs leading-5 text-brand-cream/40">
          أقدم عنصر قيد التشغيل أو الانتظار:{" "}
          <span dir="ltr">{oldestQueuedAt}</span>
        </p>
      )}
        </>
      )}

      {activeView === "analytics" && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h2 className="text-xl font-bold text-brand-gold">تحليلات كل منصة على حدة</h2><p className="text-xs text-brand-cream/45">بيانات من مصادر المنصات الرسمية؛ الأرقام غير المتاحة لا تُعرض كأصفار.</p></div>
            <p className="text-xs text-brand-cream/40">آخر تجميع: {socialAnalytics?.capturedAt ? new Date(socialAnalytics.capturedAt).toLocaleString("ar-EG") : "غير متاح"}</p>
          </div>
          {socialAnalytics ? (
            <>
              <section className="grid gap-3 xl:grid-cols-3">
                {(["youtube","facebook","facebook_reels"] as const).map(platform => {
                  const stats = socialAnalytics.platform[platform] ?? { posts:0,views:0,likes:0,comments:0,shares:0 };
                  const title = platform === "youtube" ? "YouTube" : platform === "facebook" ? "Facebook Page" : "Facebook Reels";
                  return <Card key={platform} className="space-y-4">
                    <div className="flex items-center justify-between"><h3 className="font-bold text-brand-gold">{title}</h3><span className="text-xs text-brand-cream/45">{stats.posts} منشور منشور</span></div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {([["views","مشاهدات"],["likes","إعجابات"],["comments","تعليقات"],["shares","مشاركات"]] as const).map(([key,label]) => <div key={key} className="rounded-xl border border-brand-gold/10 p-3"><p className="text-[11px] text-brand-cream/45">{label}</p><p className="mt-1 text-lg font-bold tabular-nums text-brand-cream">{stats[key].toLocaleString("ar-EG")}</p></div>)}
                    </div>
                  </Card>;
                })}
              </section>
              <section className="grid gap-3 md:grid-cols-2">
                <Card className="space-y-3">
                  <h3 className="font-bold text-red-300">جمهور YouTube</h3>
                  <p className="text-sm text-brand-cream/60">{socialAnalytics.audience.youtube.channelName || "القناة"}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {([["subscribers","إجمالي المشتركين"],["subscribersGained","مشتركون جدد · 28 يومًا"],["subscribersLost","مشتركون مفقودون · 28 يومًا"],["views28d","مشاهدات · 28 يومًا"],["likes28d","إعجابات · 28 يومًا"],["comments28d","تعليقات · 28 يومًا"],["shares28d","مشاركات · 28 يومًا"],["watchMinutes28d","دقائق المشاهدة · 28 يومًا"]] as const).map(([key,label]) => { const value = key === "subscribers" ? socialAnalytics.audience.youtube.subscribers : socialAnalytics.audience.youtube[key as keyof typeof socialAnalytics.audience.youtube]; return <div key={key} className="rounded-xl bg-black/15 p-3"><p className="text-[11px] text-brand-cream/45">{label}</p><p className="mt-1 font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString("ar-EG") : "غير متاح"}</p></div>; })}
                  </div>
                </Card>
                <Card className="space-y-3">
                  <h3 className="font-bold text-blue-300">جمهور Facebook</h3>
                  <p className="text-sm text-brand-cream/60">{socialAnalytics.audience.facebook.pageName || "صفحة Facebook"}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-black/15 p-3"><p className="text-xs text-brand-cream/45">المتابعون</p><p className="mt-1 text-xl font-bold">{socialAnalytics.audience.facebook.followers?.toLocaleString("ar-EG") ?? "غير متاح"}</p></div>
                    <div className="rounded-xl bg-black/15 p-3"><p className="text-xs text-brand-cream/45">إعجابات الصفحة</p><p className="mt-1 text-xl font-bold">{socialAnalytics.audience.facebook.pageLikes?.toLocaleString("ar-EG") ?? "غير متاح"}</p></div>
                  </div>
                  <p className="text-xs leading-5 text-brand-cream/45">إحصاءات منشورات Facebook/Reels تظهر بحسب ما تسمح به صلاحيات Meta لكل منشور.</p>
                </Card>
              </section>
              <Card className="space-y-3">
                <div className="flex items-center justify-between gap-2"><h3 className="font-bold text-brand-gold">المنشورات المنشورة والتفاعل لكل منشور</h3><span className="text-xs text-brand-cream/40">آخر {socialAnalytics.posts.length} سجل</span></div>
                <div className="overflow-x-auto">
                  <table className="min-w-[850px] w-full text-sm">
                    <thead className="text-xs text-brand-cream/45"><tr><th className="p-2 text-right">المحتوى</th><th className="p-2 text-right">المنصة</th><th className="p-2 text-right">تاريخ النشر</th><th className="p-2 text-right">مشاهدات</th><th className="p-2 text-right">إعجابات</th><th className="p-2 text-right">تعليقات</th><th className="p-2 text-right">مشاركات</th><th className="p-2 text-right">الرابط</th></tr></thead>
                    <tbody className="divide-y divide-brand-gold/10">{socialAnalytics.posts.map(post => <tr key={`${post.id}-${post.platform}`}><td className="max-w-[240px] truncate p-2">{post.title}</td><td className="p-2">{post.platform === "youtube" ? "YouTube" : post.platform === "facebook_reels" ? "Facebook Reels" : "Facebook"}</td><td className="p-2 text-xs" dir="ltr">{new Date(post.publishedAt).toLocaleDateString("ar-EG")}</td><td className="p-2 tabular-nums">{post.views?.toLocaleString("ar-EG") ?? "—"}</td><td className="p-2 tabular-nums">{post.likes?.toLocaleString("ar-EG") ?? "—"}</td><td className="p-2 tabular-nums">{post.comments?.toLocaleString("ar-EG") ?? "—"}</td><td className="p-2 tabular-nums">{post.shares?.toLocaleString("ar-EG") ?? "—"}</td><td className="p-2">{post.url ? <a href={post.url} target="_blank" rel="noreferrer" className="text-brand-gold underline">فتح</a> : "—"}</td></tr>)}</tbody>
                  </table>
                </div>
                {!socialAnalytics.posts.length && <p className="py-8 text-center text-sm text-brand-cream/45">لا توجد منشورات منشورة مسجلة بعد.</p>}
              </Card>
            </>
          ) : <Card><p className="text-sm text-brand-cream/50">لا تتوفر بيانات التحليلات حاليًا.</p></Card>}
        </section>
      )}
      {activeView === "queue" && (
      <Card className="space-y-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="تصفية طابور النشر حسب المنصة">
          {([
            ["all", "كل المنصات"],
            ["youtube", "YouTube"],
            ["facebook", "Facebook"],
            ["facebook_reels", "Facebook Reels"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={platformFilter === value}
              onClick={() => setPlatformFilter(value)}
              className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${platformFilter === value ? "border-brand-gold/40 bg-brand-gold/10 text-brand-gold" : "border-brand-gold/10 text-brand-cream/55 hover:border-brand-gold/25"}`}
            >
              {label} ({value === "all" ? items.length : items.filter(item => item.target_platforms.includes(value)).length})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand-gold">
              الإجراءات السريعة
            </h2>
            <p className="text-xs text-brand-cream/40">
              لن تعود العناصر المحجوبة إلى الطابور إلا بعد اعتماد اتصال صالح؛ وتُحفظ نتائج النشر الناجحة لمنع التكرار.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={!retryable.length || busy}
              onClick={() => void runAction("retry_all_failed")}
            >
              إعادة محاولة الفاشلة/الجزئية ({retryable.length})
            </Button>
            <Button
              variant="outline"
              disabled={!selectedRetryableCount || busy}
              onClick={() => void runAction("retry")}
            >
              إعادة المحدد ({selectedRetryableCount})
            </Button>
            <Button
              variant="outline"
              disabled={!retryable.length || busy}
              onClick={() => void runAction("delete_failed")}
            >
              حذف الفاشلة/الجزئية ({retryable.length})
            </Button>
          </div>
        </div>
        <div className="hidden overflow-auto rounded-xl border border-brand-gold/10 sm:block">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-black/20 text-brand-cream/50">
              <tr>
                <th className="p-3 text-right">
                  <input
                    type="checkbox"
                    checked={allVisibleRetryableSelected}
                    onChange={toggleVisibleRetryable}
                    disabled={!visibleRetryable.length || busy}
                    aria-label="تحديد الفاشلة والنشر الجزئي الظاهر"
                  />
                </th>
                <th className="p-3 text-right">العنوان</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">المنصات</th>
                <th className="p-3 text-right">إحصاءات YouTube / Facebook Reels</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">الموعد</th>
                <th className="p-3 text-right">الخطأ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-gold/10">
              {filtered.map(item => {
                const status = STATUS_ORDER.includes(item.status as Status)
                  ? (item.status as Status)
                  : "failed";
                const deferredAt = facebookReelsDeferredUntil(item);
                const selectable = status === "failed" || status === "partial";
                return (
                  <tr key={item.id} className="align-top hover:bg-black/10">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        disabled={!selectable || busy}
                        onChange={() =>
                          setSelected(current =>
                            current.includes(item.id)
                              ? current.filter(id => id !== item.id)
                              : [...current, item.id]
                          )
                        }
                        aria-label={`تحديد ${item.title}`}
                      />
                    </td>
                    <td className="p-3 text-brand-cream">{item.title}</td>
                    <td className="p-3 text-brand-cream/55">
                      {item.content_type}
                    </td>
                    <td className="p-3 text-brand-cream/55">
                      {item.target_platforms.join("، ")}
                    </td>
                    <td className="p-3 text-xs text-brand-cream/60">{[youtubeInsightsSummary(item), facebookReelsInsightsSummary(item, health.facebookInsightsPermissionGranted === true)].filter(value => value !== "—").join(" · ")}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs ${STATUS_CLASSES[status]}`}
                      >
                        {deferredAt && status === "partial" ? "نشر جزئي — Reels مؤجل" : STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-brand-cream/40" dir="ltr">
                      {item.scheduled_at ?? "فوري"}
                    </td>
                    <td className="p-3 text-xs">
                      {deferredAt && (
                        <p className="mb-1 text-amber-300/80">
                          مؤجل تلقائيًا حتى {formatDeferredAt(deferredAt)}
                        </p>
                      )}
                      {item.error_message && !(/Facebook Reels publishing paused by provider cooldown until/i.test(item.error_message)) && (
                        <p className="text-red-300/80">{item.error_message}</p>
                      )}
                      {!deferredAt && !item.error_message && "—"}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-brand-cream/40"
                  >
                    لا توجد عناصر مطابقة.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 sm:hidden">
          {filtered.map(item => {
            const status = STATUS_ORDER.includes(item.status as Status)
              ? (item.status as Status)
              : "failed";
            const deferredAt = facebookReelsDeferredUntil(item);
            const selectable = status === "failed" || status === "partial";
            return (
              <article key={item.id} className="space-y-3 rounded-2xl border border-brand-gold/10 bg-black/15 p-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(item.id)}
                    disabled={!selectable || busy}
                    onChange={() =>
                      setSelected(current =>
                        current.includes(item.id)
                          ? current.filter(id => id !== item.id)
                          : [...current, item.id]
                      )
                    }
                    aria-label={`تحديد ${item.title}`}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words text-sm font-semibold leading-6 text-brand-cream">{item.title}</h3>
                    <p className="mt-1 text-xs text-brand-cream/50">{item.content_type} · {item.target_platforms.join("، ")}</p>
                    <p className="mt-1 text-xs text-brand-cream/55">{[youtubeInsightsSummary(item), facebookReelsInsightsSummary(item, health.facebookInsightsPermissionGranted === true)].filter(value => value !== "—").join(" · ")}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] ${STATUS_CLASSES[status]}`}>
                    {deferredAt && status === "partial" ? "نشر جزئي — Reels مؤجل" : STATUS_LABELS[status]}
                  </span>
                </div>
                <div className="space-y-1 border-t border-brand-gold/10 pt-2 text-xs leading-5">
                  <p className="text-brand-cream/45">الموعد: <span dir="ltr">{item.scheduled_at ?? "فوري"}</span></p>
                  {deferredAt && <p className="break-words text-amber-300/80">مؤجل تلقائيًا حتى {formatDeferredAt(deferredAt)}</p>}
                  {item.error_message && !(/Facebook Reels publishing paused by provider cooldown until/i.test(item.error_message)) && <p className="break-words text-red-300/80">الخطأ: {item.error_message}</p>}
                </div>
              </article>
            );
          })}
          {!loading && filtered.length === 0 && (
            <p className="rounded-xl border border-brand-gold/10 p-8 text-center text-sm text-brand-cream/40">
              لا توجد عناصر مطابقة.
            </p>
          )}
        </div>
      </Card>
      )}
    </Container>
  );
}
