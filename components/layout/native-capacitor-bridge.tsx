"use client";

import { useEffect } from "react";

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
    checkExactNotificationSetting: () => Promise<unknown>;
    changeExactNotificationSetting: () => Promise<unknown>;
    cancelLocalNotifications: (ids: number[]) => Promise<void>;
  };
};

function getNativePlugins() {
  const capacitor = (window as CapacitorWindow).Capacitor;
  if (!capacitor?.isNativePlatform?.()) return null;
  return capacitor.Plugins ?? null;
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
    async checkExactNotificationSetting() {
      return plugins.LocalNotifications?.checkExactNotificationSetting?.();
    },
    async changeExactNotificationSetting() {
      return plugins.LocalNotifications?.changeExactNotificationSetting?.();
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

    void plugins.StatusBar?.setStyle?.({ style: "DARK" });
    void plugins.StatusBar?.setBackgroundColor?.({ color: "#000000" });
    void plugins.SplashScreen?.hide?.();

    const app = plugins.App;
    const network = plugins.Network;
    const localNotifications = plugins.LocalNotifications;

    void (async () => {
      try {
        await localNotifications?.createChannel?.({
          id: "zikr-prayer-adhan-v2",
          name: "أوقات الصلاة والأذان",
          description: "تنبيهات أوقات الصلاة بصوت الأذان",
          importance: 5,
          sound: "adhan.wav",
          vibration: true,
          visibility: 1,
        });
        await localNotifications?.createChannel?.({
          id: "zikr-salawat-v2",
          name: "الصلاة على النبي",
          description: "تذكيرات الصلاة على سيدنا محمد",
          importance: 3,
          sound: "salawat.wav",
          vibration: true,
          visibility: 1,
        });

        // Android 13+ permission is returned asynchronously; the native facade
        // exposes it to the web layer instead of pretending it is always granted.
        await localNotifications?.requestPermissions?.();
      } catch (error) {
        console.warn("[native-bridge] Local notification initialization failed", error);
      } finally {
        // Do not let prayer hooks race channel creation. They can now safely
        // schedule background alarms when this event is dispatched.
        window.dispatchEvent(new CustomEvent("zikr:native-ready"));
      }
    })();
    void plugins.PushNotifications?.requestPermissions?.();

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

    void app?.addListener?.("appUrlOpen", (event: unknown) => {
      const url = (event as { url?: string })?.url;
      if (!url) return;

      const parsed = new URL(url);
      const next = parsed.searchParams.get("next");
      const isCustomAuthCallback =
        parsed.protocol === "com.zikr.app:" &&
        parsed.hostname === "auth" &&
        parsed.pathname.startsWith("/callback");
      const target =
        parsed.protocol === "com.zikr.app:" && next
          ? next
          : isCustomAuthCallback
            ? `/auth/callback${parsed.search}${parsed.hash}`
            : `${parsed.pathname || "/"}${parsed.search}${parsed.hash}`;
      window.location.assign(target.startsWith("/") ? target : "/");
    });

    void app?.addListener?.("appStateChange", (state: unknown) => {
      window.dispatchEvent(
        new CustomEvent("zikr:native-app-state", { detail: state })
      );
    });
  }, []);

  return null;
}
