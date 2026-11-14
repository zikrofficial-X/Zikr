"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { Filesystem } from "@capacitor/filesystem";
import { Geolocation } from "@capacitor/geolocation";
import { Haptics } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Network } from "@capacitor/network";
import { Share } from "@capacitor/share";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar } from "@capacitor/status-bar";
import { loadAudioSettings } from "@/lib/audio/config";
import { ensureNativeNotificationChannels } from "@/features/notifications/services/native-notification-channels";
import { syncQuranReminderFromAccount } from "@/features/notifications/services/quran-reminder";
import { PRODUCTION_URL } from "@/lib/site";
import { sanitizeInternalPath } from "@/lib/safe-redirect";

type CapacitorPlugin = Record<
  string,
  (...args: unknown[]) => Promise<unknown> | unknown
>;
type NativePluginListenerHandle = {
  remove: () => Promise<void> | void;
};

type CapacitorWindow = Window & {
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
  if (!Capacitor.isNativePlatform()) return null;
  // Use official Capacitor 7 package exports. The deprecated global Plugins
  // registry is not guaranteed to expose every plugin in production builds.
  return {
    App: App as unknown as CapacitorPlugin,
    Browser: Browser as unknown as CapacitorPlugin,
    Camera: Camera as unknown as CapacitorPlugin,
    Filesystem: Filesystem as unknown as CapacitorPlugin,
    Geolocation: Geolocation as unknown as CapacitorPlugin,
    Haptics: Haptics as unknown as CapacitorPlugin,
    LocalNotifications: LocalNotifications as unknown as CapacitorPlugin,
    Network: Network as unknown as CapacitorPlugin,
    Share: Share as unknown as CapacitorPlugin,
    SplashScreen: SplashScreen as unknown as CapacitorPlugin,
    StatusBar: StatusBar as unknown as CapacitorPlugin,
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
      const safeNext = sanitizeInternalPath(nextPath);
      // Native OAuth always starts from the canonical production origin so a
      // deployment alias never remains open in the Android custom tab.
      const startUrl = new URL("/auth/google", PRODUCTION_URL);
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

    let disposed = false;
    const listenerHandles: NativePluginListenerHandle[] = [];
    const registerPluginListener = (
      plugin: CapacitorPlugin | undefined,
      eventName: string,
      listener: (...args: unknown[]) => void,
    ) => {
      const pendingHandle = plugin?.addListener?.(eventName, listener);
      if (pendingHandle === undefined) return;

      void Promise.resolve(pendingHandle)
        .then((handle) => {
          const listenerHandle = handle as NativePluginListenerHandle | null;
          if (!listenerHandle || typeof listenerHandle.remove !== "function") return;
          if (disposed) {
            void Promise.resolve(listenerHandle.remove()).catch((error: unknown) => {
              console.warn("[native-bridge] Listener cleanup failed", error);
            });
            return;
          }
          listenerHandles.push(listenerHandle);
        })
        .catch((error: unknown) => {
          console.warn("[native-bridge] Plugin listener registration failed", error);
        });
    };
    let audioSettingsRefreshQueue = Promise.resolve();
    const refreshNativeAudioSettings = (notifyReady = true) => {
      audioSettingsRefreshQueue = audioSettingsRefreshQueue
        .then(async () => {
          if (disposed) return;
          await ensureNativeNotificationChannels(
            localNotifications,
            Capacitor.getPlatform(),
          );
          await syncQuranReminderFromAccount();
          if (notifyReady && !disposed) {
            window.dispatchEvent(
              new CustomEvent("zikr:native-audio-channels-ready"),
            );
          }
        })
        .catch(error => {
          console.warn(
            "[native-bridge] Audio notification channel refresh failed",
            error,
          );
        });
      return audioSettingsRefreshQueue;
    };
    const handleAudioSettingsChanged = () => {
      void refreshNativeAudioSettings();
    };

    void (async () => {
      try {
        await loadAudioSettings();
        if (disposed) return;
        window.addEventListener(
          "zikr:audio-settings-changed",
          handleAudioSettingsChanged,
        );
        await ensureNativeNotificationChannels(
          localNotifications,
          Capacitor.getPlatform(),
        );

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
        if (!disposed) {
          window.dispatchEvent(new CustomEvent("zikr:native-ready"));
        }
      }
    })();
    // Push permission is requested only when the user explicitly enables
    // server-backed reminders; never prompt during app startup.

    // Browser emits this when the user closes the system Custom Tab. Notify
    // the login button so an interrupted OAuth flow never leaves the UI stuck.
    registerPluginListener(browser, "browserFinished", () => {
      if (disposed) return;
      window.dispatchEvent(new CustomEvent("zikr:native-browser-finished"));
    });

    const syncNetworkState = async () => {
      const status = (await network?.getStatus?.()) as
        { connected?: boolean } | undefined;
      if (disposed) return;
      document.documentElement.dataset.network =
        status?.connected === false ? "offline" : "online";
      window.dispatchEvent(
        new CustomEvent("zikr:native-network", { detail: status })
      );
    };

    void syncNetworkState();
    registerPluginListener(network, "networkStatusChange", (status: unknown) => {
      if (disposed) return;
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

    // Universal links for public content must navigate the existing WebView.
    // OAuth callbacks are excluded from AASA; the HTTPS callback forwards the
    // authorization code to the custom scheme, where this WebView exchanges it.
    registerPluginListener(app, "appUrlOpen", (event: unknown) => {
      if (disposed) return;
      const incomingUrl = (event as { url?: string })?.url;
      if (!incomingUrl) return;

      try {
        const target = new URL(incomingUrl);
        if (target.origin !== PRODUCTION_URL) return;
        if (target.pathname.startsWith("/auth/callback")) return;

        const path = sanitizeInternalPath(target.pathname + target.search + target.hash);
        window.location.assign(path);
      } catch (error) {
        console.warn("[native-bridge] Ignored invalid universal link", error);
      }
    });

    registerPluginListener(app, "appStateChange", (state: unknown) => {
      if (disposed) return;
      const isActive = (state as { isActive?: boolean })?.isActive === true;
      if (isActive) {
        window.dispatchEvent(new CustomEvent("zikr:native-resumed"));
        void syncQuranReminderFromAccount();
      }
      window.dispatchEvent(
        new CustomEvent("zikr:native-app-state", { detail: state })
      );
    });

    return () => {
      disposed = true;
      for (const handle of listenerHandles.splice(0)) {
        void Promise.resolve(handle.remove()).catch((error: unknown) => {
          console.warn("[native-bridge] Listener cleanup failed", error);
        });
      }
      window.removeEventListener(
        "zikr:audio-settings-changed",
        handleAudioSettingsChanged,
      );
    };
  }, []);

  return null;
}
