import { createClient } from "@supabase/supabase-js";
import {
  ApplicationServer,
  exportApplicationServerKey,
  exportVapidKeys,
  generateVapidKeys,
  importVapidKeys,
  PushMessageError,
  Urgency,
} from "webpush";

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type PrayerLocation = {
  id: string;
  user_id: string;
  latitude: number | string | null;
  longitude: number | string | null;
  timezone: string | null;
  is_default: boolean | null;
};

type PrayerPreference = {
  user_id: string;
  calculation_method: string | null;
  madhab: string | null;
  notifications_enabled: boolean | null;
  prayer_reminders: Record<string, number | null> | null;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
};

type CachedSchedule = {
  location_id: string;
  prayer_date: string;
  latitude: number | string;
  longitude: number | string;
  timezone: string;
  calculation_method: string;
  madhab: string;
  timings: Record<string, string>;
};

type Delivery = {
  id: string;
  user_id: string;
  push_subscription_id: string;
  prayer_name: string;
  notification_kind: 'prayer' | 'dhikr' | 'salawat';
  notification_text: string | null;
  scheduled_at: string;
  attempt_count: number;
};

type VapidBundle = {
  publicKey: string;
  keys: JsonWebKeyPair;
};

const PROJECT_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CONTACT =
  Deno.env.get("PUSH_CONTACT") ?? "mailto:admin@zikrmediaofficial.vercel.app";
const BATCH_SIZE = 100;
const PRAYERS = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const PRAYER_NAMES_AR: Record<string, string> = {
  Fajr: "الفجر",
  Sunrise: "الشروق",
  Dhuhr: "الظهر",
  Asr: "العصر",
  Maghrib: "المغرب",
  Isha: "العشاء",
};

if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase Edge Function service credentials.");
}

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function localDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find(part => part.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function formatLocalDate(date: Date, timeZone: string): string {
  const { year, month, day } = localDateParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function nextLocalDate(date: Date, timeZone: string): string {
  const { year, month, day } = localDateParts(date, timeZone);
  return formatLocalDate(
    new Date(Date.UTC(year, month - 1, day + 1, 12)),
    timeZone
  );
}

function dateForProvider(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}-${month}-${year}`;
}

function minutesFromTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function zonedDateTime(
  dateString: string,
  timeZone: string,
  time: string
): Date | null {
  const minutes = minutesFromTime(time);
  if (minutes === null) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = desiredUtc;

  // Resolve a wall-clock time in an IANA zone without relying on the runtime
  // timezone; a second pass accounts for daylight-saving offset transitions.
  for (let i = 0; i < 2; i += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const value = (type: string) =>
      Number(parts.find(part => part.type === type)?.value ?? 0);
    const renderedUtc = Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute")
    );
    guess += desiredUtc - renderedUtc;
  }

  return new Date(guess);
}

function localMinute(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) =>
    Number(parts.find(part => part.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}

function inQuietHours(
  date: Date,
  timeZone: string,
  start: string | null,
  end: string | null
): boolean {
  if (!start || !end) return false;
  const startMinutes = minutesFromTime(start);
  const endMinutes = minutesFromTime(end);
  if (
    startMinutes === null ||
    endMinutes === null ||
    startMinutes === endMinutes
  )
    return false;
  const now = localMinute(date, timeZone);
  return startMinutes < endMinutes
    ? now >= startMinutes && now < endMinutes
    : now >= startMinutes || now < endMinutes;
}

function calculationMethodId(value: string | null): number {
  const normalized = (value ?? "umm-al-qura").toLowerCase();
  const map: Record<string, number> = {
    "umm-al-qura": 4,
    mwl: 3,
    isna: 2,
    egyptian: 5,
    karachi: 1,
    tehran: 7,
    jafari: 0,
    qatar: 10,
    kuwait: 9,
    dubai: 8,
    turkey: 13,
  };
  return map[normalized] ?? 4;
}

function school(value: string | null): number {
  return (value ?? "").toLowerCase() === "hanafi" ? 1 : 0;
}

function scheduleCacheMatches(
  cache: CachedSchedule,
  location: PrayerLocation,
  date: string,
  timeZone: string,
  method: string,
  madhab: string
): boolean {
  return (
    cache.location_id === location.id &&
    cache.prayer_date === date &&
    Number(cache.latitude) === Number(location.latitude) &&
    Number(cache.longitude) === Number(location.longitude) &&
    cache.timezone === timeZone &&
    cache.calculation_method === method &&
    cache.madhab === madhab
  );
}

async function fetchTimings(
  location: PrayerLocation,
  date: string,
  method: string,
  madhab: string
): Promise<Record<string, string>> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    method: String(calculationMethodId(method)),
    school: String(school(madhab)),
  });
  const response = await fetch(
    `https://api.aladhan.com/v1/timings/${dateForProvider(date)}?${params.toString()}`,
    { headers: { "User-Agent": "ZIKR-Prayer-Notification-Worker/1.0" } }
  );
  if (!response.ok)
    throw new Error(`Prayer-time provider returned HTTP ${response.status}`);

  const payload = (await response.json()) as {
    data?: { timings?: Record<string, string> };
  };
  if (!payload.data?.timings)
    throw new Error("Prayer-time provider returned no timings");
  return payload.data.timings;
}

