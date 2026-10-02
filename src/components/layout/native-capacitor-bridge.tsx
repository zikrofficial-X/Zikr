"use client";

import { useEffect } from "react";
import { getNativeAudio, loadAudioSettings } from "@/lib/audio/config";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { syncQuranReminderFromAccount } from "@/features/notifications/services/quran-reminder";

type CapacitorPlugin = Record<
  string,
  (...args: unknown[]) => Promise<unknown> | unknown
>;
type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: Record<string, CapacitorPlugin | undefined>;
  };
  zikrNative?: {
    isNative: boolean;
    share: (data: {
      title?: string;
      text?: string;
      url?: string;
    }) => Promise<void>;
    haptic: (style?: "LIGHT" | "MEDIUM" | "HEAVY") => Promise<void>;
    pickImage: () => Promise<unknown>;
    writeFile: (path: string, data: string) => Promise<unknown>;
    downloadFile: (url: string, path: string) => Promise<{ path?: string; uri?: string }>;
    deleteFile: (path: string) => Promise<void>;
    getFileUrl: (path: string) => Promise<string | null>;
    getNetworkStatus: () => Promise<unknown>;
    scheduleLocalNotification: (notification: {
      id: number;
      title: string;
      body: string;
      scheduleAt?: string;
      sound?: string;
      channelId?: string;
    }) => Promise<void>;
    requestNotificationPermission: () => Promise<unknown>;
    requestLocationPermission: () => Promise<unknown>;
    checkExactNotificationSetting: () => Promise<unknown>;
    changeExactNotificationSetting: () => Promise<unknown>;
    getAppInfo: () => Promise<{ version?: string; build?: string }>;
    openExternalUrl: (url: string) => Promise<void>;
    startGoogleOAuth: (nextPath?: string) => Promise<void>;
    cancelLocalNotifications: (ids: number[]) => Promise<void>;
  };
};

function getNativePlugins(): Record<string, CapacitorPlugin | undefined> | null {
  const capacitor = (window as CapacitorWindow).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return {
    ...(capacitor.Plugins ?? {}),
    // Capacitor v7 does not guarantee that every plugin is exposed through the
    // legacy Capacitor.Plugins registry. Use the official plugin export for
    // notifications so background alarms remain available in release builds.
    LocalNotifications: LocalNotifications as unknown as CapacitorPlugin,
  };
}

function installNativeFacade(
  plugins: Record<string, CapacitorPlugin | undefined>
) {
  const nativeWindow = window as CapacitorWindow;

  nativeWindow.zikrNative = {
    isNative: true,
    async share(data) {
      if (plugins.Share?.share) {
        await plugins.Share.share(data);
        return;
      }
      if (navigator.share) await navigator.share(data);
    },
    async haptic(style = "LIGHT") {
      await plugins.Haptics?.impact?.({ style });
    },
    async pickImage() {
      return plugins.Camera?.getPhoto?.({
        quality: 88,
        allowEditing: false,
        resultType: "uri",
        source: "PROMPT",
      });
    },
    async writeFile(path, data) {
      return plugins.Filesystem?.writeFile?.({
        path,
        data,
        directory: "DATA",
        recursive: true,
      });
    },
    async downloadFile(url, path) {
      const filesystem = plugins.Filesystem;
      if (filesystem?.downloadFile) {
        const result = await filesystem.downloadFile({
          url,
          path,
          directory: "DATA",
          recursive: true,
        });
        return (result as { path?: string; uri?: string }) ?? { path };
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Audio download failed");
      const bytes = new Uint8Array(await response.arrayBuffer());
      let binary = "";
      const chunkSize = 0x8000;
      for (let offset = 0; offset < bytes.length; offset += chunkSize) {
        binary += String.fromCharCode(
          ...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)),
        );
      }
      await filesystem?.writeFile?.({
        path,
        data: btoa(binary),
        directory: "DATA",
        recursive: true,
      });
      return { path };
    },
    async deleteFile(path) {
      await plugins.Filesystem?.deleteFile?.({
        path,
        directory: "DATA",
      });
    },
    async getFileUrl(path) {
      const uriResult = (await plugins.Filesystem?.getUri?.({
        path,
        directory: "DATA",
      })) as { uri?: string } | undefined;
      return uriResult?.uri ? Capacitor.convertFileSrc(uriResult.uri) : null;
    },
    async getNetworkStatus() {
      return plugins.Network?.getStatus?.();
    },
    async scheduleLocalNotification(notification) {
      const localNotifications = plugins.LocalNotifications;
      if (!localNotifications?.schedule) {
        throw new Error("Capacitor LocalNotifications plugin is unavailable");
      }
      await localNotifications.schedule({
        notifications: [
          {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            sound: notification.sound,
            channelId: notification.channelId,
            schedule: notification.scheduleAt
              ? {
                  at: new Date(notification.scheduleAt),
                  allowWhileIdle: true,
                }
              : undefined,
          },
        ],
      });
    },
    async requestNotificationPermission() {
      return plugins.LocalNotifications?.requestPermissions?.();
    },
    async requestLocationPermission() {
      return plugins.Geolocation?.requestPermissions?.();
    },
    async checkExactNotificationSetting() {
      return plugins.LocalNotifications?.checkExactNotificationSetting?.();
    },
    async changeExactNotificationSetting() {
      return plugins.LocalNotifications?.changeExactNotificationSetting?.();
    },
    async getAppInfo() {
      const info = await plugins.App?.getInfo?.();
      return (info as { version?: string; build?: string } | undefined) ?? {};
    },
    async openExternalUrl(url) {
      if (plugins.Browser?.open) {
        await plugins.Browser.open({ url });
        return;
      }
      window.location.assign(url);
    },
    async startGoogleOAuth(nextPath = "/profile") {
      const safeNext =
        nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/profile";
      const startUrl = new URL("/auth/google", window.location.origin);
      startUrl.searchParams.set("native", "1");
      startUrl.searchParams.set("next", safeNext);
      const response = await fetch(startUrl, {
        cache: "no-store",
        credentials: "include",
      });
      const payload = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "تعذر بدء تسجيل الدخول عبر Google.");
      }
      if (plugins.Browser?.open) {
        await plugins.Browser.open({ url: payload.url });
        return;
      }
      window.location.assign(payload.url);
    },
    async cancelLocalNotifications(ids) {
      if (!ids.length) return;
      await plugins.LocalNotifications?.cancel?.({
        notifications: ids.map(id => ({ id })),
      });
    },
  };
}

