"use client";

export type PushSubscriptionRegistrationResult =
  | { status: "registered" }
  | { status: "unsupported" }
  | { status: "unavailable" };

type StoredSubscription = {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
};

const DEVICE_ID_KEY = "zikr_push_device_id";
const PRAYER_LOCATION_KEY = "zikr_prayer_location";

type PrayerPushContext = {
  enabledPrayers: Record<string, boolean>;
};

type CachedPrayerLocation = {
  lat?: unknown;
  lon?: unknown;
  city?: unknown;
  country?: unknown;
};

function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

function decodeApplicationServerKey(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const raw = window.atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let index = 0; index < raw.length; index += 1) {
    bytes[index] = raw.charCodeAt(index);
  }
  return bytes.buffer;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return null;
  return navigator.serviceWorker.ready;
}

async function getPublicKey(): Promise<string | null> {
  const response = await fetch("/api/push/public-key", {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (response.status === 503) return null;
  if (!response.ok) throw new Error("تعذر تجهيز إشعارات الدفع الآمنة.");
  const payload = (await response.json()) as { publicKey?: string };
  return typeof payload.publicKey === "string" && payload.publicKey.length > 0
    ? payload.publicKey
    : null;
}

function getPrayerContext(enabledPrayers: Record<string, boolean>) {
  const raw = window.localStorage.getItem(PRAYER_LOCATION_KEY);
  if (!raw) {
    throw new Error("حدّد موقعك من صفحة مواقيت الصلاة قبل تفعيل التنبيهات.");
  }

  let cached: CachedPrayerLocation;
  try {
    cached = JSON.parse(raw) as CachedPrayerLocation;
  } catch {
    throw new Error("تعذر قراءة موقع الصلاة المحفوظ. أعد تحديد موقعك.");
  }

  const latitude = Number(cached.lat);
  const longitude = Number(cached.lon);
  const city = typeof cached.city === "string" ? cached.city.trim() : "";
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !city) {
    throw new Error(
      "حدّد موقعاً صالحاً من صفحة مواقيت الصلاة قبل تفعيل التنبيهات."
    );
  }

  return {
    location: {
      latitude,
      longitude,
      city,
      country:
        typeof cached.country === "string" ? cached.country.trim() : null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    prayerReminders: Object.fromEntries(
      ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"].map(prayer => [
        prayer,
        enabledPrayers[prayer] ? 0 : null,
      ])
    ),
  };
}

function serialize(subscription: PushSubscription): StoredSubscription {
  const payload = subscription.toJSON() as StoredSubscription;
  if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys?.auth) {
    throw new Error("اشتراك الإشعارات غير مكتمل.");
  }
  return payload;
}

export async function registerPrayerPushSubscription(
  context: PrayerPushContext
): Promise<PushSubscriptionRegistrationResult> {
  const registration = await getRegistration();
  if (!registration) return { status: "unsupported" };

  const publicKey = await getPublicKey();
  if (!publicKey) return { status: "unavailable" };

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: decodeApplicationServerKey(publicKey),
    }));

  const payload = serialize(subscription);
  const response = await fetch("/api/push/subscription", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      ...payload,
      deviceId: getDeviceId(),
      userAgent: navigator.userAgent,
      platform: navigator.platform || null,
      prayerContext: getPrayerContext(context.enabledPrayers),
    }),
  });

  if (response.status === 401) {
    throw new Error("سجّل الدخول أولاً لتفعيل إشعارات الصلاة على هذا الجهاز.");
  }
  if (response.status === 409) {
    throw new Error(
      "هذا الجهاز مرتبط بحساب آخر. سجّل الخروج من الحساب الآخر ثم حاول مجدداً."
    );
  }
  if (!response.ok) throw new Error("تعذر حفظ اشتراك الإشعارات.");

  return { status: "registered" };
}

export async function removeCurrentPushSubscription(): Promise<void> {
  const registration = await getRegistration();
  if (!registration) return;

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  try {
    await fetch("/api/push/subscription", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      keepalive: true,
      body: JSON.stringify({ endpoint }),
    });
  } finally {
    await subscription.unsubscribe().catch(() => false);
  }
}
