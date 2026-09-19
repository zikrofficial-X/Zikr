"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  playAzanClip,
  unlockAudioContext,
  isAudioUnlocked,
  refreshSiteAudio,
} from "@/lib/audio/spiritual-tones";
import {
  showPrayerNotification,
  requestNotificationPermission,
} from "@/features/notifications/services/notifications";
import type { NotificationPermission as PermResult } from "@/features/notifications/services/notifications";
import {
  registerPrayerPushSubscription,
  type PushSubscriptionRegistrationResult,
} from "@/lib/push-subscription";
import { getNativeAudio } from "@/lib/audio/config";

export type PrayerKey = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export interface AzanSettings {
  enabledPrayers: Record<PrayerKey, boolean>;
  audioUnlocked: boolean;
}

const PRAYERS: PrayerKey[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
const PRAYER_NAMES_AR: Record<PrayerKey, string> = {
  Fajr: "الفجر",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};
const SETTINGS_KEY = "zikr_azan_settings";
const LOCATION_KEY = "zikr_prayer_location";
const PRAYER_NATIVE_ID_BASE = 7000;
const PRAYER_SCHEDULE_DAYS = 4;
const SETTINGS_UPDATED_EVENT = "zikr:prayer-settings-updated";

const DEFAULT_SETTINGS: AzanSettings = {
  enabledPrayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
  audioUnlocked: false,
};

function loadSettings(): AzanSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: AzanSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

type CachedPrayerLocation = {
  lat?: number;
  lon?: number;
  city?: string;
  timings?: Record<string, string>;
  date?: unknown;
  cachedAt?: number;
};

function getCachedPrayerLocation(): CachedPrayerLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedPrayerLocation;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function getTimings(): Record<string, string> | null {
  return getCachedPrayerLocation()?.timings ?? null;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parsePrayerTime(
  value: string
): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/** Dedup key: fires once per prayer per calendar day. */
function getAlertKey(prayer: PrayerKey): string {
  return `zikr_alert_${prayer}_${formatLocalDate(new Date())}`;
}

function alreadyFired(prayer: PrayerKey): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(getAlertKey(prayer)) === "1";
}

function markFired(prayer: PrayerKey): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getAlertKey(prayer), "1");
}

async function scheduleNativePrayerNotifications(
  settings: AzanSettings,
  timings: Record<string, string>
): Promise<void> {
  if (typeof window === "undefined") return;
  const native = (
    window as Window & {
      zikrNative?: {
        scheduleLocalNotification?: (notification: {
          id: number;
          title: string;
          body: string;
          scheduleAt: string;
          sound?: string;
          channelId?: string;
        }) => Promise<void>;
        cancelLocalNotifications?: (ids: number[]) => Promise<void>;
      };
    }
  ).zikrNative;
  if (!native?.scheduleLocalNotification) return;

  const nativeIds = Array.from(
    { length: PRAYER_SCHEDULE_DAYS * PRAYERS.length },
    (_, index) => PRAYER_NATIVE_ID_BASE + index
  );
  await native.cancelLocalNotifications?.(nativeIds);
  if (!PRAYERS.some(prayer => settings.enabledPrayers[prayer])) return;

  const cachedLocation = getCachedPrayerLocation();
  const now = new Date();
  const nativeAudio = getNativeAudio("prayer");
  for (let dayOffset = 0; dayOffset < PRAYER_SCHEDULE_DAYS; dayOffset += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + dayOffset);

    let dayTimings: Record<string, string> | null =
      dayOffset === 0 ? timings : null;
    if (
      !dayTimings &&
      typeof cachedLocation?.lat === "number" &&
      typeof cachedLocation.lon === "number"
    ) {
      // Reuse the already-authorized/cached coordinates. This path never
      // triggers a browser or native location permission prompt.
      const response = await fetch(
        `/api/prayer-times?latitude=${encodeURIComponent(cachedLocation.lat)}&longitude=${encodeURIComponent(cachedLocation.lon)}&date=${encodeURIComponent(formatLocalDate(date))}`,
        { cache: "force-cache" }
      ).catch(() => null);
      const data = response?.ok
        ? ((await response.json().catch(() => null)) as {
            data?: { timings?: Record<string, string> };
          } | null)
        : null;
      dayTimings = data?.data?.timings ?? null;
    }
    if (!dayTimings) dayTimings = timings;

    for (const prayer of PRAYERS) {
      if (!settings.enabledPrayers[prayer]) continue;
      const parsed = parsePrayerTime(dayTimings[prayer] ?? "");
      if (!parsed) continue;

      const scheduled = new Date(date);
      scheduled.setHours(parsed.hours, parsed.minutes, 0, 0);
      if (scheduled <= now) continue;

      const id =
        PRAYER_NATIVE_ID_BASE +
        dayOffset * PRAYERS.length +
        PRAYERS.indexOf(prayer);
      try {
        await native.scheduleLocalNotification({
          id,
          title: `حان وقت صلاة ${PRAYER_NAMES_AR[prayer]}`,
          body: "الصلاة خير من النوم — حافظ على صلاتك",
          scheduleAt: scheduled.toISOString(),
          sound: nativeAudio.sound,
          channelId: nativeAudio.channelId,
        });
      } catch (error) {
        console.warn(
          "[prayer-alert] Native notification scheduling failed",
          error
        );
      }
    }
  }
}