async function loadVapidBundle(): Promise<VapidBundle> {
  const { data: existing, error } = await supabase.rpc("get_push_vapid_bundle");
  if (error) throw error;
  if (existing && typeof existing === "object") return existing as VapidBundle;

  const generated = await generateVapidKeys({ extractable: true });
  const candidate: VapidBundle = {
    publicKey: await exportApplicationServerKey(generated),
    keys: await exportVapidKeys(generated),
  };
  const { data: stored, error: storeError } = await supabase.rpc(
    "ensure_push_vapid_bundle",
    {
      candidate,
    }
  );
  if (storeError) throw storeError;
  return stored as VapidBundle;
}

async function ensureSchedules(now: Date): Promise<number> {
  // The database function plans opt-in dhikr/salawat rows for every active device.
  const { error: backgroundError } = await supabase.rpc('plan_background_reminder_deliveries', { now_at: now.toISOString() });
  if (backgroundError) throw backgroundError;
  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("is_active", true)
    .limit(BATCH_SIZE);
  if (subscriptionsError) throw subscriptionsError;
  if (!subscriptions?.length) return 0;

  const userIds = [
    ...new Set(subscriptions.map(subscription => subscription.user_id)),
  ];
  const [
    { data: locations, error: locationsError },
    { data: preferences, error: preferencesError },
  ] = await Promise.all([
    supabase
      .from("prayer_locations")
      .select("id, user_id, latitude, longitude, timezone, is_default")
      .in("user_id", userIds)
      .eq("is_default", true),
    supabase
      .from("prayer_preferences")
      .select(
        "user_id, calculation_method, madhab, notifications_enabled, prayer_reminders, quiet_hours_start, quiet_hours_end"
      )
      .in("user_id", userIds),
  ]);
  if (locationsError) throw locationsError;
  if (preferencesError) throw preferencesError;

  const locationByUser = new Map<string, PrayerLocation>();
  for (const location of (locations ?? []) as PrayerLocation[]) {
    if (
      location.latitude !== null &&
      location.longitude !== null &&
      location.timezone
    ) {
      locationByUser.set(location.user_id, location);
    }
  }
  const preferenceByUser = new Map<string, PrayerPreference>();
  for (const preference of (preferences ?? []) as PrayerPreference[]) {
    preferenceByUser.set(preference.user_id, preference);
  }

  const eligible = (subscriptions as PushSubscriptionRow[]).filter(
    subscription => {
      const preference = preferenceByUser.get(subscription.user_id);
      return Boolean(
        locationByUser.get(subscription.user_id) &&
        preference?.notifications_enabled !== false
      );
    }
  );
  if (!eligible.length) return 0;

  const dateByUser = new Map<string, string[]>();
  for (const subscription of eligible) {
    const location = locationByUser.get(subscription.user_id)!;
    dateByUser.set(subscription.user_id, [
      formatLocalDate(now, location.timezone!),
      nextLocalDate(now, location.timezone!),
    ]);
  }
  const allDates = [...new Set([...dateByUser.values()].flat())];
  const locationIds = [
    ...new Set([...locationByUser.values()].map(location => location.id)),
  ];
  const { data: cachedRows, error: cacheError } = await supabase
    .from("prayer_schedule_cache")
    .select(
      "location_id, prayer_date, latitude, longitude, timezone, calculation_method, madhab, timings"
    )
    .in("location_id", locationIds)
    .in("prayer_date", allDates);
  if (cacheError) throw cacheError;
  const caches = (cachedRows ?? []) as CachedSchedule[];

  const inserts: Array<Record<string, unknown>> = [];
  for (const subscription of eligible) {
    const location = locationByUser.get(subscription.user_id)!;
    const preference = preferenceByUser.get(subscription.user_id)!;
    const method = preference.calculation_method ?? "umm-al-qura";
    const madhab = preference.madhab ?? "shafi";
    const reminders = preference.prayer_reminders ?? {};

    for (const date of dateByUser.get(subscription.user_id) ?? []) {
      let cache = caches.find(row =>
        scheduleCacheMatches(
          row,
          location,
          date,
          location.timezone!,
          method,
          madhab
        )
      );
      if (!cache) {
        const timings = await fetchTimings(location, date, method, madhab);
        const { data: stored, error: cacheInsertError } = await supabase
          .from("prayer_schedule_cache")
          .upsert(
            {
              location_id: location.id,
              prayer_date: date,
              latitude: location.latitude,
              longitude: location.longitude,
              timezone: location.timezone,
              calculation_method: method,
              madhab,
              timings,
              updated_at: now.toISOString(),
            },
            {
              onConflict:
                "location_id,prayer_date,latitude,longitude,timezone,calculation_method,madhab",
            }
          )
          .select(
            "location_id, prayer_date, latitude, longitude, timezone, calculation_method, madhab, timings"
          )
          .single();
        if (cacheInsertError) throw cacheInsertError;
        cache = stored as CachedSchedule;
        caches.push(cache);
      }

      for (const prayer of PRAYERS) {
        const offset = reminders[prayer];
        if (!Number.isInteger(offset)) continue;
        const prayerAt = zonedDateTime(
          date,
          location.timezone!,
          cache.timings[prayer] ?? ""
        );
        if (!prayerAt) continue;
        const scheduledAt = new Date(
          prayerAt.getTime() + Number(offset) * 60_000
        );
        if (scheduledAt.getTime() < now.getTime() - 60_000) continue;
        if (
          inQuietHours(
            scheduledAt,
            location.timezone!,
            preference.quiet_hours_start,
            preference.quiet_hours_end
          )
        )
          continue;

        inserts.push({
          user_id: subscription.user_id,
          push_subscription_id: subscription.id,
          prayer_name: prayer,
          scheduled_at: scheduledAt.toISOString(),
          status: "pending",
        });
      }
    }
  }

  if (!inserts.length) return 0;
  const { error: deliveryError } = await supabase
    .from("prayer_notification_deliveries")
    .upsert(inserts, {
      onConflict: "push_subscription_id,prayer_name,scheduled_at",
      ignoreDuplicates: true,
    });
  if (deliveryError) throw deliveryError;
  return inserts.length;
}

