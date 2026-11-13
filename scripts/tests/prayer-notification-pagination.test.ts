import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fetchAllIdPages, forEachIdPage } from "../../supabase/functions/prayer-notification-worker/pagination";
import { getDeliveryLeaseHeartbeatIntervalMs, startDeliveryLeaseHeartbeat } from "../../supabase/functions/prayer-notification-worker/delivery-lease";
import {
  fetchScheduleOrSkip,
  normalizePrayerTimings,
} from "../../supabase/functions/prayer-notification-worker/schedule-fetch";
import { canSchedulePrayerSubscription, isDeliverySubscriptionOwnerValid, isDeliveryWithinGraceWindow } from "../../supabase/functions/prayer-notification-worker/eligibility";
import {
  buildNotificationTag,
  buildNotificationTopic,
  isCurrentIntervalReminderSlot,
  isCurrentPrayerReminderSchedule,
  matchesAnyCurrentPrayerReminderSchedule,
  nextLocalDate,
  previousLocalDate,
  zonedDateTime,
} from "../../supabase/functions/prayer-notification-worker/time-zone";
import { syncBackgroundReminderTimeZone } from "../../src/features/reminders/services/reminder-timezone-sync";
import { isAllowedPushEndpoint } from "../../src/features/notifications/services/push-endpoint";
import {
  normalizePushSubscriptionRequestBody,
  parsePushCoordinate,
} from "../../src/features/notifications/services/push-subscription-request";

const requiredPrayerNames = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
const validProviderTimings = {
  Fajr: "05:00 (EET)",
  Sunrise: "06:20 (EET)",
  Dhuhr: "11:45 (EET)",
  Asr: "14:50 (EET)",
  Maghrib: "17:10 (EET)",
  Isha: "18:30 (EET)",
};
assert.deepEqual(
  normalizePrayerTimings(validProviderTimings, requiredPrayerNames),
  validProviderTimings,
  "complete Aladhan-style timing objects must retain all required prayer times",
);
for (const malformedTimings of [
  null,
  "not-an-object",
  [],
  {},
  { ...validProviderTimings, Isha: undefined },
  { ...validProviderTimings, Dhuhr: 12 },
  { ...validProviderTimings, Fajr: "99:00" },
  { ...validProviderTimings, Maghrib: "17:99" },
  { ...validProviderTimings, Sunrise: "not-a-time" },
]) {
  assert.equal(
    normalizePrayerTimings(malformedTimings, requiredPrayerNames),
    null,
    "incomplete or malformed provider/cache timings must be rejected",
  );
}

const malformedScheduleKeys = new Set<string>();
const malformedSchedule = await fetchScheduleOrSkip(
  "location-malformed|2026-11-13",
  malformedScheduleKeys,
  async () => {
    const normalized = normalizePrayerTimings({}, requiredPrayerNames);
    if (!normalized) throw new Error("Prayer-time provider returned incomplete or malformed timings");
    return normalized;
  },
  () => undefined,
);
assert.equal(malformedSchedule, null, "an invalid timing payload must be treated as a failed location/date fetch");
assert.equal(malformedScheduleKeys.has("location-malformed|2026-11-13"), true,
  "an invalid timing payload must be cached as a failure for the current worker page");

assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/subscription-token"), true);
assert.equal(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/subscription-token"), true);
assert.equal(isAllowedPushEndpoint("https://web.push.apple.com/subscription-token"), true);
assert.equal(isAllowedPushEndpoint("https://tenant.notify.windows.com/subscription-token"), true);
for (const endpoint of [
  "http://fcm.googleapis.com/fcm/send/token",
  "https://www.wikipedia.org/push/token",
  "https://fcm.googleapis.com.attacker.test/fcm/send/token",
  "https://127.0.0.1/push/token",
  "https://169.254.169.254/latest/meta-data",
  "https://user:pass@fcm.googleapis.com/fcm/send/token",
  "https://fcm.googleapis.com:8443/fcm/send/token",
  "https://fcm.googleapis.com/",
]) {
  assert.equal(isAllowedPushEndpoint(endpoint), false, `untrusted push endpoint must be rejected: ${endpoint}`);
}

assert.deepEqual(normalizePushSubscriptionRequestBody(null), {}, "JSON null must normalize to an empty request object");
assert.deepEqual(normalizePushSubscriptionRequestBody(["endpoint"]), {}, "JSON arrays must not be treated as request objects");
assert.deepEqual(normalizePushSubscriptionRequestBody("invalid"), {}, "JSON primitives must not be treated as request objects");
assert.deepEqual(
  normalizePushSubscriptionRequestBody({ endpoint: "https://fcm.googleapis.com/token" }),
  { endpoint: "https://fcm.googleapis.com/token" },
  "valid JSON objects must retain their request fields",
);
assert.equal(parsePushCoordinate(0, -90, 90), 0, "the equator is a valid latitude");
assert.equal(parsePushCoordinate(-180, -180, 180), -180, "the longitude boundary is valid");
assert.equal(parsePushCoordinate(90, -90, 90), 90, "the latitude boundary is valid");
for (const invalidCoordinate of [null, undefined, "", "0", NaN, Infinity, -90.01, 90.01]) {
  assert.equal(
    parsePushCoordinate(invalidCoordinate, -90, 90),
    null,
    "invalid latitude must be rejected: " + String(invalidCoordinate),
  );
}
for (const invalidLongitude of [null, "", "0", -180.01, 180.01]) {
  assert.equal(
    parsePushCoordinate(invalidLongitude, -180, 180),
    null,
    "invalid longitude must be rejected: " + String(invalidLongitude),
  );
}

const source = Array.from({ length: 205 }, (_, index) => ({
  id: String(index + 1).padStart(4, "0"),
  value: index + 1,
}));
const cursors: Array<string | null> = [];
const all = await fetchAllIdPages(async (afterId, pageSize) => {
  cursors.push(afterId);
  const start = afterId === null
    ? 0
    : source.findIndex((row) => row.id === afterId) + 1;
  return source.slice(start, start + pageSize);
}, 100);

assert.equal(all.length, 205, "all subscriptions across multiple pages must be returned");
assert.deepEqual(all.map((row) => row.id), source.map((row) => row.id));
assert.deepEqual(cursors, [null, "0100", "0200"], "each page must continue strictly after the last UUID");

const visitedPages: string[][] = [];
const visitedCount = await forEachIdPage(
  async (afterId, pageSize) => {
    const start = afterId === null
      ? 0
      : source.findIndex((row) => row.id === afterId) + 1;
    return source.slice(start, start + pageSize);
  },
  100,
  async page => {
    visitedPages.push(page.map(row => row.id));
  },
);
assert.equal(visitedCount, 205);
assert.deepEqual(visitedPages.map(page => page.length), [100, 100, 5]);
assert.deepEqual(
  visitedPages.flat(),
  source.map(row => row.id),
  "streaming pagination must visit every row in bounded pages without dropping later subscriptions",
);


assert.deepEqual(
  await fetchAllIdPages(async () => [], 100),
  [],
  "an empty first page must return an empty result",
);
await assert.rejects(
  () => fetchAllIdPages(async () => [{ id: "same" }, { id: "same" }], 2),
  /strictly increasing order/,
  "duplicate or non-advancing IDs must fail rather than loop forever",
);
await assert.rejects(
  () => fetchAllIdPages(async () => [{ id: "a" }, { id: "b" }], 1),
  /more rows than requested/,
);
await assert.rejects(
  () => fetchAllIdPages(async () => [], 0),
  /pageSize/,
);

const worker = readFileSync("supabase/functions/prayer-notification-worker/index.ts", "utf8");
assert.match(worker, /normalizePrayerTimings\(cache\.timings, PRAYERS\)/,
  "malformed cached timings must be treated as a cache miss and refreshed");
assert.match(worker, /normalizePrayerTimings\(payload\.data\?\.timings, PRAYERS\)/,
  "provider responses must be complete and validated before they enter the schedule cache");
const subscriptionRoute = readFileSync("src/app/api/push/subscription/route.ts", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const normalizedRequestBodyCalls = subscriptionRoute.match(/normalizePushSubscriptionRequestBody\(\s*await request\.json\(\)\.catch\(\(\) => null\)\s*\)/g) ?? [];
assert.equal(normalizedRequestBodyCalls.length, 2, "POST and DELETE must normalize malformed and non-object JSON before reading fields");
assert.match(subscriptionRoute, /parsePushCoordinate\(location\?\.latitude, -90, 90\)/);
assert.match(subscriptionRoute, /parsePushCoordinate\(location\?\.longitude, -180, 180\)/);
assert.match(subscriptionRoute, /isAllowedPushEndpoint\(endpoint\)/, "subscription intake must reject arbitrary HTTPS endpoints");
assert.match(worker, /isAllowedPushEndpoint\(subscription\.endpoint\)/, "the delivery worker must revalidate legacy endpoints before outbound requests");
const staleRecoveryStart = worker.indexOf("async function recoverStaleClaims");
const staleRecoveryEnd = worker.indexOf("async function getDueDeliveryCandidates", staleRecoveryStart);
const staleRecovery = worker.slice(staleRecoveryStart, staleRecoveryEnd);
assert.ok(staleRecoveryStart >= 0 && staleRecoveryEnd > staleRecoveryStart);
assert.match(staleRecovery, /\.lt\("attempt_count", 3\)/,
  "stale claims below the retry budget may be retried once the backoff expires");
assert.match(staleRecovery, /\.gte\("attempt_count", 3\)/,
  "stale claims at the retry budget must be selected for terminal handling");
assert.match(staleRecovery, /status: "cancelled"/,
  "stale claims that exhaust the retry budget must not cycle forever");
assert.match(staleRecovery, /Stale worker claim exhausted retry budget; manual review required/);

assert.match(worker, /forEachIdPage\(/);
assert.match(worker, /AbortSignal\.timeout\(10_000\)/, "prayer-time provider calls must have a bounded timeout");
assert.match(worker, /fetchScheduleOrSkip\(/, "one failed location/date must not abort later subscription pages");
assert.match(worker, /buildNotificationTag\(/, "server push tags must align with browser-local notification tags");
assert.match(serviceWorker, /tag:\s*`prayer-\$\{prayerName\}`/, "local prayer reminders use a stable prayer-specific notification tag");
assert.match(worker, /canSchedulePrayerSubscription\(/);
assert.match(worker, /preference\.notifications_enabled !== true/);
assert.match(worker, /isDeliverySubscriptionOwnerValid\(delivery\.user_id, subscription\.user_id\)/);
assert.match(worker, /Subscription owner does not match delivery owner/);
const subscriptionLoaderStart = worker.indexOf("async function getActiveSubscriptionForDelivery");
const subscriptionLoaderEnd = worker.indexOf("async function updateDeliveryIfLease", subscriptionLoaderStart);
const subscriptionLoader = worker.slice(subscriptionLoaderStart, subscriptionLoaderEnd);
assert.ok(subscriptionLoaderStart >= 0 && subscriptionLoaderEnd > subscriptionLoaderStart);
const deliverySourceStartForFencing = worker.indexOf("async function deliverDue");
const deliverySourceEndForFencing = worker.indexOf("function constantTimeEqual", deliverySourceStartForFencing);
const deliverySourceForFencing = worker.slice(deliverySourceStartForFencing, deliverySourceEndForFencing);
assert.match(subscriptionLoader, /\.eq\("id", delivery\.push_subscription_id\)/);
assert.match(subscriptionLoader, /\.eq\("user_id", delivery\.user_id\)/);
assert.match(subscriptionLoader, /\.eq\("is_active", true\)/,
  "each delivery must re-read only its current active subscription after the claim");

const preferenceLoaderStart = worker.indexOf("async function getCurrentDeliveryPreferences");
const preferenceLoaderEnd = worker.indexOf("async function deliverDue", preferenceLoaderStart);
const preferenceLoader = worker.slice(preferenceLoaderStart, preferenceLoaderEnd);
assert.ok(preferenceLoaderStart >= 0 && preferenceLoaderEnd > preferenceLoaderStart);
assert.match(preferenceLoader, /\.from\("prayer_preferences"\)/);
assert.match(preferenceLoader, /\.from\("prayer_locations"\)/);
assert.match(preferenceLoader, /\.from\("background_reminder_preferences"\)/);

assert.match(preferenceLoader, /calculation_method, madhab, notifications_enabled, prayer_reminders/);
assert.match(preferenceLoader, /\.select\("id, latitude, longitude, timezone"\)/);
assert.match(preferenceLoader, /dhikr_interval_minutes, salawat_enabled, salawat_interval_minutes/);
assert.match(deliverySourceForFencing, /\.from\("prayer_schedule_cache"\)/);
assert.match(deliverySourceForFencing, /matchesAnyCurrentPrayerReminderSchedule/);
assert.match(deliverySourceForFencing, /isCurrentIntervalReminderSlot/);

assert.equal(
  (preferenceLoader.match(/\.eq\("user_id", delivery\.user_id\)/g) ?? []).length,
  3,
  "each notification kind must load current preferences for the claimed delivery owner",
);
assert.doesNotMatch(
  deliverySourceForFencing,
  /prayerPreferenceByUser|prayerLocationByUser|backgroundPreferenceByUser/,
  "a due batch must not send using stale preference snapshots loaded before individual claims",
);

const claimPosition = deliverySourceForFencing.indexOf("claimDueDelivery(candidate, deliveryNow)");
const subscriptionReadPosition = deliverySourceForFencing.indexOf("getActiveSubscriptionForDelivery(delivery)");
const pushDeliveryPosition = deliverySourceForFencing.indexOf(".pushTextMessage(");
const freshPreferenceReadPosition = deliverySourceForFencing.indexOf("getCurrentDeliveryPreferences(delivery)");
assert.ok(
  claimPosition >= 0 && freshPreferenceReadPosition > claimPosition && pushDeliveryPosition > freshPreferenceReadPosition,
  "current opt-in, prayer offsets and quiet-hours settings must be re-read after the delivery claim and before push",
);
assert.ok(
  claimPosition >= 0 && subscriptionReadPosition > claimPosition && pushDeliveryPosition > subscriptionReadPosition,
  "the active subscription must be revalidated after claiming and immediately before push delivery",
);
assert.doesNotMatch(deliverySourceForFencing, /\.in\("id", subscriptionIds\)/,
  "deliveries must not use a batch subscription snapshot that can become stale while earlier pushes are sent");

const endpointSnapshotFilters = (deliverySourceForFencing.match(/\.eq\("endpoint", subscription\.endpoint\)/g) ?? []).length;
const keySnapshotFilters = (deliverySourceForFencing.match(/\.eq\("p256dh", subscription\.p256dh\)/g) ?? []).length;
const authSnapshotFilters = (deliverySourceForFencing.match(/\.eq\("auth", subscription\.auth\)/g) ?? []).length;
assert.ok(endpointSnapshotFilters >= 3 && keySnapshotFilters >= 3 && authSnapshotFilters >= 3,
  "deactivation and last-used updates must compare the exact endpoint/key snapshot before touching a subscription");
const subscriptionOwnershipGuardPosition = deliverySourceForFencing.indexOf("isDeliverySubscriptionOwnerValid(delivery.user_id, subscription.user_id)");
assert.ok(subscriptionOwnershipGuardPosition >= 0 && pushDeliveryPosition > subscriptionOwnershipGuardPosition, "subscription ownership must be validated before any push is sent");
assert.equal(canSchedulePrayerSubscription(true, undefined), false, "a missing prayer preference must not be treated as opted in");
assert.equal(canSchedulePrayerSubscription(true, null), false, "a null prayer preference must not be treated as opted in");
assert.equal(canSchedulePrayerSubscription(false, { notifications_enabled: true }), false, "a subscription without a default location must not be scheduled");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: false }), false, "disabled prayer notifications must be skipped");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: null }), false, "a null opt-in flag must fail closed");
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: true }), true, "only an explicit opt-in may schedule notifications");
assert.equal(isDeliverySubscriptionOwnerValid("user-1", "user-1"), true, "a delivery may target only its owner's active subscription");
assert.equal(isDeliverySubscriptionOwnerValid("user-1", "user-2"), false, "a mismatched subscription owner must be rejected");
assert.equal(isDeliverySubscriptionOwnerValid("", "user-1"), false, "an empty delivery owner must fail closed");

