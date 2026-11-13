import { getNativeAudio } from "@/lib/audio/config";

type NativeNotificationChannelOptions = {
  id: string;
  name: string;
  description: string;
  importance: number;
  sound: string;
  vibration: boolean;
  visibility: number;
};

type LocalNotificationsChannelBridge = {
  createChannel?: (
    options: NativeNotificationChannelOptions,
  ) => Promise<unknown>;
};

const CHANNELS = [
  {
    slot: "prayer" as const,
    name: "أوقات الصلاة والأذان",
    description: "تنبيهات أوقات الصلاة بالصوت المختار",
    importance: 5,
  },
  {
    slot: "dhikr" as const,
    name: "تذكير الذكر",
    description: "تذكيرات الذكر بالصوت المختار",
    importance: 3,
  },
  {
    slot: "salawat" as const,
    name: "الصلاة على النبي",
    description: "تذكيرات الصلاة على النبي بالصوت المختار",
    importance: 3,
  },
] as const;

/**
 * Android notification channels are immutable after creation. Recreate the
 * versioned channel for each selected audio key before rescheduling reminders.
 */
export async function ensureNativeNotificationChannels(
  localNotifications: LocalNotificationsChannelBridge | null | undefined,
  platform: string,
): Promise<void> {
  if (platform !== "android" || typeof localNotifications?.createChannel !== "function") {
    return;
  }

  const channels = CHANNELS.map(({ slot, ...channel }) => ({
    ...channel,
    ...getNativeAudio(slot, platform),
  }));
  const uniqueChannels = Array.from(
    new Map(channels.map(channel => [channel.channelId, channel])).values(),
  );

  for (const channel of uniqueChannels) {
    try {
      await localNotifications.createChannel({
        id: channel.channelId,
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: channel.sound,
        vibration: true,
        visibility: 1,
      });
    } catch (error) {
      console.warn(
        `[native-bridge] Could not refresh the ${channel.name} notification channel`,
        error,
      );
    }
  }
}
