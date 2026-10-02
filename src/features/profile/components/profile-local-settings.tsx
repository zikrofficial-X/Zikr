"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getQuranAudioUsage,
  clearQuranAudioDownloads,
} from "@/features/quran/services/offline-audio";
import {
  requestNotificationPermission,
} from "@/features/notifications/services/notifications";
import {
  cancelQuranReminderSchedule,
  scheduleQuranReminder,
} from "@/features/notifications/services/quran-reminder";

type Props = {
  initialReminder: {
    quran_enabled: boolean;
    quran_time: string;
    quran_message: string;
  };
};

export function ProfileLocalSettings({ initialReminder }: Props) {
  const [enabled, setEnabled] = useState(initialReminder.quran_enabled);
  const [time, setTime] = useState(initialReminder.quran_time);
  const [message, setMessage] = useState(initialReminder.quran_message);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [clearingDownloads, setClearingDownloads] = useState(false);

  const sizeLabel = useMemo(() => {
    if (!downloadedBytes) return "0 MB";
    const mb = downloadedBytes / 1024 / 1024;
    return mb < 1024
      ? `${mb.toFixed(1)} MB`
      : `${(mb / 1024).toFixed(2)} GB`;
  }, [downloadedBytes]);

  const refreshUsage = async () => {
    const usage = await getQuranAudioUsage();
    setDownloadedCount(usage.count);
    setDownloadedBytes(usage.bytes);
  };

  useEffect(() => {
    void refreshUsage();
  }, []);

  async function saveReminder(nextEnabled = enabled) {
    setSaving(true);
    setStatus(null);
    try {
      const response = await fetch("/api/reminders/background", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quran_enabled: nextEnabled,
          quran_time: time,
          quran_message: message,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "تعذر حفظ إعداد التذكير.");
      }

      setEnabled(nextEnabled);
      if (nextEnabled) {
        const permission = await requestNotificationPermission();
        if (permission === "granted") {
          const nativeScheduled = await scheduleQuranReminder(true, time, message);
          setStatus(
            nativeScheduled
              ? "تم حفظ التذكير ووجدولته على الهاتف لمدة 14 يومًا، ووسيُعاد ضبط الجدول تلقائيًا عند فتح التطبيق."
              : "تم حفظ التذكير. يعمل الجدول الأصلي على التطبيق المحمول عند تفعيل الإشعارات.",
          );
        } else {
          setStatus("تم حفظ التذكير، لكن إذن الإشعارات غير مفعّل على الجهاز.");
        }
      } else {
        await cancelQuranReminderSchedule();
        setStatus("تم إيقاف تذكير الورد اليومي.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر حفظ إعداد التذكير.");
    } finally {
      setSaving(false);
    }
  }

  async function clearDownloads() {
    setClearingDownloads(true);
    try {
      await clearQuranAudioDownloads();
      await refreshUsage();
      setStatus("تم حذف التلاوات المحفوظة من مساحة الجهاز فقط.");
    } catch {
      setStatus("تعذر تنظيف التلاوات المحلية بالكامل.");
    } finally {
      setClearingDownloads(false);
    }
  }

  return (
    <>
      <Card className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-gold/70">
            OFFLINE QURAN
          </p>
          <h2 className="text-2xl font-bold text-brand-gold">مكتبة التلاوات على جهازك</h2>
          <p className="leading-8 text-brand-cream/70">
            التلاوات المحفوظة هنا لا تُرفع إلى مساحة ذِكر. يتم تنزيلها داخل مساحة التطبيق على جهازك،
            مثل فكرة التنزيلات في تطبيقات الصوت، وتظل قابلة للتشغيل عند انقطاع الإنترنت.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
            <p className="text-xs text-brand-cream/50">السور المحفوظة</p>
            <p className="mt-2 text-3xl font-bold text-brand-gold">{downloadedCount.toLocaleString("ar-EG")}</p>
          </div>
          <div className="rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
            <p className="text-xs text-brand-cream/50">المساحة المستخدمة</p>
            <p className="mt-2 text-3xl font-bold text-brand-gold">{sizeLabel}</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={clearDownloads}
          disabled={clearingDownloads || downloadedCount === 0}
          className="border border-red-400/20 text-red-200 hover:bg-red-500/10"
        >
          {clearingDownloads ? "جاري حذف التنزيلات..." : "حذف كل التلاوات من الجهاز"}
        </Button>
      </Card>

      <Card className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-brand-gold/70">
            DAILY QURAN REMINDER
          </p>
          <h2 className="text-2xl font-bold text-brand-gold">موعد هادئ مع القرآن</h2>
          <p className="leading-8 text-brand-cream/70">
            اختر وقتًا واحدًا كل يوم ليذكرك التطبيق بأن تترك ما في يدك قليلًا وتعود إلى وردك.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-brand-gold/15 bg-black/15 p-4">
          <div>
            <p className="font-semibold text-brand-cream">تذكير الورد اليومي</p>
            <p className="mt-1 text-sm text-brand-cream/50">
              يظهر كتذكير محلي على الهاتف دون الحاجة إلى اتصال دائم بالإنترنت.
            </p>
          </div>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              void saveReminder(event.target.checked);
            }}
            className="h-5 w-5 accent-[var(--brand-gold)]"
            aria-label="تفعيل تذكير الورد"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-brand-cream/70">وقت التذكير</span>
            <input
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              className="w-full rounded-xl border border-brand-gold/20 bg-black/20 p-3 text-brand-cream"
            />
          </label>

          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-brand-cream/70">رسالة التذكير</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, 240))}
              rows={3}
              className="w-full rounded-xl border border-brand-gold/20 bg-black/20 p-3 text-brand-cream leading-7"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => void saveReminder()} disabled={saving}>
            {saving ? "جاري الحفظ..." : "حفظ وجدولة التذكير"}
          </Button>
          {status && <p className="text-sm text-brand-cream/60">{status}</p>}
        </div>
      </Card>
    </>
  );
}
