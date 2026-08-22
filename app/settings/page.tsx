"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  usePrayerAlert,
  PRAYERS,
  PRAYER_NAMES_AR,
  type PrayerKey,
} from "@/hooks/use-prayer-alert";
import {
  useSalawatReminder,
  type SalawatInterval,
} from "@/hooks/use-salawat-reminder";
import { isAudioUnlocked } from "@/lib/audio/spiritual-tones";
import { hydrateOfflineContent } from "@/lib/offline-pack";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <span className="text-sm text-brand-cream/80">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold ${
          checked
            ? "border-brand-gold bg-brand-gold/20"
            : "border-brand-cream/20 bg-transparent"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-brand-gold transition-transform ${
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="space-y-5 p-6">
      <div className="border-b border-brand-gold/15 pb-4">
        <h2 className="text-xl font-bold text-brand-gold" dir="rtl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-brand-cream/50" dir="rtl">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

const INTERVAL_OPTIONS: { value: SalawatInterval; label: string }[] = [
  { value: 15, label: "كل 15 دقيقة" },
  { value: 30, label: "كل 30 دقيقة" },
  { value: 60, label: "كل ساعة" },
  { value: 0, label: "معطل" },
];

export default function SettingsPage() {
  const {
    settings: azanSettings,
    notificationPermission,
    togglePrayer,
    unlockAudio,
    requestPermission,
    enableServerPush,
    testAzan,
  } = usePrayerAlert();

  const {
    settings: salawatSettings,
    setEnabled: setSalawatEnabled,
    setIntervalMinutes,
    setQuietHours,
    testReminder,
  } = useSalawatReminder();

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pushMessage, setPushMessage] = useState<string | null>(null);
  const [isRefreshingOfflineData, setIsRefreshingOfflineData] = useState(false);
  const [offlineRefreshMessage, setOfflineRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    setAudioUnlocked(isAudioUnlocked());
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleUnlockAudio = () => {
    unlockAudio();
    setAudioUnlocked(isAudioUnlocked());
  };

  const handleEnableServerPush = async () => {
    setPushMessage(null);
    try {
      const result = await enableServerPush();
      if (result.status === "registered") {
        setPushMessage("تم تفعيل تنبيهات الصلاة في الخلفية لهذا الجهاز.");
      } else if (result.status === "unsupported") {
        setPushMessage("هذا المتصفح لا يدعم إشعارات الدفع الآمنة.");
      } else {
        setPushMessage("يتم تجهيز خدمة الإشعارات. أعد المحاولة بعد دقيقة.");
      }
    } catch (error) {
      setPushMessage(
        error instanceof Error ? error.message : "تعذر تفعيل إشعارات الخلفية."
      );
    }
  };

  const handleSkipWaiting = async () => {
    if (!navigator.onLine) {
      setOfflineRefreshMessage("اتصل بالإنترنت أولًا لتحديث البيانات المخزنة.");
      return;
    }

    setIsRefreshingOfflineData(true);
    setOfflineRefreshMessage(null);
    try {
      const result = await hydrateOfflineContent({ force: true });
      if (!result) {
        setOfflineRefreshMessage("تعذر الوصول إلى حزمة البيانات الآن.");
      } else if (result.complete) {
        setOfflineRefreshMessage("تم تحديث البيانات المخزنة بنجاح.");
      } else {
        setOfflineRefreshMessage(
          `اكتمل التحديث جزئيًا؛ تعذر تحديث: ${result.failedDatasets.join(", ")}.`,
        );
      }

      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        await registration?.update();
      }
    } catch (error) {
      console.warn("[Settings] Offline data refresh failed", error);
      setOfflineRefreshMessage("تعذر تحديث البيانات المخزنة. حاول مرة أخرى.");
    } finally {
      setIsRefreshingOfflineData(false);
    }
  };

  const permLabel =
    notificationPermission === "granted"
      ? "مفعّلة"
      : notificationPermission === "denied"
        ? "محظورة (غيّر الإعداد يدويًا من متصفحك)"
        : notificationPermission === "unsupported"
          ? "غير مدعومة في هذا المتصفح"
          : "غير مفعّلة";

  return (
    <Container className="py-12 space-y-8 max-w-2xl" dir="rtl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-brand-gold">الإعدادات</h1>
        <p className="text-brand-cream/60">
          تحكّم في التنبيهات والأصوات وتجربة التطبيق
        </p>
      </div>

      {/* Section 1 — Azan */}
      <SectionCard
        title="الأذان وتنبيهات الصلاة"
        description="يمكنك تفعيل الأذان المحلي أثناء فتح التطبيق، وتنبيهات دفع آمنة تعمل حتى بعد إغلاق الصفحة عند تسجيل الدخول."
      >
        {/* Audio unlock */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-brand-cream">
              {audioUnlocked ? "الصوت مفعّل" : "تفعيل الصوت"}
            </p>
            <p className="text-xs text-brand-cream/50">
              المتصفح يحتاج إذنًا صريحًا لتشغيل الصوت
            </p>
          </div>
          <Button
            variant={audioUnlocked ? "ghost" : "primary"}
            onClick={handleUnlockAudio}
            className="text-sm"
          >
            {audioUnlocked ? "تم التفعيل" : "تفعيل الصوت"}
          </Button>
        </div>

        {/* Per-prayer toggles */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-cream/40">
            الصلوات
          </p>
          {PRAYERS.map((p: PrayerKey) => (
            <Toggle
              key={p}
              label={PRAYER_NAMES_AR[p]}
              checked={azanSettings.enabledPrayers[p]}
              onChange={() => togglePrayer(p)}
            />
          ))}
        </div>

        {/* Test button */}
        <Button
          variant="secondary"
          onClick={testAzan}
          className="w-full text-sm"
        >
          اختبار صوت الأذان
        </Button>

        {/* Notification permission */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-brand-cream/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-brand-cream">
              إشعارات المتصفح
            </p>
            <p className="text-xs text-brand-cream/50">{permLabel}</p>
          </div>
          {notificationPermission === "default" && (
            <Button
              variant="secondary"
              onClick={requestPermission}
              className="text-sm"
            >
              طلب الإذن
            </Button>
          )}
        </div>

        {notificationPermission !== "denied" &&
          notificationPermission !== "unsupported" && (
            <div className="rounded-lg border border-brand-gold/20 bg-brand-gold/5 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand-cream">
                    تنبيهات الصلاة في الخلفية
                  </p>
                  <p className="text-xs text-brand-cream/50">
                    تتطلب تسجيل الدخول، وتبقى فعّالة عند إغلاق الصفحة على
                    الأجهزة المدعومة.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => void handleEnableServerPush()}
                  className="text-sm"
                >
                  تفعيل
                </Button>
              </div>
              {pushMessage && (
                <p className="mt-2 text-xs text-brand-cream/70">
                  {pushMessage}
                </p>
              )}
            </div>
          )}
      </SectionCard>

      {/* Section 2 — Salawat reminder */}
      <SectionCard
        title="تذكير الصلاة على النبي"
        description="تذكير دوري قابل للتخصيص. معطّل افتراضيًا — فعّله بنفسك للتحكم الكامل."
      >
        <Toggle
          label="تفعيل التذكير"
          checked={salawatSettings.enabled}
          onChange={setSalawatEnabled}
        />

        {salawatSettings.enabled && (
          <>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-cream/40">
                الفترة بين التذكيرات
              </p>
              <div className="grid grid-cols-2 gap-2">
                {INTERVAL_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setIntervalMinutes(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      salawatSettings.intervalMinutes === opt.value
                        ? "border-brand-gold bg-brand-gold/15 text-brand-gold"
                        : "border-brand-cream/15 text-brand-cream/60 hover:border-brand-gold/40"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={testReminder}
              className="w-full text-sm"
            >
              اختبار التذكير الآن
            </Button>
          </>
        )}
      </SectionCard>

      {/* Section 3 — Quiet hours */}
      <SectionCard
        title="أوقات الهدوء"
        description="خلال هذه الأوقات يتم تعطيل أصوات التذكير والإشعارات."
      >
        <Toggle
          label="تفعيل أوقات الهدوء"
          checked={salawatSettings.quietHours.enabled}
          onChange={v => setQuietHours({ enabled: v })}
        />

        {salawatSettings.quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                className="text-xs text-brand-cream/50"
                htmlFor="quiet-from"
              >
                من
              </label>
              <input
                id="quiet-from"
                type="time"
                value={salawatSettings.quietHours.from}
                onChange={e => setQuietHours({ from: e.target.value })}
                className="w-full rounded-lg border border-brand-cream/15 bg-black/30 px-3 py-2 text-brand-cream focus:border-brand-gold focus:outline-none"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-brand-cream/50" htmlFor="quiet-to">
                إلى
              </label>
              <input
                id="quiet-to"
                type="time"
                value={salawatSettings.quietHours.to}
                onChange={e => setQuietHours({ to: e.target.value })}
                className="w-full rounded-lg border border-brand-cream/15 bg-black/30 px-3 py-2 text-brand-cream focus:border-brand-gold focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>
        )}
      </SectionCard>

      {/* Section 4 — Offline / PWA */}
      <SectionCard
        title="وضع الإنترنت والتطبيق"
        description="معلومات حول حالة الاتصال والنسخة المخزنة أوفلاين."
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
          />
          <span className="text-sm text-brand-cream/80">
            {isOnline ? "متصل بالإنترنت" : "غير متصل — يعمل أوفلاين"}
          </span>
        </div>

        <p className="text-xs text-brand-cream/40">
          الصفحات الرئيسية (القرآن، الأذكار، الصلاة، الأدعية، التسبيح، الورد،
          الزكاة) تُحفظ تلقائيًا عند زيارتها لتعمل بدون إنترنت. ثبّت التطبيق على
          شاشتك الرئيسية لتجربة أقرب لتطبيقات الموبايل.
        </p>

        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" href="/wird" className="text-sm">
            الورد وختم القرآن
          </Button>
          <Button variant="ghost" href="/zakat" className="text-sm">
            الزكاة والتذكير
          </Button>
        </div>

        <Button
          variant="secondary"
          onClick={handleSkipWaiting}
          disabled={isRefreshingOfflineData}
          className="w-full text-sm"
        >
          {isRefreshingOfflineData ? "جارٍ تحديث البيانات..." : "تحديث البيانات المخزنة"}
        </Button>
        {offlineRefreshMessage && (
          <p role="status" className="text-center text-sm text-brand-cream/70">
            {offlineRefreshMessage}
          </p>
        )}
      </SectionCard>
    </Container>
  );
}