assert.equal(
  nextLocalDate(new Date("2026-11-11T12:00:00.000Z"), "Pacific/Kiritimati"),
  "2026-11-13",
  "UTC+14 local calendar advancement must not skip the next day",
);
assert.equal(
  nextLocalDate(new Date("2026-03-08T08:00:00.000Z"), "America/Los_Angeles"),
  "2026-03-09",
  "local calendar advancement must remain correct across daylight-saving transitions",
);

assert.equal(
  zonedDateTime("2026-03-08", "America/Los_Angeles", "01:30")?.toISOString(),
  "2026-03-08T09:30:00.000Z",
  "valid local times before a daylight-saving transition must resolve to the matching instant",
);
assert.equal(
  zonedDateTime("2026-03-08", "America/Los_Angeles", "02:30"),
  null,
  "a nonexistent wall-clock time during spring-forward must not be shifted to a different prayer time",
);
assert.equal(
  zonedDateTime("2026-03-08", "America/Los_Angeles", "03:30")?.toISOString(),
  "2026-03-08T10:30:00.000Z",
  "valid local times after a daylight-saving transition must resolve to the matching instant",
);


assert.equal(
  previousLocalDate(new Date("2026-11-12T12:00:00.000Z"), "Pacific/Kiritimati"),
  "2026-11-12",
  "previous local calendar advancement must respect UTC+14 without skipping a date",
);
assert.equal(
  isCurrentPrayerReminderSchedule({
    scheduledAt: "2026-11-12T02:50:00.000Z",
    prayerAt: new Date("2026-11-12T03:00:00.000Z"),
    offsetMinutes: -10,
  }),
  true,
  "a delivery matching the current prayer time and offset remains valid",
);
assert.equal(
  isCurrentPrayerReminderSchedule({
    scheduledAt: "2026-11-12T02:50:00.000Z",
    prayerAt: new Date("2026-11-12T03:00:00.000Z"),
    offsetMinutes: 0,
  }),
  false,
  "a queued delivery from a superseded prayer offset must be cancelled",
);
assert.equal(
  isCurrentPrayerReminderSchedule({
    scheduledAt: "2026-11-12T02:50:00.000Z",
    prayerAt: new Date("2026-11-12T03:00:00.000Z"),
    offsetMinutes: null,
  }),
  false,
  "a disabled or malformed prayer offset must fail closed",
);
const previousDayPrayerCache = {
  prayer_date: "2026-11-11",
  timings: { Fajr: "05:00" },
};
const currentDayPrayerCache = {
  prayer_date: "2026-11-12",
  timings: { Fajr: "05:00" },
};
const adjacentDateSchedule = {
  scheduledAt: "2026-11-12T02:50:00.000Z",
  timeZone: "Africa/Cairo",
  prayerName: "Fajr",
  offsetMinutes: -10,
};
assert.equal(
  matchesAnyCurrentPrayerReminderSchedule({
    ...adjacentDateSchedule,
    candidates: [previousDayPrayerCache, currentDayPrayerCache],
  }),
  true,
  "a stale previous-day cache returned first must not hide the matching current-day prayer schedule",
);
assert.equal(
  matchesAnyCurrentPrayerReminderSchedule({
    ...adjacentDateSchedule,
    candidates: [currentDayPrayerCache, previousDayPrayerCache],
  }),
  true,
  "prayer schedule validation must be independent of cache row order",
);
assert.equal(
  matchesAnyCurrentPrayerReminderSchedule({
    ...adjacentDateSchedule,
    candidates: [previousDayPrayerCache],
  }),
  false,
  "a neighboring date alone must not validate a stale prayer delivery",
);
assert.equal(isCurrentIntervalReminderSlot("2026-11-12T08:15:00.000Z", 15), true);
assert.equal(
  isCurrentIntervalReminderSlot("2026-11-12T08:15:00.000Z", 60),
  false,
  "a stale quarter-hour reminder must not send after the interval changes to hourly",
);
assert.equal(isCurrentIntervalReminderSlot("2026-11-12T08:00:00.000Z", 60), true);
assert.equal(isCurrentIntervalReminderSlot("2026-11-12T08:00:00.000Z", null), false);