export function NativeCapacitorBridge() {
  useEffect(() => {
    const plugins = getNativePlugins();
    if (!plugins) return;

    installNativeFacade(plugins);
    document.documentElement.classList.add("capacitor-native");
    // Next.js uses this attribute to coordinate router scrolling. Smooth
    // scrolling feels delayed in the native WebView, so keep native navigation
    // and touch scrolling immediate.
    document.documentElement.dataset.scrollBehavior = "auto";
    void plugins.StatusBar?.setStyle?.({ style: "DARK" });

    void plugins.StatusBar?.setBackgroundColor?.({ color: "#000000" });
    void plugins.SplashScreen?.hide?.();

    const app = plugins.App;
    const browser = plugins.Browser;
    const network = plugins.Network;
    const localNotifications = plugins.LocalNotifications;

    void (async () => {
      try {
        await loadAudioSettings();
        const prayerAudio = getNativeAudio("prayer");
        const dhikrAudio = getNativeAudio("dhikr");
        const salawatAudio = getNativeAudio("salawat");
        const channels = [
          {
            ...prayerAudio,
            name: "أوقات الصلاة والأذان",
            description: "تنبيهات أوقات الصلاة بالصوت المختار",
            importance: 5,
          },
          {
            ...dhikrAudio,
            name: "تذكير الذكر",
            description: "تذكيرات الذكر بالصوت المختار",
            importance: 3,
          },
          {
            ...salawatAudio,
            name: "الصلاة على النبي",
            description: "تذكيرات الصلاة على النبي بالصوت المختار",
            importance: 3,
          },
        ];
        const uniqueChannels = Array.from(
          new Map(
            channels.map(channel => [channel.channelId, channel])
          ).values()
        );
        for (const channel of uniqueChannels) {
          await localNotifications?.createChannel?.({
            id: channel.channelId,
            name: channel.name,
            description: channel.description,
            importance: channel.importance,
            sound: channel.sound,
            vibration: true,
            visibility: 1,
          });
        }

        // Keep the account's Quran reminder schedule alive after app restart.
        await syncQuranReminderFromAccount();

        // Permission is requested only from the user action that enables
        // reminders. Initializing channels must not trigger a system prompt.
      } catch (error) {
        console.warn(
          "[native-bridge] Local notification initialization failed",
          error
        );
      } finally {
        // Do not let prayer hooks race channel creation. They can now safely
        // schedule background alarms when this event is dispatched.
        window.dispatchEvent(new CustomEvent("zikr:native-ready"));
      }
    })();
    // Push permission is requested only when the user explicitly enables
    // server-backed reminders; never prompt during app startup.

    // Browser emits this when the user closes the system Custom Tab. Notify
    // the login button so an interrupted OAuth flow never leaves the UI stuck.
    void browser?.addListener?.("browserFinished", () => {
      window.dispatchEvent(new CustomEvent("zikr:native-browser-finished"));
    });

    const syncNetworkState = async () => {
      const status = (await network?.getStatus?.()) as
        { connected?: boolean } | undefined;
      document.documentElement.dataset.network =
        status?.connected === false ? "offline" : "online";
      window.dispatchEvent(
        new CustomEvent("zikr:native-network", { detail: status })
      );
    };

    void syncNetworkState();
    void network?.addListener?.("networkStatusChange", (status: unknown) => {
      document.documentElement.dataset.network =
        (status as { connected?: boolean })?.connected === false
          ? "offline"
          : "online";
      window.dispatchEvent(
        new CustomEvent("zikr:native-network", { detail: status })
      );
    });

    // Google OAuth deep-link handling is intentionally NOT registered here.
    // NativeGoogleOAuthHandler is the single owner of the com.zikr.app://auth/callback
    // flow so the PKCE verifier remains in the same WebView storage context.

    void app?.addListener?.("appStateChange", (state: unknown) => {
      const isActive = (state as { isActive?: boolean })?.isActive === true;
      if (isActive) {
        window.dispatchEvent(new CustomEvent("zikr:native-resumed"));
        void syncQuranReminderFromAccount();
      }
      window.dispatchEvent(
        new CustomEvent("zikr:native-app-state", { detail: state })
      );
    });
  }, []);

  return null;
}