async function recoverStaleClaims(now: Date) {
  const staleBefore = new Date(now.getTime() - 10 * 60_000).toISOString();
  const { error } = await supabase
    .from("prayer_notification_deliveries")
    .update({
      status: "failed",
      failed_at: now.toISOString(),
      retry_after: new Date(now.getTime() + 60_000).toISOString(),
      error_message: "Recovered stale worker claim",
      updated_at: now.toISOString(),
    })
    .eq("status", "processing")
    .lt("processing_at", staleBefore);
  if (error) throw error;
}

async function claimDueDeliveries(now: Date): Promise<Delivery[]> {
  const { data: rows, error } = await supabase
    .from("prayer_notification_deliveries")
    .select(
      "id, user_id, push_subscription_id, prayer_name, notification_kind, notification_text, scheduled_at, attempt_count"
    )
    .in("status", ["pending", "failed"])
    .lte("scheduled_at", now.toISOString())
    .or(`retry_after.is.null,retry_after.lte.${now.toISOString()}`)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw error;

  const claimed: Delivery[] = [];
  for (const row of (rows ?? []) as Delivery[]) {
    const { data: updated, error: claimError } = await supabase
      .from("prayer_notification_deliveries")
      .update({
        status: "processing",
        processing_at: now.toISOString(),
        processed_at: now.toISOString(),
        attempt_count: row.attempt_count + 1,
        error_message: null,
        updated_at: now.toISOString(),
      })
      .eq("id", row.id)
      .in("status", ["pending", "failed"])
      .select(
        "id, user_id, push_subscription_id, prayer_name, notification_kind, notification_text, scheduled_at, attempt_count"
      )
      .maybeSingle();
    if (claimError) throw claimError;
    if (updated) claimed.push(updated as Delivery);
  }
  return claimed;
}