export interface PrayerAlertReturn {
  settings: AzanSettings;
  notificationPermission: PermResult;
  togglePrayer: (p: PrayerKey) => void;
  unlockAudio: () => void;
  requestPermission: () => Promise<void>;
  enableServerPush: () => Promise<PushSubscriptionRegistrationResult>;
  requestNativeExactAlarmPermission: () => Promise<
    "granted" | "opened" | "unsupported"
  >;
  testAzan: () => void;
  onAlertFired: (cb: (prayer: PrayerKey) => void) => void;
}

export function usePrayerAlert(
  options: { passive?: boolean } = {}
): PrayerAlertReturn {
  const passive = options.passive ?? false;
  const [settings, setSettings] = useState<AzanSettings>(DEFAULT_SETTINGS);
  const [notificationPermission, setNotificationPermission] =
    useState<PermResult>("default");
  const alertCallbackRef = useRef<((p: PrayerKey) => void) | null>(null);

  useEffect(() => {
    void refreshSiteAudio();
  }, []);

  // Load settings and check notification permission on mount
  useEffect(() => {
    setSettings(loadSettings());
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission as PermResult);
    }
  }, []);

  // Keep every hook instance synchronized with settings changes. The page
  // instance is passive, while the app-shell instance reacts by rescheduling
  // native alarms without creating a second scheduler.
  useEffect(() => {
    const syncSettings = () => setSettings(loadSettings());
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
    return () =>
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
  }, []);

  // Keep the foreground loop for the open browser, but use native alarms for
  // Android background delivery. Reschedule only from cached prayer timings.
  // Browser/native location permission is requested by the explicit location
  // controls in the prayer features, never by the global app shell.
  useEffect(() => {
    if (passive) return;
    let disposed = false;
    const schedule = () => {
      if (disposed) return;
      const timings = getTimings();
      if (!timings) return;
      void scheduleNativePrayerNotifications(settings, timings).catch(error => {
        console.warn("[prayer-alert] Native schedule refresh failed", error);
      });
    };

    const check = () => {
      const timings = getTimings();
      if (!timings) return;

      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

      for (const prayer of PRAYERS) {
        if (!settings.enabledPrayers[prayer]) continue;
        const prayerTime = timings[prayer];
        if (!prayerTime) continue;

        const parsed = parsePrayerTime(prayerTime);
        const [nh, nm] = hhmm.split(":").map(Number);
        if (!parsed || !Number.isFinite(nh) || !Number.isFinite(nm)) continue;
        const diff = Math.abs(
          parsed.hours * 60 + parsed.minutes - (nh * 60 + nm)
        );

        if (diff <= 1 && !alreadyFired(prayer)) {
          markFired(prayer);
          playAzanClip();
          showPrayerNotification(PRAYER_NAMES_AR[prayer]);
          alertCallbackRef.current?.(prayer);
          if (
            "serviceWorker" in navigator &&
            navigator.serviceWorker.controller
          ) {
            navigator.serviceWorker.controller.postMessage({
              type: "SHOW_PRAYER_NOTIFICATION",
              prayerName: PRAYER_NAMES_AR[prayer],
            });
          }
        }
      }
    };

    schedule();
    check();
    const interval = setInterval(check, 30_000);
    const handleResume = () => {
      if (document.visibilityState === "hidden") return;
      schedule();
    };
    window.addEventListener("zikr:native-ready", schedule);
    window.addEventListener("zikr:native-app-state", handleResume);
    window.addEventListener("zikr:prayer-location-updated", schedule);
    document.addEventListener("visibilitychange", handleResume);
    return () => {
      disposed = true;
      clearInterval(interval);
      window.removeEventListener("zikr:native-ready", schedule);
      window.removeEventListener("zikr:native-app-state", handleResume);
      window.removeEventListener("zikr:prayer-location-updated", schedule);
      document.removeEventListener("visibilitychange", handleResume);
    };
  }, [settings, passive]);

  const togglePrayer = useCallback((p: PrayerKey) => {
    setSettings(prev => {
      const next: AzanSettings = {
        ...prev,
        enabledPrayers: {
          ...prev.enabledPrayers,
          [p]: !prev.enabledPrayers[p],
        },
      };
      saveSettings(next);
      window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
      return next;
    });
  }, []);

  const unlockAudio = useCallback(() => {
    unlockAudioContext();
    setSettings(prev => {
      const next = { ...prev, audioUnlocked: isAudioUnlocked() };
      saveSettings(next);
      window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    if (result !== "unsupported") {
      setNotificationPermission(result);
    }
  }, []);

  const enableServerPush =
    useCallback(async (): Promise<PushSubscriptionRegistrationResult> => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        return { status: "unsupported" };
      }

      if (Notification.permission !== "granted") {
        const result = await requestNotificationPermission();
        if (result !== "granted") {
          return {
            status: result === "unsupported" ? "unsupported" : "unavailable",
          };
        }
        setNotificationPermission(result);
      }

      return registerPrayerPushSubscription({
        enabledPrayers: settings.enabledPrayers,
      });
    }, [settings.enabledPrayers]);

  const requestNativeExactAlarmPermission = useCallback(async (): Promise<
    "granted" | "opened" | "unsupported"
  > => {
    if (typeof window === "undefined") return "unsupported";
    const native = (
      window as Window & {
        zikrNative?: {
          checkExactNotificationSetting?: () => Promise<unknown>;
          changeExactNotificationSetting?: () => Promise<unknown>;
        };
      }
    ).zikrNative;
    if (!native?.checkExactNotificationSetting) return "unsupported";

    try {
      const status = await native.checkExactNotificationSetting();
      const exact = status as
        { exact_alarm?: string; exactAlarm?: string } | undefined;
      if (exact?.exact_alarm === "granted" || exact?.exactAlarm === "granted")
        return "granted";
      if (native.changeExactNotificationSetting) {
        await native.changeExactNotificationSetting();
        return "opened";
      }
    } catch (error) {
      console.warn(
        "[prayer-alert] Exact alarm permission request failed",
        error
      );
    }
    return "unsupported";
  }, []);

  const testAzan = useCallback(() => {
    unlockAudioContext();
    playAzanClip();
  }, []);

  const onAlertFired = useCallback((cb: (prayer: PrayerKey) => void) => {
    alertCallbackRef.current = cb;
  }, []);

  return {
    settings,
    notificationPermission,
    togglePrayer,
    unlockAudio,
    requestPermission,
    enableServerPush,
    requestNativeExactAlarmPermission,
    testAzan,
    onAlertFired,
  };
}

export { PRAYERS, PRAYER_NAMES_AR };
