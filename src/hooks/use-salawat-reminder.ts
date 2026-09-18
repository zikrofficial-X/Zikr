"use client";

import { useState, useEffect, useCallback } from "react";
import {
  playSalawatClip,
  unlockAudioContext,
  refreshSiteAudio,
} from "@/lib/audio/spiritual-tones";
import {
  showSalawatNotification,
  isInQuietHours,
} from "@/lib/services/notifications";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type SalawatInterval = 15 | 30 | 60 | 120 | 0; // 0 = disabled

export interface QuietHours {
  enabled: boolean;
  from: string; // "HH:MM"
  to: string; // "HH:MM"
}

export interface SalawatSettings {
  enabled: boolean;
  intervalMinutes: SalawatInterval;
  quietHours: QuietHours;
}

const SETTINGS_KEY = "zikr_salawat_settings";
const SALAWAT_CHANNEL_ID = "zikr-salawat-v2";
const SETTINGS_UPDATED_EVENT = "zikr:salawat-settings-updated";

const DEFAULT_SETTINGS: SalawatSettings = {
  enabled: false, // opt-in: user must explicitly enable
  intervalMinutes: 60,
  quietHours: { enabled: false, from: "22:00", to: "06:00" },
};

function loadSettings(): SalawatSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      quietHours: { ...DEFAULT_SETTINGS.quietHours, ...parsed.quietHours },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: SalawatSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