async function deliverDue(
  bundle: VapidBundle,
  now: Date
): Promise<{ sent: number; failed: number; deactivated: number }> {
  await recoverStaleClaims(now);
  const deliveries = await claimDueDeliveries(now);
  if (!deliveries.length) return { sent: 0, failed: 0, deactivated: 0 };

  const subscriptionIds = [
    ...new Set(deliveries.map(delivery => delivery.push_subscription_id)),
  ];
  const { data: rows, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .in("id", subscriptionIds)
    .eq("is_active", true);
  if (error) throw error;
  const subscriptions = new Map(
    (rows ?? []).map(row => [row.id, row as PushSubscriptionRow])
  );

  const vapidKeys = await importVapidKeys(bundle.keys);
  const applicationServer = await ApplicationServer.new({
    contactInformation: CONTACT,
    vapidKeys,
  });

  let sent = 0;
  let failed = 0;
  let deactivated = 0;
  for (const delivery of deliveries) {
    const subscription = subscriptions.get(delivery.push_subscription_id);
    if (!subscription) {
      await supabase
        .from("prayer_notification_deliveries")
        .update({
          status: "cancelled",
          processed_at: now.toISOString(),
          error_message: "Subscription is no longer active",
          updated_at: now.toISOString(),
        })
        .eq("id", delivery.id);
      continue;
    }

    try {
      const topic = `zikr-${delivery.notification_kind}-${delivery.scheduled_at.slice(0, 10)}`.slice(0, 32);
      const isPrayer = delivery.notification_kind === 'prayer';
      await applicationServer
        .subscribe({
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        })
        .pushTextMessage(
          JSON.stringify({
            title: isPrayer ? `حان وقت صلاة ${PRAYER_NAMES_AR[delivery.prayer_name] ?? delivery.prayer_name}` : delivery.notification_kind === 'dhikr' ? 'تذكير بالذكر' : 'تذكير بالصلاة على النبي',
            body: isPrayer ? 'حافظ على صلاتك' : delivery.notification_text ?? (delivery.notification_kind === 'dhikr' ? 'سبحان الله وبحمده' : 'اللهم صل وسلم على نبينا محمد'),
            url: isPrayer ? '/prayer-times' : '/adhkar',
            tag: topic,
          }),
          { urgency: Urgency.High, ttl: 300, topic }
        );

      await supabase
        .from("prayer_notification_deliveries")
        .update({
          status: "sent",
          sent_at: now.toISOString(),
          processed_at: now.toISOString(),
          retry_after: null,
          updated_at: now.toISOString(),
        })
        .eq("id", delivery.id);
      await supabase
        .from("push_subscriptions")
        .update({
          last_used_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", subscription.id);
      sent += 1;
    } catch (error) {
      const status =
        error instanceof PushMessageError ? error.response.status : null;
      const invalid = status === 404 || status === 410;
      if (invalid) {
        await supabase
          .from("push_subscriptions")
          .update({ is_active: false, updated_at: now.toISOString() })
          .eq("id", subscription.id);
        deactivated += 1;
      }

      const retryable = !invalid && delivery.attempt_count < 3;
      const retryAfter = retryable
        ? new Date(
            now.getTime() +
              Math.min(15 * 60_000, 60_000 * 2 ** delivery.attempt_count)
          ).toISOString()
        : null;
      await supabase
        .from("prayer_notification_deliveries")
        .update({
          status: retryable ? "failed" : "cancelled",
          failed_at: now.toISOString(),
          processed_at: now.toISOString(),
          retry_after: retryAfter,
          error_message: status
            ? `Push service returned HTTP ${status}`
            : "Push delivery failed",
          updated_at: now.toISOString(),
        })
        .eq("id", delivery.id);
      failed += 1;
    }
  }

  return { sent, failed, deactivated };
}

Deno.serve(async request => {
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);

  try {
    const expected = await supabase.rpc("get_push_scheduler_secret");
    if (expected.error || typeof expected.data !== "string") {
      throw new Error("Scheduler authentication is unavailable");
    }
    const supplied =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!supplied || supplied !== expected.data)
      return json({ error: "Unauthorized" }, 401);

    const now = new Date();
    const bundle = await loadVapidBundle();
    const planned = await ensureSchedules(now);
    const delivery = await deliverDue(bundle, now);
    return json({ ok: true, planned, ...delivery });
  } catch (error) {
    console.error(
      "[prayer-notification-worker] failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return json({ error: "Notification worker failed" }, 500);
  }
});
