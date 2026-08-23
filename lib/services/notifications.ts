import { playAzanClip } from "@/lib/audio/spiritual-tones";

export type NotificationPermission =
  "granted" | "denied" | "default" | "unsupported";

export interface NotificationPreference {
  prayerReminders: boolean;
  adhkarReminders: boolean;
  quranReminders: boolean;
  quietHours?: { from: string; to: string };
}

type NativeNotificationFacade = {
  requestNotificationPermission?: () => Promise<unknown>;
  scheduleLocalNotification?: (notification: {
    id: number;
    title: string;
    body: string;
    scheduleAt?: string;
    sound?: string;
    channelId?: string;
  }) => Promise<void>;
};

type NativeNotificationWindow = Window & {
  zikrNative?: NativeNotificationFacade;
};

const DEFAULT_PREFERENCE: NotificationPreference = {
  prayerReminders: true,
  adhkarReminders: true,
  quranReminders: false,
};

function notificationId(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return Math.max(1, hash % 2147483647);
}

async function showNativeNotification(
  title: string,
  body: string,
  tag: string
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const native = (window as NativeNotificationWindow).zikrNative;
  if (!native?.scheduleLocalNotification) return false;

  const isPrayer = tag.startsWith("prayer-");
  const isSalawat = tag === "salawat-reminder";
  try {
    await native.scheduleLocalNotification({
      id: notificationId(tag),
      title,
      body,
      sound: isPrayer ? "adhan.wav" : isSalawat ? "salawat.wav" : undefined,
      channelId: isPrayer
        ? "zikr-prayer-adhan-v2"
        : isSalawat
          ? "zikr-salawat-v2"
          : undefined,
    });
    return true;
  } catch (error) {
    console.warn("[notifications] Native notification failed", error);
    return false;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined") return "unsupported";

  const native = (window as NativeNotificationWindow).zikrNative;
  if (native?.requestNotificationPermission) {
    try {
      const result = await native.requestNotificationPermission();
      const display = (result as { display?: string } | undefined)?.display;
      if (display === "granted" || display === "denied" || display === "prompt") {
        return display === "prompt" ? "default" : (display as NotificationPermission);
      }
    } catch {
      return "denied";
    }
  }
  if (native) return "granted";

  if (!("Notification" in window)) return "unsupported";
  return Notification.requestPermission() as Promise<NotificationPermission>;
}

export async function saveNotificationPreference(
  preference: Partial<NotificationPreference>
): Promise<NotificationPreference> {
  const merged = { ...DEFAULT_PREFERENCE, ...preference };
  if (typeof window !== "undefined") {
    localStorage.setItem("zikr_notification_pref", JSON.stringify(merged));
  }
  return merged;
}

/**
 * Returns true if the current time falls within the quiet-hours window.
 * Handles windows that cross midnight (e.g. 22:00–06:00).
 */
export function isInQuietHours(from: string, to: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const [fh, fm] = from.split(":").map(Number);
    const [th, tm] = to.split(":").map(Number);
    const fromMin = fh * 60 + fm;
    const toMin = th * 60 + tm;

    if (fromMin <= toMin) {
      return nowMin >= fromMin && nowMin < toMin;
    } else {
      // Crosses midnight
      return nowMin >= fromMin || nowMin < toMin;
    }
  } catch {
    return false;
  }
}

/** Show a browser/native notification for a prayer time. No-ops gracefully if not granted. */
export function showPrayerNotification(prayerNameAr: string): void {
  if (typeof window === "undefined") return;

  // Play the real adhan clip in the foreground when the browser allows audio.
  // Native scheduled notifications use the same adhan sound identifier below.
  playAzanClip();

  const title = `حان وقت صلاة ${prayerNameAr}`;
  const body = "الصلاة خير من النوم — حافظ على صلاتك";
  const tag = `prayer-${prayerNameAr}`;

  void showNativeNotification(title, body, tag).then(handled => {
    if (handled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      new Notification(title, {
        body,
        icon: "/icons/icon-192.png",
        tag,
      });
    } catch {
      // Some environments restrict Notification constructor — ignore silently
    }
  });
}

/** Show a browser/native notification reminding the user their zakat is due. */
export function showZakatNotification(daysLeft: number): void {
  if (typeof window === "undefined") return;

  const body =
    daysLeft > 0
      ? `اقترب موعد إخراج زكاتك — تبقّى ${daysLeft} يوماً`
      : "حان موعد إخراج زكاتك — لا تنسَ أداءها";

  void showNativeNotification("تذكير الزكاة", body, "zakat-reminder").then(
    handled => {
      if (handled) return;
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      try {
        new Notification("تذكير الزكاة", {
          body,
          icon: "/icons/icon-192.png",
          tag: "zakat-reminder",
        });
      } catch {
        // ignore
      }
    }
  );
}

/** Show a browser/native notification with a rotating dhikr phrase. */
export function showDhikrNotification(text: string): void {
  if (typeof window === "undefined") return;

  const title = "تذكير بالذكر";
  const tag = "dhikr-reminder";

  void showNativeNotification(title, text, tag).then(handled => {
    if (handled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      new Notification(title, {
        body: text,
        icon: "/icons/icon-192.png",
        tag,
      });
    } catch {
      // ignore
    }
  });
}

/** Show a browser/native notification for the Salawat reminder. */
export function showSalawatNotification(): void {
  if (typeof window === "undefined") return;

  const title = "اللهم صل على محمد";
  const body = "صلِّ على النبي ﷺ — اللهم صل وسلم وبارك عليه";

  void showNativeNotification(title, body, "salawat-reminder").then(handled => {
    if (handled) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      new Notification(title, {
        body,
        icon: "/icons/icon-192.png",
        tag: "salawat-reminder",
      });
    } catch {
      // ignore
    }
  });
}