type NativeSalawatFacade = {
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

const SALAWAT_NATIVE_IDS = Array.from(
  { length: 40 },
  (_, index) => 8000 + index
);

function isQuietAt(date: Date, quietHours: QuietHours): boolean {
  if (!quietHours.enabled) return false;
  const current = date.getHours() * 60 + date.getMinutes();
  const [fromHour, fromMinute] = quietHours.from.split(":").map(Number);
  const [toHour, toMinute] = quietHours.to.split(":").map(Number);
  const from = fromHour * 60 + fromMinute;
  const to = toHour * 60 + toMinute;
  if (!Number.isFinite(from) || !Number.isFinite(to)) return false;
  return from <= to
    ? current >= from && current < to
    : current >= from || current < to;
}

let salawatScheduleGeneration = 0;

async function scheduleNativeSalawatReminders(
  settings: SalawatSettings
): Promise<void> {
  if (typeof window === "undefined") return;
  const native = (window as Window & { zikrNative?: NativeSalawatFacade })
    .zikrNative;
  if (!native?.scheduleLocalNotification) return;

  const generation = ++salawatScheduleGeneration;
  await native.cancelLocalNotifications?.(SALAWAT_NATIVE_IDS);
  if (
    generation !== salawatScheduleGeneration ||
    !settings.enabled ||
    settings.intervalMinutes === 0
  ) {
    return;
  }

  const intervalMs = settings.intervalMinutes * 60 * 1000;
  let next = new Date(Date.now() + intervalMs);
  let scheduledCount = 0;
  let attempts = 0;
  while (scheduledCount < SALAWAT_NATIVE_IDS.length && attempts < 160) {
    if (!isQuietAt(next, settings.quietHours)) {
      if (generation !== salawatScheduleGeneration) return;
      try {
        await native.scheduleLocalNotification({
          id: SALAWAT_NATIVE_IDS[scheduledCount],
          title: "تذكير بالصلاة على النبي",
          body: "صل على سيدنا محمد",
          scheduleAt: next.toISOString(),
          sound: "salawat.wav",
          channelId: SALAWAT_CHANNEL_ID,
        });
        scheduledCount += 1;
      } catch (error) {
        console.warn(
          "[salawat-reminder] Native notification scheduling failed",
          error
        );
      }
    }
    next = new Date(next.getTime() + intervalMs);
    attempts += 1;
  }
}

async function getAuthenticatedSession() {
  try {
    const supabase = createBrowserSupabaseClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  } catch {
    return null;
  }
}

export interface SalawatReminderReturn {
  settings: SalawatSettings;
  setEnabled: (v: boolean) => void;
  setIntervalMinutes: (v: SalawatInterval) => void;
  setQuietHours: (v: Partial<QuietHours>) => void;
  testReminder: () => void;
}

export function useSalawatReminder(
  options: { passive?: boolean } = {}
): SalawatReminderReturn {
  useEffect(() => { void refreshSiteAudio(); }, []);
  const passive = options.passive ?? false;
  const [settings, setSettings] = useState<SalawatSettings>(DEFAULT_SETTINGS);

  // Load local settings immediately, then reconcile with the authenticated
  // server preference. Anonymous visitors do not call the protected API.
  useEffect(() => {
    setSettings(loadSettings());
    if (passive) return;

    let cancelled = false;
    void getAuthenticatedSession().then(async session => {
      if (cancelled || !session?.user) return;
      try {
        const response = await fetch("/api/reminders/background", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        if (cancelled) return;
        const next: SalawatSettings = {
          enabled: Boolean(data.salawat_enabled),
          intervalMinutes: data.salawat_interval_minutes ?? 60,
          quietHours: {
            enabled: Boolean(data.quiet_hours_start && data.quiet_hours_end),
            from: data.quiet_hours_start?.slice(0, 5) ?? "22:00",
            to: data.quiet_hours_end?.slice(0, 5) ?? "06:00",
          },
        };
        saveSettings(next);
        setSettings(next);
      } catch {
        // Keep the local settings when offline or when the API is unavailable.
      }
    });

    return () => {
      cancelled = true;
    };
  }, [passive]);

  useEffect(() => {
    const syncSettings = () => setSettings(loadSettings());
    window.addEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
    return () =>
      window.removeEventListener(SETTINGS_UPDATED_EVENT, syncSettings);
  }, []);

  // Set up native reminders whenever settings change; these continue when the app is closed.
  // Re-run after the Capacitor bridge is ready and whenever Android resumes the
  // WebView so cancelled/expired alarms are replenished.
  useEffect(() => {
    if (passive) return;
    const schedule = () => {
      void scheduleNativeSalawatReminders(settings).catch(error => {
        console.warn(
          "[salawat-reminder] Native schedule refresh failed",
          error
        );
      });
    };
    schedule();
    window.addEventListener("zikr:native-ready", schedule);
    window.addEventListener("zikr:native-app-state", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      window.removeEventListener("zikr:native-ready", schedule);
      window.removeEventListener("zikr:native-app-state", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [settings, passive]);

  // Set up the foreground interval whenever settings change.
  useEffect(() => {
    if (passive || !settings.enabled || settings.intervalMinutes === 0) return;

    const fire = () => {
      if (
        settings.quietHours.enabled &&
        isInQuietHours(settings.quietHours.from, settings.quietHours.to)
      ) {
        return; // Respect quiet hours — skip silently
      }
      playSalawatClip();
      showSalawatNotification();
      // Also dispatch via SW for background delivery
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "SHOW_DHIKR_NOTIFICATION",
          kind: "salawat",
          text: "اللهم صلِّ وسلم على نبينا محمد",
        });
      }
    };

    const interval = setInterval(fire, settings.intervalMinutes * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings, passive]);

  const update = useCallback(
    (
      partial:
        | Partial<SalawatSettings>
        | ((prev: SalawatSettings) => Partial<SalawatSettings>)
    ) => {
      setSettings(prev => {
        const patch = typeof partial === "function" ? partial(prev) : partial;
        const next = { ...prev, ...patch };
        saveSettings(next);
        window.dispatchEvent(new Event(SETTINGS_UPDATED_EVENT));
        void getAuthenticatedSession().then(session => {
          if (!session?.user) return;
          void fetch("/api/reminders/background", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              salawat_enabled: next.enabled,
              salawat_interval_minutes: next.intervalMinutes,
              quiet_hours_start: next.quietHours.enabled
                ? next.quietHours.from
                : null,
              quiet_hours_end: next.quietHours.enabled
                ? next.quietHours.to
                : null,
            }),
          }).catch(() => undefined);
        });
        return next;
      });
    },
    []
  );

  const setEnabled = useCallback(
    (v: boolean) => update({ enabled: v }),
    [update]
  );
  const setIntervalMinutes = useCallback(
    (v: SalawatInterval) => update({ intervalMinutes: v }),
    [update]
  );
  const setQuietHours = useCallback(
    (v: Partial<QuietHours>) =>
      update(prev => ({ quietHours: { ...prev.quietHours, ...v } })),
    [update]
  );

  const testReminder = useCallback(() => {
    unlockAudioContext();
    playSalawatClip();
    showSalawatNotification();
  }, []);

  return {
    settings,
    setEnabled,
    setIntervalMinutes,
    setQuietHours,
    testReminder,
  };
}