assert.equal(
  buildNotificationTag({ notificationKind: "prayer", prayerName: "Fajr" }),
  "prayer-Fajr",
  "server prayer notifications must replace the matching local prayer notification",
);
assert.equal(buildNotificationTag({ notificationKind: "dhikr", prayerName: "" }), "dhikr-reminder");
assert.equal(buildNotificationTag({ notificationKind: "salawat", prayerName: "" }), "salawat-reminder");
assert.throws(
  () => buildNotificationTag({ notificationKind: "prayer", prayerName: "" }),
  /prayer name is required/,
);

const failedScheduleKeys = new Set<string>();
const scheduleFetchFailures: Array<{ key: string; message: string }> = [];
let scheduleFetchAttempts = 0;
const failedSchedule = await fetchScheduleOrSkip(
  "location-1|2026-11-13",
  failedScheduleKeys,
  async () => {
    scheduleFetchAttempts += 1;
    throw new Error("HTTP 503");
  },
  (key, error) => scheduleFetchFailures.push({
    key,
    message: error instanceof Error ? error.message : String(error),
  }),
);
assert.equal(failedSchedule, null);
const repeatedFailedSchedule = await fetchScheduleOrSkip(
  "location-1|2026-11-13",
  failedScheduleKeys,
  async () => {
    scheduleFetchAttempts += 1;
    return { Fajr: "05:00" };
  },
  (key, error) => scheduleFetchFailures.push({
    key,
    message: error instanceof Error ? error.message : String(error),
  }),
);
assert.equal(repeatedFailedSchedule, null, "a failed location/date must not be retried repeatedly inside the same page");
const healthySchedule = await fetchScheduleOrSkip(
  "location-2|2026-11-13",
  failedScheduleKeys,
  async () => {
    scheduleFetchAttempts += 1;
    return { Fajr: "05:00" };
  },
  (key, error) => scheduleFetchFailures.push({
    key,
    message: error instanceof Error ? error.message : String(error),
  }),
);
assert.deepEqual(healthySchedule, { Fajr: "05:00" }, "a failed location must not block a different location/date");
assert.equal(scheduleFetchAttempts, 2);
assert.deepEqual(scheduleFetchFailures, [{ key: "location-1|2026-11-13", message: "HTTP 503" }]);

