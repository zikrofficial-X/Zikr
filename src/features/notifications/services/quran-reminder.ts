"use client";

import { getNativeAudio } from "@/lib/audio/config";

const IDS = Array.from({ length: 14 }, (_, index) => 9100 + index);

type NativeReminderBridge = {
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

function getBridge(): NativeReminderBridge | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { zikrNative?: NativeReminderBridge }).zikrNative ?? null;
}

function getNextDates(time: string): Date[] {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const result: Date[] = [];

  for (let index = 0; index < IDS.length; index += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() + index);
    date.setHours(hours, minutes, 0, 0);
    if (date <= now) date.setDate(date.getDate() + 1);
    result.push(date);
  }

  return result;
}

export async function cancelQuranReminderSchedule(): Promise<void> {
  await getBridge()?.cancelLocalNotifications?.(IDS);
}

export async function scheduleQuranReminder(
  enabled: boolean,
  time: string,
  message: string,
): Promise<boolean> {
  const bridge = getBridge();
  if (!bridge?.scheduleLocalNotification) return false;

  await bridge.cancelLocalNotifications?.(IDS);
  if (!enabled) return true;

  const audio = getNativeAudio("dhikr");
  for (const [index, date] of getNextDates(time).entries()) {
    await bridge.scheduleLocalNotification({
      id: IDS[index],
      title: "موعد وردك مع القرآن",
      body: message,
      scheduleAt: date.toISOString(),
      sound: audio.sound,
      channelId: audio.channelId,
    });
  }

  return true;
}

export async function syncQuranReminderFromAccount(): Promise<void> {
  try {
    const response = await fetch("/api/reminders/background", {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return;

    const data = (await response.json()) as {
      quran_enabled?: boolean;
      quran_time?: string;
      quran_message?: string;
    };

    await scheduleQuranReminder(
      data.quran_enabled === true,
      String(data.quran_time ?? "20:00").slice(0, 5),
      String(
        data.quran_message ??
          "اهدأ قليلًا… وافتح وردك اليومي. آية واحدة قد تغيّر يومك.",
      ),
    );
  } catch (error) {
    console.warn("[quran-reminder] sync failed", error);
  }
}
