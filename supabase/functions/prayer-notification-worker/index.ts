import { createClient } from "@supabase/supabase-js";
import type { ExportedVapidKeys } from "webpush";
import { forEachIdPage } from "./pagination.ts";
import { canSchedulePrayerSubscription, isDeliverySubscriptionOwnerValid } from "./eligibility.ts";
import { buildNotificationTopic, nextLocalDate, zonedDateTime } from "./time-zone.ts";
import { isAllowedPushEndpoint } from "../../../src/features/notifications/services/push-endpoint.ts";
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
  processing_at: string;
  updated_at: string;
};

type DueDeliveryCandidate = Omit<Delivery, "processing_at"> & {
  retry_after: string | null;
};

type VapidBundle = {
  publicKey: string;
  keys: ExportedVapidKeys;
};
type BackgroundReminderPreference = {
  user_id: string;
  dhikr_enabled: boolean;
  salawat_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string | null;
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

function safeTimeZone(value: string | null | undefined): string {
  const candidate = value?.trim() || "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date(0));
    return candidate;
  } catch {
    return "UTC";
  }
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

async function ensureSubscriptionBatchSchedules(
  subscriptions: readonly PushSubscriptionRow[],
  now: Date,
): Promise<number> {
  if (!subscriptions.length) return 0;

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

  const eligible = subscriptions.filter(
    subscription => {
      const preference = preferenceByUser.get(subscription.user_id);
      return canSchedulePrayerSubscription(
        Boolean(locationByUser.get(subscription.user_id)),
        preference,
      );
    }
  );
  if (!eligible.length) return 0;

  const dateByUser = new Map<string, string[]>();
  for (const subscription of eligible) {
    const location = locationByUser.get(subscription.user_id)!;
    const timeZone = safeTimeZone(location.timezone);
    dateByUser.set(subscription.user_id, [
      formatLocalDate(now, timeZone),
      nextLocalDate(now, timeZone),
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
    const timeZone = safeTimeZone(location.timezone);
    const preference = preferenceByUser.get(subscription.user_id);
    if (!preference) continue;
    const method = preference.calculation_method ?? "umm-al-qura";
    const madhab = preference.madhab ?? "shafi";
    const reminders = preference.prayer_reminders ?? {};

    for (const date of dateByUser.get(subscription.user_id) ?? []) {
      let cache = caches.find(row =>
        scheduleCacheMatches(
          row,
          location,
          date,
          timeZone,
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
              timezone: timeZone,
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
          timeZone,
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
            timeZone,
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
  for (let offset = 0; offset < inserts.length; offset += BATCH_SIZE) {
    const { error: deliveryError } = await supabase
      .from("prayer_notification_deliveries")
      .upsert(inserts.slice(offset, offset + BATCH_SIZE), {
        onConflict: "push_subscription_id,prayer_name,scheduled_at",
        ignoreDuplicates: true,
      });
    if (deliveryError) throw deliveryError;
  }
  return inserts.length;
}

async function ensureSchedules(now: Date): Promise<number> {
  // The database function plans opt-in dhikr/salawat rows for every active device.
  const { error: backgroundError } = await supabase.rpc(
    "plan_background_reminder_deliveries",
    { now_at: now.toISOString() },
  );
  if (backgroundError) throw backgroundError;

  let scheduled = 0;
  // Stream one bounded page at a time. The location/preference/cache .in()
  // queries therefore never receive an unbounded list of user or location IDs.
  await forEachIdPage(
    async (afterId, pageSize) => {
      let query = supabase
        .from("push_subscriptions")
        .select("id, user_id, endpoint, p256dh, auth")
        .eq("is_active", true)
        .order("id", { ascending: true })
        .limit(pageSize);
      if (afterId) query = query.gt("id", afterId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PushSubscriptionRow[];
    },
    BATCH_SIZE,
    async page => {
      scheduled += await ensureSubscriptionBatchSchedules(page, now);
    },
  );
  return scheduled;
}

async function recoverStaleClaims(now: Date) {
  const staleBefore = new Date(now.getTime() - 10 * 60_000).toISOString();
  const retryAfter = new Date(now.getTime() + 60_000).toISOString();

  // Match the normal delivery retry budget. A repeatedly interrupted claim
  // must not cycle forever through processing -> failed -> processing.
  const { error: retryError } = await supabase
    .from("prayer_notification_deliveries")
    .update({
      status: "failed",
      failed_at: now.toISOString(),
      processed_at: now.toISOString(),
      retry_after: retryAfter,
      error_message: "Recovered stale worker claim; retry scheduled",
      updated_at: now.toISOString(),
    })
    .eq("status", "processing")
    .lt("processing_at", staleBefore)
    .lt("attempt_count", 3);
  if (retryError) throw retryError;

  const { error: exhaustedError } = await supabase
    .from("prayer_notification_deliveries")
    .update({
      status: "cancelled",
      failed_at: now.toISOString(),
      processed_at: now.toISOString(),
      retry_after: null,
      error_message: "Stale worker claim exhausted retry budget; manual review required",
      updated_at: now.toISOString(),
    })
    .eq("status", "processing")
    .lt("processing_at", staleBefore)
    .gte("attempt_count", 3);
  if (exhaustedError) throw exhaustedError;
}

async function getDueDeliveryCandidates(now: Date): Promise<DueDeliveryCandidate[]> {
  const { data: rows, error } = await supabase
    .from("prayer_notification_deliveries")
    .select(
      "id, user_id, push_subscription_id, prayer_name, notification_kind, notification_text, scheduled_at, retry_after, updated_at, attempt_count"
    )
    .in("status", ["pending", "failed"])
    .lte("scheduled_at", now.toISOString())
    .or(`retry_after.is.null,retry_after.lte.${now.toISOString()}`)
    .order("scheduled_at", { ascending: true })
    .limit(BATCH_SIZE);
  if (error) throw error;
  return (rows ?? []) as DueDeliveryCandidate[];
}

/**
 * Claim one delivery immediately before processing it. The previous worker
 * claimed an entire 100-row batch, then sent sequentially; later rows could
 * become stale while waiting behind a slow push request and be sent twice.
 */
async function claimDueDelivery(
  candidate: DueDeliveryCandidate,
  now: Date,
): Promise<Delivery | null> {
  const claimAt = now.toISOString();
  const { data: updated, error } = await supabase
    .from("prayer_notification_deliveries")
    .update({
      status: "processing",
      processing_at: claimAt,
      attempt_count: candidate.attempt_count + 1,
      error_message: null,
      updated_at: claimAt,
    })
    .eq("id", candidate.id)
    .in("status", ["pending", "failed"])
    .lte("scheduled_at", claimAt)
    .or(`retry_after.is.null,retry_after.lte.${claimAt}`)
    .eq("updated_at", candidate.updated_at)
    .select(
      "id, user_id, push_subscription_id, prayer_name, notification_kind, notification_text, scheduled_at, attempt_count, processing_at, updated_at"
    )
    .maybeSingle();
  if (error) throw error;
  return (updated as Delivery | null) ?? null;
}

async function getActiveSubscriptionForDelivery(
  delivery: Delivery,
): Promise<PushSubscriptionRow | null> {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth")
    .eq("id", delivery.push_subscription_id)
    .eq("user_id", delivery.user_id)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  return (data as PushSubscriptionRow | null) ?? null;
}

/** Finalize only while this exact worker still owns the processing lease. */
async function updateDeliveryIfLease(
  delivery: Delivery,
  patch: Record<string, unknown>,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("prayer_notification_deliveries")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", delivery.id)
    .eq("status", "processing")
    .eq("processing_at", delivery.processing_at)
    .eq("updated_at", delivery.updated_at)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

async function getCurrentDeliveryPreferences(delivery: Delivery): Promise<{
  prayerPreference: Pick<PrayerPreference, "notifications_enabled" | "prayer_reminders" | "quiet_hours_start" | "quiet_hours_end"> | null;
  prayerLocation: Pick<PrayerLocation, "timezone"> | null;
  backgroundPreference: BackgroundReminderPreference | null;
}> {
  if (delivery.notification_kind === "prayer") {
    const [preferenceResult, locationResult] = await Promise.all([
      supabase
        .from("prayer_preferences")
        .select("notifications_enabled, prayer_reminders, quiet_hours_start, quiet_hours_end")
        .eq("user_id", delivery.user_id)
        .maybeSingle(),
      supabase
        .from("prayer_locations")
        .select("timezone")
        .eq("user_id", delivery.user_id)
        .eq("is_default", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (preferenceResult.error) throw preferenceResult.error;
    if (locationResult.error) throw locationResult.error;
    return {
      prayerPreference: (preferenceResult.data ?? null) as Pick<PrayerPreference, "notifications_enabled" | "prayer_reminders" | "quiet_hours_start" | "quiet_hours_end"> | null,
      prayerLocation: (locationResult.data ?? null) as Pick<PrayerLocation, "timezone"> | null,
      backgroundPreference: null,
    };
  }

  const { data, error } = await supabase
    .from("background_reminder_preferences")
    .select("user_id, dhikr_enabled, salawat_enabled, quiet_hours_start, quiet_hours_end, timezone")
    .eq("user_id", delivery.user_id)
    .maybeSingle();
  if (error) throw error;
  return {
    prayerPreference: null,
    prayerLocation: null,
    backgroundPreference: (data ?? null) as BackgroundReminderPreference | null,
  };
}

async function deliverDue(
  bundle: VapidBundle,
  now: Date
): Promise<{ sent: number; failed: number; deactivated: number }> {
  await recoverStaleClaims(now);
  const candidates = await getDueDeliveryCandidates(now);
  if (!candidates.length) return { sent: 0, failed: 0, deactivated: 0 };

  const vapidKeys = await importVapidKeys(bundle.keys);
  const applicationServer = await ApplicationServer.new({
    contactInformation: CONTACT,
    vapidKeys,
  });

  let sent = 0;
  let failed = 0;
  let deactivated = 0;
  for (const candidate of candidates) {
    // Do not hold a whole batch in "processing" while earlier pushes are sent.
    let deliveryNow = new Date();
    const delivery = await claimDueDelivery(candidate, deliveryNow);
    if (!delivery) continue;

    const scheduledAt = new Date(delivery.scheduled_at);
    let subscription: PushSubscriptionRow | null = null;
    try {
      // Preferences and locations are intentionally re-read after this row is
      // claimed. A batch snapshot can become stale while earlier pushes are sent,
      // which could deliver after a user opts out or changes quiet hours.
      const currentPreferences = await getCurrentDeliveryPreferences(delivery);
      deliveryNow = new Date();
      let skipReason: string | null = null;

      if (delivery.notification_kind === "prayer") {
        const preference = currentPreferences.prayerPreference;
        const location = currentPreferences.prayerLocation;
        if (
          !preference ||
          preference.notifications_enabled !== true ||
          !Number.isInteger(preference.prayer_reminders?.[delivery.prayer_name]) ||
          !location?.timezone
        ) {
          skipReason = "Prayer reminder is no longer enabled or configured";
        } else if (
          inQuietHours(
            scheduledAt,
            safeTimeZone(location.timezone),
            preference.quiet_hours_start,
            preference.quiet_hours_end,
          ) ||
          inQuietHours(
            deliveryNow,
            safeTimeZone(location.timezone),
            preference.quiet_hours_start,
            preference.quiet_hours_end,
          )
        ) {
          skipReason = "Skipped during quiet hours";
        }
      } else {
        const preference = currentPreferences.backgroundPreference;
        const enabled =
          delivery.notification_kind === "dhikr"
            ? preference?.dhikr_enabled
            : preference?.salawat_enabled;
        if (!preference || enabled !== true) {
          skipReason = "Background reminder is no longer enabled";
        } else if (
          inQuietHours(
            scheduledAt,
            safeTimeZone(preference.timezone),
            preference.quiet_hours_start,
            preference.quiet_hours_end,
          ) ||
          inQuietHours(
            deliveryNow,
            safeTimeZone(preference.timezone),
            preference.quiet_hours_start,
            preference.quiet_hours_end,
          )
        ) {
          skipReason = "Skipped during quiet hours";
        }
      }

      if (skipReason) {
        const finalized = await updateDeliveryIfLease(delivery, {
          status: "cancelled",
          processed_at: deliveryNow.toISOString(),
          retry_after: null,
          error_message: skipReason,
        });
        if (!finalized) {
          console.warn("[prayer-notification-worker] Preference skip arrived after its delivery lease was recovered; preserving the newer delivery state:", delivery.id);
        }
        continue;
      }
      // Re-read after claiming each delivery. A batch snapshot can become stale
      // while earlier pushes are sent, allowing an opted-out device or replaced
      // endpoint to receive a later notification from the same batch.
      subscription = await getActiveSubscriptionForDelivery(delivery);
      if (!subscription || !isDeliverySubscriptionOwnerValid(delivery.user_id, subscription.user_id)) {
        await updateDeliveryIfLease(delivery, {
          status: "cancelled",
          processed_at: deliveryNow.toISOString(),
          retry_after: null,
          error_message: subscription
            ? "Subscription owner does not match delivery owner"
            : "Subscription is no longer active",
        });
        continue;
      }

      if (!isAllowedPushEndpoint(subscription.endpoint)) {
        const { data: deactivatedRow, error: deactivateError } = await supabase
          .from("push_subscriptions")
          .update({ is_active: false, updated_at: deliveryNow.toISOString() })
          .eq("id", subscription.id)
          .eq("user_id", delivery.user_id)
          .eq("endpoint", subscription.endpoint)
          .eq("p256dh", subscription.p256dh)
          .eq("auth", subscription.auth)
          .eq("is_active", true)
          .select("id")
          .maybeSingle();
        if (deactivateError) {
          console.error("[prayer-notification-worker] invalid endpoint deactivation failed:", deactivateError.message);
        } else if (deactivatedRow?.id) {
          deactivated += 1;
        }
        await updateDeliveryIfLease(delivery, {
          status: "cancelled",
          processed_at: deliveryNow.toISOString(),
          retry_after: null,
          error_message: "Unsupported push service endpoint host",
        });
        continue;
      }

      const topic = buildNotificationTopic({
        notificationKind: delivery.notification_kind,
        prayerName: delivery.prayer_name,
        scheduledAt: delivery.scheduled_at,
      });
      const isPrayer = delivery.notification_kind === 'prayer';
      // Foreground/local reminders use stable tags. Reuse those tags for server
      // push notifications so an open app replaces rather than duplicates them.
      const notificationTag = isPrayer
        ? topic
        : delivery.notification_kind === "dhikr"
          ? "dhikr-reminder"
          : "salawat-reminder";
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
            tag: notificationTag,
          }),
          { urgency: Urgency.High, ttl: 300, topic }
        );

      const finalized = await updateDeliveryIfLease(delivery, {
        status: "sent",
        sent_at: deliveryNow.toISOString(),
        processed_at: deliveryNow.toISOString(),
        retry_after: null,
      });
      if (!finalized) {
        console.warn("[prayer-notification-worker] Push succeeded after its delivery lease was recovered; preserving the newer delivery state:", delivery.id);
        continue;
      }
      const { error: lastUsedError } = await supabase
        .from("push_subscriptions")
        .update({
          last_used_at: deliveryNow.toISOString(),
          updated_at: deliveryNow.toISOString(),
        })
        .eq("id", subscription.id)
        .eq("user_id", delivery.user_id)
        .eq("endpoint", subscription.endpoint)
        .eq("p256dh", subscription.p256dh)
        .eq("auth", subscription.auth)
        .eq("is_active", true);
      if (lastUsedError) console.error("[prayer-notification-worker] subscription last-used update failed:", lastUsedError.message);
      sent += 1;
    } catch (error) {
      const status =
        error instanceof PushMessageError ? error.response.status : null;
      const invalid = status === 404 || status === 410;
      const retryable = !invalid && delivery.attempt_count < 3;
      const retryAfter = retryable
        ? new Date(
            deliveryNow.getTime() +
              Math.min(15 * 60_000, 60_000 * 2 ** delivery.attempt_count)
          ).toISOString()
        : null;
      if (invalid && subscription) {
        // A 404/410 is definitive only for the exact endpoint/key snapshot sent.
        // Never deactivate a replacement subscription that arrived concurrently.
        const { data: deactivatedRow, error: deactivateError } = await supabase
          .from("push_subscriptions")
          .update({ is_active: false, updated_at: deliveryNow.toISOString() })
          .eq("id", subscription.id)
          .eq("user_id", delivery.user_id)
          .eq("endpoint", subscription.endpoint)
          .eq("p256dh", subscription.p256dh)
          .eq("auth", subscription.auth)
          .eq("is_active", true)
          .select("id")
          .maybeSingle();
        if (deactivateError) {
          console.error("[prayer-notification-worker] subscription deactivation failed:", deactivateError.message);
        } else if (deactivatedRow?.id) {
          deactivated += 1;
        }
      }
      const finalized = await updateDeliveryIfLease(delivery, {
        status: retryable ? "failed" : "cancelled",
        failed_at: deliveryNow.toISOString(),
        processed_at: deliveryNow.toISOString(),
        retry_after: retryAfter,
        error_message: status
          ? `Push service returned HTTP ${status}`
          : "Push delivery failed",
      });
      if (!finalized) {
        console.warn("[prayer-notification-worker] Failed push result arrived after its delivery lease was recovered; preserving the newer delivery state:", delivery.id);
        continue;
      }
      failed += 1;
    }
  }

  return { sent, failed, deactivated };
}

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let diff = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
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
    if (!supplied || !constantTimeEqual(supplied, expected.data))
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
