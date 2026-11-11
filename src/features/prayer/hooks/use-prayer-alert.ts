"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  unlockAudioContext,
  isAudioUnlocked,
  refreshSiteAudio,
  playAzanClip,
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
import { getSavedPrayerLocation, loadLocalPrayerLocation } from "@/features/prayer/services/saved-prayer-location";
import { getMinutesOfDayInTimeZone, getPrayerTimes } from "@/features/prayer/services/prayer-times";
import {
  addCalendarDays,
  getPrayerAlertDateKey,
  getPrayerNotificationIdsToCancel,
  formatDateInTimeZone,
  getZonedDateTime,
} from "@/features/prayer/services/prayer-notification-schedule";

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
const PRAYER_NATIVE_ID_BASE = 7000;
const PRAYER_SCHEDULE_DAYS = 4;
const SETTINGS_UPDATED_EVENT = "zikr:prayer-settings-updated";
let nativePrayerScheduleGeneration = 0;

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
function getAlertKey(prayer: PrayerKey, timeZone?: string): string {
  const dateKey = getPrayerAlertDateKey(new Date(), timeZone);
  return `zikr_alert_${prayer}_${dateKey}`;
}

function alreadyFired(prayer: PrayerKey, timeZone?: string): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(getAlertKey(prayer, timeZone)) === "1";
}

function markFired(prayer: PrayerKey, timeZone?: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(getAlertKey(prayer, timeZone), "1");
}