const pushTopics = [
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Fajr", scheduledAt: "2026-11-11T03:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Dhuhr", scheduledAt: "2026-11-11T10:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "dhikr", prayerName: "", scheduledAt: "2026-11-11T09:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "dhikr", prayerName: "", scheduledAt: "2026-11-11T09:30:00.000Z" }),
  buildNotificationTopic({ notificationKind: "salawat", prayerName: "", scheduledAt: "2026-11-11T09:00:00.000Z" }),
];
assert.equal(new Set(pushTopics).size, pushTopics.length, "distinct prayer and interval reminders must not replace one another in the push service");
assert.ok(pushTopics.every(topic => topic.length <= 32 && /^[A-Za-z0-9_-]+$/.test(topic)), "Web Push topics must satisfy the 32-character URL-safe limit");
assert.notEqual(
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Fajr", scheduledAt: "2026-11-11T03:00:00.000Z" }),
  buildNotificationTopic({ notificationKind: "prayer", prayerName: "Fajr", scheduledAt: "2026-11-12T03:00:00.000Z" }),
  "the same prayer on different dates must have distinct topics",
);
assert.throws(
  () => buildNotificationTopic({ notificationKind: "prayer", prayerName: "", scheduledAt: "2026-11-11T03:00:00.000Z" }),
  /prayer name is required/,
);
assert.throws(
  () => buildNotificationTopic({ notificationKind: "dhikr", prayerName: "", scheduledAt: "invalid" }),
  /valid scheduledAt/,
);
assert.equal(canSchedulePrayerSubscription(true, { notifications_enabled: true }), true, "configured, opted-in prayer notifications may be scheduled");

const deliveryNow = new Date("2026-11-13T12:00:00.000Z");
assert.equal(
  isDeliveryWithinGraceWindow("2026-11-13T11:45:00.000Z", deliveryNow, 30 * 60_000),
  true,
  "a reminder inside the 30-minute delivery grace window may still be sent",
);
assert.equal(
  isDeliveryWithinGraceWindow("2026-11-13T11:29:59.000Z", deliveryNow, 30 * 60_000),
  false,
  "a reminder older than the delivery grace window must be cancelled instead of sent late",
);
assert.equal(
  isDeliveryWithinGraceWindow("2026-11-13T12:00:01.000Z", deliveryNow, 30 * 60_000),
  false,
  "a future reminder must not be treated as due",
);
assert.equal(
  isDeliveryWithinGraceWindow("invalid", deliveryNow, 30 * 60_000),
  false,
  "an invalid scheduled timestamp must fail closed",
);
assert.match(worker, /MAX_DELIVERY_DELAY_MS = 30 \* 60_000/);
assert.match(worker, /Prayer reminder expired; stale delivery cancelled/);
assert.match(worker, /Background reminder expired; stale delivery cancelled/);
assert.match(worker, /Math\.min\(MAX_DELIVERY_DELAY_MS, Number\(intervalMinutes\) \* 60_000\)/);

assert.match(worker, /.order\("id", \{ ascending: true \}\)/);
assert.match(worker, /query\.gt\("id", afterId\)/);

assert.match(worker, /ensureSubscriptionBatchSchedules\(page, now\)/);
assert.match(worker, /subscriptions: readonly PushSubscriptionRow\[\]/);
assert.match(worker, /\.in\("user_id", userIds\)/);
assert.match(worker, /\.in\("location_id", locationIds\)/);
assert.match(worker, /scheduled \+= await ensureSubscriptionBatchSchedules/);
assert.match(worker, /const timeZone = safeTimeZone\(location\.timezone\)/);
assert.doesNotMatch(worker, /location\.timezone!/);

