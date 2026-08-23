"use client";

import { useEffect, useState } from "react";

const UPDATE_ENDPOINT = "/api/app-version";
const UPDATE_NOTIFICATION_ID = 905107;

type NativeFacade = {
  isNative: boolean;
  getAppInfo: () => Promise<{ version?: string; build?: string }>;
  openExternalUrl: (url: string) => Promise<void>;
  scheduleLocalNotification: (notification: {
    id: number;
    title: string;
    body: string;
  }) => Promise<void>;
};

type VersionResponse = {
  version: string;
  apkUrl: string;
  releaseUrl: string;
  name: string;
};

type UpdateWindow = Window & { zikrNative?: NativeFacade };

function versionParts(value: string) {
  return value
    .replace(/^v/i, "")
    .split(/[.-]/, 3)
    .map(part => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(latest: string, current: string) {
  const next = versionParts(latest);
  const installed = versionParts(current);
  for (let index = 0; index < 3; index += 1) {
    if ((next[index] ?? 0) !== (installed[index] ?? 0)) {
      return (next[index] ?? 0) > (installed[index] ?? 0);
    }
  }
  return false;
}

export function AppUpdateChecker() {
  const [update, setUpdate] = useState<VersionResponse | null>(null);
  const [checking, setChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const native = (window as UpdateWindow).zikrNative;
      if (!native?.isNative) return;
      setChecking(true);
      try {
        const [appInfo, response] = await Promise.all([
          native.getAppInfo(),
          fetch(UPDATE_ENDPOINT, { cache: "no-store" }),
        ]);
        if (!response.ok) return;
        const latest = (await response.json()) as VersionResponse;
        const current = appInfo.version ?? "0.0.0";
        if (
          cancelled ||
          !latest.version ||
          !isNewerVersion(latest.version, current)
        )
          return;

        setUpdate(latest);
        const notificationKey = `zikr:update-notified:${latest.version}`;
        if (!window.localStorage.getItem(notificationKey)) {
          window.localStorage.setItem(notificationKey, "1");
          await native.scheduleLocalNotification({
            id: UPDATE_NOTIFICATION_ID,
            title: "يتوفر تحديث جديد لتطبيق ذِكر",
            body: `الإصدار ${latest.version} متاح الآن. افتح التطبيق واضغط «تحديث الآن» لتنزيله.`,
          });
        }
      } catch (error) {
        console.warn("[app-update] version check failed", error);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    const timer = window.setTimeout(() => void check(), 2500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!update || dismissed || checking) return null;

  return (
    <aside
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-lg rounded-2xl border border-brand-gold/40 bg-brand-emeraldDeep p-4 shadow-2xl"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      <div className="space-y-2">
        <h2 className="text-base font-bold text-brand-gold">
          يتوفر تحديث جديد لتطبيق ذِكر
        </h2>
        <p className="text-sm leading-6 text-brand-cream/75">
          الإصدار {update.version} متاح الآن مع تحسينات وإصلاحات جديدة. اضغط
          «تحديث الآن» لتنزيل النسخة الرسمية.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            className="rounded-lg bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-emeraldDeep transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            onClick={() =>
              void (window as UpdateWindow).zikrNative?.openExternalUrl(
                update.apkUrl
              )
            }
          >
            تحديث الآن
          </button>
          <button
            type="button"
            className="rounded-lg border border-brand-cream/20 px-4 py-2 text-sm text-brand-cream/75 transition hover:border-brand-gold/50 hover:text-brand-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            onClick={() => setDismissed(true)}
          >
            لاحقًا
          </button>
        </div>
      </div>
    </aside>
  );
}