async function scheduleNativePrayerNotifications(
  settings: AzanSettings,
  timings: Record<string, string> | null,
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

  const generation = ++nativePrayerScheduleGeneration;
  const nativeIds = Array.from(
    { length: PRAYER_SCHEDULE_DAYS * PRAYERS.length },
    (_, index) => PRAYER_NATIVE_ID_BASE + index,
  );
  const location = loadLocalPrayerLocation();
  if (!location || !PRAYERS.some(prayer => settings.enabledPrayers[prayer])) {
    if (generation === nativePrayerScheduleGeneration) {
      await native.cancelLocalNotifications?.(nativeIds);
    }
    return;
  }

  const timeZone = location.timezone;
  const now = new Date();
  const today = formatDateInTimeZone(now, timeZone) ?? formatLocalDate(now);
  const nativeAudio = getNativeAudio("prayer");
  const refreshedPrayerIds = new Set<number>();
  const scheduleEntries: Array<{ id: number; prayer: PrayerKey; scheduleAt: string }> = [];

  // Resolve the complete refresh plan before cancelling existing alarms. A
  // failed future-day lookup must not erase a valid alarm already on-device.
  for (let dayOffset = 0; dayOffset < PRAYER_SCHEDULE_DAYS; dayOffset += 1) {
    if (generation !== nativePrayerScheduleGeneration) return;
    const dateKey = addCalendarDays(today, dayOffset);
    if (!dateKey) continue;

    let dayTimings: Record<string, string> | null =
      dayOffset === 0 && timings && Object.keys(timings).length > 0
        ? timings
        : null;
    if (!dayTimings) {
      const response = await getPrayerTimes(
        location.latitude,
        location.longitude,
        dateKey,
      ).catch(() => null);
      if (generation !== nativePrayerScheduleGeneration) return;
      const providerTimings = response?.data?.timings;
      dayTimings = providerTimings && Object.keys(providerTimings).length > 0
        ? { ...providerTimings }
        : null;
    }
    if (!dayTimings) continue;

    for (const prayer of PRAYERS) {
      if (!settings.enabledPrayers[prayer]) continue;
      const scheduled = getZonedDateTime(
        dateKey,
        timeZone,
        dayTimings[prayer] ?? "",
      );
      if (!scheduled) continue;

      const id =
        PRAYER_NATIVE_ID_BASE +
        dayOffset * PRAYERS.length +
        PRAYERS.indexOf(prayer);
      refreshedPrayerIds.add(id);
      if (scheduled <= now) continue;
      scheduleEntries.push({ id, prayer, scheduleAt: scheduled.toISOString() });
    }
  }

  if (generation !== nativePrayerScheduleGeneration) return;
  const idsToCancel = getPrayerNotificationIdsToCancel({
    scheduleDays: PRAYER_SCHEDULE_DAYS,
    prayers: PRAYERS,
    enabledPrayers: settings.enabledPrayers,
    refreshedPrayerIds: [...refreshedPrayerIds],
    idBase: PRAYER_NATIVE_ID_BASE,
  });
  if (idsToCancel.length > 0) {
    await native.cancelLocalNotifications?.(idsToCancel);
  }
  if (generation !== nativePrayerScheduleGeneration) return;

  for (const entry of scheduleEntries) {
    if (generation !== nativePrayerScheduleGeneration) return;
    try {
      await native.scheduleLocalNotification({
        id: entry.id,
        title: `حان وقت صلاة ${PRAYER_NAMES_AR[entry.prayer]}`,
        body: "الصلاة خير من النوم — حافظ على صلاتك",
        scheduleAt: entry.scheduleAt,
        sound: nativeAudio.sound,
        channelId: nativeAudio.channelId,
      });
    } catch (error) {
      console.warn(
        "[prayer-alert] Native notification scheduling failed",
        error,
      );
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
  const [currentTimings, setCurrentTimings] =
    useState<Record<string, string> | null>(null);
  const alertCallbackRef = useRef<((p: PrayerKey) => void) | null>(null);
  const settingsRef = useRef(settings);
  const pendingServerPushSyncRef = useRef(false);
  settingsRef.current = settings;

  const syncExistingServerPush = useCallback(async (
    enabledPrayers: Record<PrayerKey, boolean>,
  ) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) return;
      await registerPrayerPushSubscription({ enabledPrayers });
    } catch (error) {
      console.warn("[prayer-alert] Existing server push preference sync failed", error);
    }
  }, []);

  useEffect(() => {
    if (!pendingServerPushSyncRef.current) return;
    pendingServerPushSyncRef.current = false;
    void syncExistingServerPush(settings.enabledPrayers);
  }, [settings.enabledPrayers, syncExistingServerPush]);

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

  // The durable location now lives under zikr_prayer_location_v2. Load the
  // current day's timings from that saved location instead of relying on the
  // retired legacy cache key that no longer has any writers.
  useEffect(() => {
    if (passive) return;
    let disposed = false;

    const refreshTimings = async () => {
      try {
        const location =
          loadLocalPrayerLocation() ?? (await getSavedPrayerLocation());
        if (!location) {
          if (!disposed) setCurrentTimings(null);
          return;
        }
        const response = await getPrayerTimes(
          location.latitude,
          location.longitude,
        );
        if (!disposed) {
          setCurrentTimings(
            response?.data?.timings
              ? ({ ...response.data.timings } as Record<string, string>)
              : null,
          );
        }
      } catch (error) {
        console.warn("[prayer-alert] Current prayer timings refresh failed", error);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState !== "hidden") void refreshTimings();
    };
    const syncPushContext = () => {
      if (document.visibilityState === "hidden") return;
      void syncExistingServerPush(settingsRef.current.enabledPrayers);
    };

    void refreshTimings();
    window.addEventListener("zikr:prayer-location-updated", refreshWhenVisible);
    window.addEventListener("zikr:prayer-location-saved", refreshWhenVisible);
    window.addEventListener("zikr:native-ready", refreshWhenVisible);
    window.addEventListener("zikr:native-resumed", refreshWhenVisible);
    window.addEventListener("zikr:prayer-location-updated", syncPushContext);
    window.addEventListener("zikr:prayer-location-saved", syncPushContext);
    window.addEventListener("zikr:native-resumed", syncPushContext);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    const refreshInterval = window.setInterval(
      () => void refreshTimings(),
      60 * 60 * 1000,
    );

    return () => {
      disposed = true;
      window.clearInterval(refreshInterval);
      window.removeEventListener("zikr:prayer-location-updated", refreshWhenVisible);
      window.removeEventListener("zikr:prayer-location-saved", refreshWhenVisible);
      window.removeEventListener("zikr:native-ready", refreshWhenVisible);
      window.removeEventListener("zikr:native-resumed", refreshWhenVisible);
      window.removeEventListener("zikr:prayer-location-updated", syncPushContext);
      window.removeEventListener("zikr:prayer-location-saved", syncPushContext);
      window.removeEventListener("zikr:native-resumed", syncPushContext);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [passive]);

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
  // background delivery. Both paths use the selected location's IANA timezone.
  useEffect(() => {
    if (passive) return;
    let disposed = false;
    const schedule = () => {
      if (disposed) return;
      void scheduleNativePrayerNotifications(settings, currentTimings).catch(error => {
        console.warn("[prayer-alert] Native schedule refresh failed", error);
      });
    };

    const check = () => {
      if (!currentTimings) return;
      const now = new Date();
      const timeZone = loadLocalPrayerLocation()?.timezone;
      const currentMinutes = getMinutesOfDayInTimeZone(now, timeZone);

      for (const prayer of PRAYERS) {
        if (!settings.enabledPrayers[prayer]) continue;
        const parsed = parsePrayerTime(currentTimings[prayer] ?? "");
        if (!parsed) continue;
        const diff = Math.abs(
          parsed.hours * 60 + parsed.minutes - currentMinutes,
        );

        if (diff <= 1 && !alreadyFired(prayer, timeZone)) {
          markFired(prayer, timeZone);
          void showPrayerNotification(PRAYER_NAMES_AR[prayer]);
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
    const interval = window.setInterval(check, 30_000);
    const handleResume = () => {
      if (document.visibilityState === "hidden") return;
      schedule();
    };
    window.addEventListener("zikr:native-ready", schedule);
    window.addEventListener("zikr:native-app-state", handleResume);
    window.addEventListener("zikr:prayer-location-updated", schedule);
    window.addEventListener("zikr:native-notification-permission", schedule);
    document.addEventListener("visibilitychange", handleResume);
    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("zikr:native-ready", schedule);
      window.removeEventListener("zikr:native-app-state", handleResume);
      window.removeEventListener("zikr:prayer-location-updated", schedule);
      window.removeEventListener("zikr:native-notification-permission", schedule);
      document.removeEventListener("visibilitychange", handleResume);
    };
  }, [settings, passive, currentTimings]);

  const togglePrayer = useCallback((p: PrayerKey) => {
    pendingServerPushSyncRef.current = true;
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
    if (result === "granted") {
      window.dispatchEvent(new CustomEvent("zikr:native-notification-permission"));
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