assert.match(worker, /from\("prayer_preferences"\)/);
assert.match(worker, /from\("prayer_locations"\)/);
assert.match(worker, /from\("background_reminder_preferences"\)/);
assert.match(worker, /enabled !== true/);
assert.match(worker, /!Number\.isInteger\(preference\.prayer_reminders\?\.\[delivery\.prayer_name\]\)/);
assert.match(worker, /inQuietHours\(\s*deliveryNow,/);
assert.match(worker, /const scheduledAt = new Date\(delivery\.scheduled_at\)/);
assert.match(worker, /inQuietHours\(\s*scheduledAt,/);
assert.match(worker, /status: "cancelled"/);
assert.match(worker, /Background reminder is no longer enabled/);
assert.match(worker, /Prayer reminder is no longer enabled or configured/);


assert.match(worker, /inserts\.slice\(offset, offset \+ BATCH_SIZE\)/);


const reminderMigration = readFileSync(
  "supabase/migrations/20261111010000_background_reminders_respect_quiet_hours_timezone.sql",
  "utf8",
);
const reminderService = readFileSync(
  "src/features/reminders/services/reminder-preferences.ts",
  "utf8",
);
const disabledIntervalMigration = readFileSync(
  "supabase/migrations/20261113000000_background_reminder_intervals_allow_disabled.sql",
  "utf8",
);
assert.ok(
  reminderService.includes("const ALLOWED_INTERVALS = new Set([0, 15, 30, 60, 120]);"),
  "the server must accept interval 0 because the settings UI exposes it as disabled",
);
assert.ok(
  disabledIntervalMigration.includes("check (dhikr_interval_minutes in (0, 15, 30, 60, 120))") &&
    disabledIntervalMigration.includes("check (salawat_interval_minutes in (0, 15, 30, 60, 120))"),
  "the database must accept the same disabled interval value as the client and server",
);
assert.ok(
  reminderMigration.includes("and reminder.interval_minutes > 0"),
  "zero intervals must remain excluded from background delivery planning",
);

const timezoneUtility = readFileSync("src/lib/timezone.ts", "utf8");
const dhikrHook = readFileSync("src/features/reminders/hooks/use-dhikr-reminder.ts", "utf8");
const salawatHook = readFileSync("src/features/reminders/hooks/use-salawat-reminder.ts", "utf8");
const profileSettings = readFileSync("src/features/profile/components/profile-local-settings.tsx", "utf8");
const supabaseTypes = readFileSync("src/lib/types/supabase.ts", "utf8");

assert.match(reminderMigration, /add column if not exists timezone text not null default 'UTC'/);
assert.match(
  reminderMigration,
  /date_trunc\('day',\s*now_at\s+at\s+time\s+zone\s+'UTC'\)\s+at\s+time\s+zone\s+'UTC'/i,
  "background reminder slots must use a stable UTC day boundary regardless of session timezone",
);
assert.match(
  reminderMigration,
  /make_interval\(\s*mins\s*=>\s*\([\s\S]*floor\([\s\S]*now_at\s*-\s*day_start\.utc_day_start[\s\S]*\)\s*::integer\s*\+\s*1/i,
  "the next interval must be calculated from elapsed minutes since midnight, not added to the current minute",
);
assert.doesNotMatch(
  reminderMigration,
  /date_trunc\('minute',\s*now_at\)\s*\+/i,
  "the interval calculation must not double-count elapsed minutes by adding an elapsed-day offset to now_at",
);
assert.match(
  reminderMigration,
  /on conflict \(push_subscription_id, notification_kind, scheduled_at\) do nothing/i,
  "delivery planning must target the existing notification-kind idempotency index",
);
const nextUtcInterval = (now: Date, intervalMinutes: number) => {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const elapsedMinutes = (now.getTime() - dayStart) / 60_000;
  return new Date(
    dayStart + (Math.floor(elapsedMinutes / intervalMinutes) + 1) * intervalMinutes * 60_000,
  ).toISOString();
};
assert.equal(
  nextUtcInterval(new Date("2026-11-11T07:37:35.000Z"), 15),
  "2026-11-11T07:45:00.000Z",
  "a 15-minute reminder at 09:37 Cairo time must be scheduled for the next 15-minute boundary",
);
assert.equal(
  nextUtcInterval(new Date("2026-11-11T07:37:35.000Z"), 60),
  "2026-11-11T08:00:00.000Z",
  "a 60-minute reminder must be scheduled for the next hour boundary",
);
assert.match(reminderMigration, /left join pg_catalog\.pg_timezone_names/);
assert.match(reminderMigration, /local_clock\.local_time < preferences\.quiet_hours_start/);
assert.match(reminderMigration, /local_clock\.local_time >= preferences\.quiet_hours_end/);
assert.match(reminderMigration, /preferences\.quiet_hours_start = preferences\.quiet_hours_end/);
assert.match(
  reminderMigration,
  /else\s+local_clock\.local_time\s*<\s*preferences\.quiet_hours_start\s+and\s+local_clock\.local_time\s*>=\s*preferences\.quiet_hours_end/i,
  "overnight quiet hours must schedule only outside the quiet window",
);
assert.doesNotMatch(
  reminderMigration,
  /else\s+local_clock\.local_time\s*>=\s*preferences\.quiet_hours_start\s+or\s+local_clock\.local_time\s*<\s*preferences\.quiet_hours_end/i,
  "overnight quiet hours must not schedule during the quiet window",
);
const isOutsideQuietHours = (minute: number, start: number, end: number) =>
  start === end
    ? true
    : start < end
      ? minute < start || minute >= end
      : minute < start && minute >= end;
assert.equal(isOutsideQuietHours(23 * 60, 22 * 60, 7 * 60), false, "23:00 is inside overnight quiet hours");
assert.equal(isOutsideQuietHours(6 * 60 + 30, 22 * 60, 7 * 60), false, "06:30 is inside overnight quiet hours");
assert.equal(isOutsideQuietHours(7 * 60 + 30, 22 * 60, 7 * 60), true, "07:30 is outside overnight quiet hours");
assert.equal(isOutsideQuietHours(21 * 60 + 30, 22 * 60, 7 * 60), true, "21:30 is outside overnight quiet hours");
assert.match(reminderMigration, /grant execute on function public\.plan_background_reminder_deliveries\(timestamptz\)\s+to service_role/i);
assert.doesNotMatch(reminderMigration, /grant execute on function public\.plan_background_reminder_deliveries\(timestamptz\)\s+to (?:public|anon|authenticated)/i);
assert.match(reminderService, /normalizeIanaTimeZone\(body\.timezone\)/);
assert.match(
  reminderService,
  /\.upsert\(payload,[\s\S]*?\.select\(\s*"user_id,dhikr_enabled,dhikr_interval_minutes,salawat_enabled,salawat_interval_minutes,quran_enabled,quran_time,quran_message,quiet_hours_start,quiet_hours_end,timezone,updated_at"/,
  "reminder updates must return the complete preference contract, including Quran settings",
);
assert.match(timezoneUtility, /Intl\.DateTimeFormat\("en-US",\s*\{\s*timeZone:/);
assert.match(reminderService, /updates\.timezone = timezone/);
assert.match(reminderService, /quiet_hours_end,timezone,updated_at/);
assert.match(dhikrHook, /timezone: Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone \|\| "UTC"/);
assert.match(salawatHook, /timezone: Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone \|\| "UTC"/);
assert.match(profileSettings, /timezone: Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone \|\| "UTC"/,
  "Quran-only preference creation must also persist the browser timezone so future background reminders do not inherit UTC by default");
const reminderTypesStart = supabaseTypes.indexOf("background_reminder_preferences: {");
const reminderTypesEnd = supabaseTypes.indexOf("battle_events:", reminderTypesStart);
assert.ok(reminderTypesStart >= 0 && reminderTypesEnd > reminderTypesStart);
assert.match(supabaseTypes.slice(reminderTypesStart, reminderTypesEnd), /timezone: string/);
assert.match(supabaseTypes.slice(reminderTypesStart, reminderTypesEnd), /timezone\?: string/);

assert.match(reminderMigration, /security invoker\s+set search_path = ''/i, "the scheduler RPC must run with service-role invoker privileges and an empty search path");
assert.doesNotMatch(reminderMigration, /security definer/i, "the service-only reminder scheduler must not use definer privileges");


const dueCandidateStart = worker.indexOf("async function getDueDeliveryCandidates");
const dueClaimStart = worker.indexOf("async function claimDueDelivery", dueCandidateStart);
const leaseUpdateStart = worker.indexOf("async function updateDeliveryIfLease", dueClaimStart);
const deliverDueStart = worker.indexOf("async function deliverDue", leaseUpdateStart);
const dueCandidateSource = worker.slice(dueCandidateStart, dueClaimStart);
const dueClaimSource = worker.slice(dueClaimStart, leaseUpdateStart);
const leaseUpdateSource = worker.slice(leaseUpdateStart, deliverDueStart);
const deliverDueSource = worker.slice(deliverDueStart, worker.indexOf("function constantTimeEqual", deliverDueStart));
assert.ok(dueCandidateStart >= 0 && dueClaimStart > dueCandidateStart && leaseUpdateStart > dueClaimStart && deliverDueStart > leaseUpdateStart);
assert.match(dueCandidateSource, /retry_after, updated_at, attempt_count/);
assert.match(dueCandidateSource, /\.in\("status", \["pending", "failed"\]\)/);
assert.match(dueClaimSource, /\.lte\("scheduled_at", claimAt\)/,
  "the per-delivery claim must recheck that the delivery is due after the candidate read");
assert.match(dueClaimSource, /retry_after\.lte\.\$\{claimAt\}/,
  "the per-delivery claim must recheck retry_after so a concurrent backoff cannot be bypassed");
assert.match(dueClaimSource, /\.eq\("updated_at", candidate\.updated_at\)/,
  "the per-delivery claim must compare the exact candidate row version to avoid stale-snapshot claims");
assert.match(dueClaimSource, /processing_at: claimAt/);
assert.match(dueClaimSource, /processing_at, updated_at/);
assert.doesNotMatch(dueClaimSource, /processed_at:/,
  "processed_at must not be set before a push attempt has completed");
assert.match(leaseUpdateSource, /\.eq\("status", "processing"\)/);
assert.match(leaseUpdateSource, /\.eq\("processing_at", delivery\.processing_at\)/);
assert.match(leaseUpdateSource, /\.eq\("updated_at", delivery\.updated_at\)/,
  "delivery finalization must compare the exact processing lease version");
assert.match(deliverDueSource, /for \(const candidate of candidates\)[\s\S]*?claimDueDelivery\(candidate, deliveryNow\)/,
  "each delivery must be claimed immediately before it is processed, not held in a large sequential processing batch");
assert.match(deliverDueSource, /updateDeliveryIfLease\(delivery,/,
  "all delivery outcomes must finalize through the exact lease compare-and-set");

assert.match(staleRecovery, /processed_at: now\.toISOString\(\)/,
  "a recovered stale attempt must record its completion timestamp");

assert.equal(getDeliveryLeaseHeartbeatIntervalMs(10 * 60_000), 60_000);

let deliveryRenewals = 0;
const activeDeliveryHeartbeat = startDeliveryLeaseHeartbeat({
  intervalMs: 5,
  renew: async () => {
    deliveryRenewals += 1;
    return true;
  },
});
await new Promise(resolve => setTimeout(resolve, 25));
await activeDeliveryHeartbeat.stop();
assert.ok(deliveryRenewals >= 1, "an in-flight push delivery must renew its processing lease");

const lostDeliveryHeartbeat = startDeliveryLeaseHeartbeat({
  intervalMs: 5,
  renew: async () => false,
});
await new Promise(resolve => setTimeout(resolve, 25));
assert.equal(lostDeliveryHeartbeat.leaseLost, true, "a failed compare-and-set must stop a worker that no longer owns the delivery");
await lostDeliveryHeartbeat.stop();

let deliveryRenewalErrors = 0;
let failedRenewalAttempts = 0;
const failedRenewalHeartbeat = startDeliveryLeaseHeartbeat({
  intervalMs: 5,
  renew: async () => {
    failedRenewalAttempts += 1;
    throw new Error("temporary database outage");
  },
  onRenewalError: () => {
    deliveryRenewalErrors += 1;
  },
});
await new Promise(resolve => setTimeout(resolve, 25));
assert.equal(
  failedRenewalHeartbeat.leaseLost,
  true,
  "a heartbeat transport error must fail closed because lease ownership is uncertain",
);
assert.equal(deliveryRenewalErrors, 1, "a failed renewal must report its error once and stop retrying");
assert.equal(failedRenewalAttempts, 1, "a worker must not keep processing after an unconfirmed lease renewal");
await failedRenewalHeartbeat.stop();

const deliveryLeaseUpdateSource = worker.slice(leaseUpdateStart, deliverDueStart);
assert.match(deliveryLeaseUpdateSource, /select\("id, processing_at, updated_at"\)/);
assert.match(deliveryLeaseUpdateSource, /delivery\.processing_at = data\.processing_at/);
assert.match(deliveryLeaseUpdateSource, /delivery\.updated_at = data\.updated_at/);
assert.match(deliverDueSource, /createAsyncSerialQueue\(\)/);
assert.match(deliverDueSource, /renew: \(\) => updateLease\(\{ processing_at: new Date\(\)\.toISOString\(\) \}\)/);
assert.match(deliverDueSource, /finally \{\s*await heartbeat\.stop\(\);\s*\}/);

assert.match(
  deliverDueSource,
  /leaseLost\) \{[\s\S]{0,220}before the push provider call[\s\S]{0,180}await applicationServer/,
  "a worker that has lost its lease must not begin a new provider send",
);


const changedTimeZoneRequests: Array<{ method: string; body?: string }> = [];
const changedTimeZoneFetcher: typeof fetch = async (_input, init) => {
  changedTimeZoneRequests.push({
    method: (init?.method ?? "GET").toUpperCase(),
    body: typeof init?.body === "string" ? init.body : undefined,
  });
  return new Response(null, { status: 204 });
};
assert.equal(
  await syncBackgroundReminderTimeZone({
    userId: "timezone-change-user",
    serverTimeZone: "UTC",
    deviceTimeZone: "Africa/Cairo",
    fetcher: changedTimeZoneFetcher,
  }),
  true,
);
assert.deepEqual(
  changedTimeZoneRequests,
  [{ method: "PUT", body: JSON.stringify({ timezone: "Africa/Cairo" }) }],
  "a device timezone change must update only the background reminder timezone",
);

let unchangedTimeZoneCalls = 0;
assert.equal(
  await syncBackgroundReminderTimeZone({
    userId: "timezone-unchanged-user",
    serverTimeZone: "Africa/Cairo",
    deviceTimeZone: "Africa/Cairo",
    fetcher: async () => {
      unchangedTimeZoneCalls += 1;
      return new Response(null, { status: 204 });
    },
  }),
  true,
);
assert.equal(unchangedTimeZoneCalls, 0, "matching timezones must not write to the database");

const resumedTimeZoneMethods: string[] = [];
assert.equal(
  await syncBackgroundReminderTimeZone({
    userId: "timezone-resume-user",
    deviceTimeZone: "Africa/Cairo",
    fetcher: async (_input, init) => {
      const method = (init?.method ?? "GET").toUpperCase();
      resumedTimeZoneMethods.push(method);
      return method === "GET"
        ? new Response(JSON.stringify({ timezone: "UTC" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        : new Response(null, { status: 204 });
    },
  }),
  true,
);
assert.deepEqual(resumedTimeZoneMethods, ["GET", "PUT"], "app resume must read the current server timezone before updating it");

let invalidTimeZoneCalls = 0;
assert.equal(
  await syncBackgroundReminderTimeZone({
    userId: "timezone-invalid-user",
    serverTimeZone: "UTC",
    deviceTimeZone: "Not/A-Real-Timezone",
    fetcher: async () => {
      invalidTimeZoneCalls += 1;
      return new Response(null, { status: 204 });
    },
  }),
  false,
);
assert.equal(invalidTimeZoneCalls, 0, "invalid device timezone values must never be persisted");

let releaseTimeZonePut!: () => void;
const timeZonePutGate = new Promise<void>(resolve => {
  releaseTimeZonePut = resolve;
});
let concurrentTimeZonePutCount = 0;
const concurrentTimeZoneFetcher: typeof fetch = async (_input, init) => {
  if ((init?.method ?? "GET").toUpperCase() === "PUT") concurrentTimeZonePutCount += 1;
  await timeZonePutGate;
  return new Response(null, { status: 204 });
};
const concurrentTimeZoneOptions = {
  userId: "timezone-concurrent-user",
  serverTimeZone: "UTC",
  deviceTimeZone: "Africa/Cairo",
  fetcher: concurrentTimeZoneFetcher,
};
const firstTimeZoneSync = syncBackgroundReminderTimeZone(concurrentTimeZoneOptions);
const secondTimeZoneSync = syncBackgroundReminderTimeZone(concurrentTimeZoneOptions);
await Promise.resolve();
releaseTimeZonePut();
assert.deepEqual(await Promise.all([firstTimeZoneSync, secondTimeZoneSync]), [true, true]);
assert.equal(concurrentTimeZonePutCount, 1, "concurrent resume events must share one timezone update");

let releaseOldTimeZonePut!: () => void;
let firstOldTimeZonePutStarted!: () => void;
const oldTimeZonePutGate = new Promise<void>(resolve => {
  releaseOldTimeZonePut = resolve;
});
const oldTimeZonePutStarted = new Promise<void>(resolve => {
  firstOldTimeZonePutStarted = resolve;
});
let simulatedServerTimeZone = "Africa/Cairo";
const serializedTimeZoneWrites: string[] = [];
const changingTimeZoneFetcher: typeof fetch = async (_input, init) => {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method === "GET") {
    return new Response(JSON.stringify({ timezone: simulatedServerTimeZone }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  const body = JSON.parse(String(init?.body)) as { timezone: string };
  serializedTimeZoneWrites.push(body.timezone);
  if (serializedTimeZoneWrites.length === 1) {
    firstOldTimeZonePutStarted();
    await oldTimeZonePutGate;
  }
  simulatedServerTimeZone = body.timezone;
  return new Response(null, { status: 204 });
};
const oldDeviceTimeZoneSync = syncBackgroundReminderTimeZone({
  userId: "timezone-changing-user",
  serverTimeZone: "Africa/Cairo",
  deviceTimeZone: "UTC",
  fetcher: changingTimeZoneFetcher,
});
await oldTimeZonePutStarted;
const latestDeviceTimeZoneSync = syncBackgroundReminderTimeZone({
  userId: "timezone-changing-user",
  deviceTimeZone: "Africa/Cairo",
  fetcher: changingTimeZoneFetcher,
});
releaseOldTimeZonePut();
assert.deepEqual(await Promise.all([oldDeviceTimeZoneSync, latestDeviceTimeZoneSync]), [true, true]);
assert.deepEqual(
  serializedTimeZoneWrites,
  ["UTC", "Africa/Cairo"],
  "a newer device timezone must be applied after an older in-flight sync instead of being overwritten by it",
);
assert.equal(simulatedServerTimeZone, "Africa/Cairo");

const salawatHookSource = readFileSync("src/features/reminders/hooks/use-salawat-reminder.ts", "utf8");
const prayerAlertProviderSource = readFileSync("src/components/layout/prayer-alert-provider.tsx", "utf8");
assert.match(salawatHookSource, /serverTimeZone: data\.timezone/);
assert.match(salawatHookSource, /event === "SIGNED_IN"[\s\S]*?syncBackgroundReminderTimeZone/);
assert.match(salawatHookSource, /window\.addEventListener\("zikr:native-app-state", syncTimeZone\)/);
assert.match(salawatHookSource, /document\.addEventListener\("visibilitychange", syncTimeZone\)/);
assert.match(prayerAlertProviderSource, /useSalawatReminder\(\)/, "the global prayer provider must keep the timezone sync mounted");

console.log("Prayer notification subscription pagination and delivery lease contracts passed.");
