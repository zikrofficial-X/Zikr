import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createAsyncSerialQueue } from "../../src/lib/async-serial-queue";
import { normalizeSalawatSettings } from "../../src/features/reminders/services/reminder-settings";
import { normalizeAzanSettings } from "../../src/features/prayer/services/prayer-alert-settings";

async function main() {
  const prayerHook = readFileSync("src/features/prayer/hooks/use-prayer-alert.ts", "utf8");
  const salawatHook = readFileSync("src/features/reminders/hooks/use-salawat-reminder.ts", "utf8");
  const dhikrHook = readFileSync("src/features/reminders/hooks/use-dhikr-reminder.ts", "utf8");
  const notificationService = readFileSync("src/features/notifications/services/notifications.ts", "utf8");
  const serviceWorker = readFileSync("public/sw.js", "utf8");
  const pushWorker = readFileSync("supabase/functions/prayer-notification-worker/index.ts", "utf8");
  const deferredRuntime = readFileSync("src/components/layout/deferred-runtime.tsx", "utf8");

  assert.deepEqual(
    normalizeSalawatSettings({
      enabled: true,
      intervalMinutes: "invalid",
      quietHours: { enabled: true, from: "99:99", to: "06:00" },
    }),
    {
      enabled: true,
      intervalMinutes: 60,
      quietHours: { enabled: true, from: "22:00", to: "06:00" },
    },
    "malformed persisted Salawat settings must never create a zero-delay reminder loop",
  );
  assert.deepEqual(
    normalizeSalawatSettings({
      enabled: "true",
      intervalMinutes: 0,
      quietHours: { enabled: "yes", from: "23:00", to: "07:00" },
    }),
    {
      enabled: false,
      intervalMinutes: 0,
      quietHours: { enabled: false, from: "23:00", to: "07:00" },
    },
    "Salawat settings must validate booleans while preserving valid disabled intervals and clock values",
  );
  assert.deepEqual(
    normalizeAzanSettings({ enabledPrayers: null, audioUnlocked: "yes" }),
    {
      enabledPrayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
      audioUnlocked: false,
    },
    "malformed prayer settings must not crash the prayer loop",
  );
  assert.deepEqual(
    normalizeAzanSettings({ enabledPrayers: { Fajr: false, Isha: "invalid" }, audioUnlocked: true }),
    {
      enabledPrayers: { Fajr: false, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
      audioUnlocked: true,
    },
    "partial prayer settings must preserve explicit choices and fill missing keys safely",
  );

  assert.match(prayerHook, /createAsyncSerialQueue/, "prayer schedule refreshes must be serialized");
  assert.match(prayerHook, /enqueueNativePrayerSchedule/, "prayer alarm cancellation and replacement must share one queue");
  assert.match(salawatHook, /createAsyncSerialQueue/, "salawat schedule refreshes must be serialized");
  assert.ok(
    salawatHook.includes('import type { AuthChangeEvent, Session } from "@supabase/supabase-js";'),
    "the Supabase auth listener must import the concrete callback types under strict TypeScript",
  );
  assert.ok(
    salawatHook.includes("onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {"),
    "the Salawat auth-state callback must explicitly type both parameters",
  );

  assert.match(salawatHook, /enqueueNativeSalawatSchedule/, "salawat alarm cancellation and replacement must share one queue");

  assert.match(dhikrHook, /const SETTINGS_KEY = "zikr_dhikr_settings"/, "Dhikr preferences need a stable local storage key");
  assert.match(dhikrHook, /localStorage\.getItem\(SETTINGS_KEY\)/, "anonymous users must be able to restore local Dhikr preferences");
  assert.match(dhikrHook, /localStorage\.setItem\(SETTINGS_KEY/, "Dhikr changes must persist for anonymous users");
  assert.match(salawatHook, /function saveSettings[\s\S]*?try\s*\{[\s\S]*?localStorage\.setItem/, "Salawat storage failures must not crash reminder settings updates");
  assert.match(prayerHook, /function saveSettings[\s\S]*?try\s*\{[\s\S]*?localStorage\.setItem/, "prayer storage failures must not crash prayer settings updates");
  assert.match(prayerHook, /try\s*\{\s*return sessionStorage\.getItem/, "blocked session storage must not interrupt prayer notification checks");
  assert.match(prayerHook, /try\s*\{\s*sessionStorage\.setItem/, "blocked session storage must not interrupt prayer notification deduplication");
  assert.match(dhikrHook, /setSettings\(loadSettings\(\)\)/, "local settings must load before authenticated server reconciliation");
  assert.match(dhikrHook, /saveSettings\(next\)/, "server preference reconciliation must refresh the local copy");
  assert.match(notificationService, /const tag = "dhikr-reminder"/, "foreground Dhikr notifications must use the shared deduplication tag");
  assert.match(notificationService, /const tag = "salawat-reminder"/, "foreground Salawat notifications must use the shared deduplication tag");
  assert.match(serviceWorker, /tag: isSalawat \? "salawat-reminder" : "dhikr-reminder"/, "service-worker local reminders must use the same stable tags as foreground notifications");
  assert.match(
    pushWorker,
    /const notificationTag = buildNotificationTag\(\{[\s\S]*?notificationKind:\s*delivery\.notification_kind,[\s\S]*?prayerName:\s*delivery\.prayer_name,[\s\S]*?\}\);/,
    "background push reminders must use the shared prayer-specific or interval-reminder tag builder",
  );
  assert.match(pushWorker, /tag:\s*notificationTag/, "background push delivery must use the deduplication tag instead of a per-slot notification tag");
  assert.match(deferredRuntime, /import\s+\{\s*Capacitor\s*\}\s+from\s+["']@capacitor\/core["']/, "native reminder initialization must use the imported Capacitor runtime, not a late window global");
  assert.match(deferredRuntime, /if\s*\(Capacitor\.isNativePlatform\(\)\)[\s\S]*?setReady\(true\)/, "native reminder runtime must initialize immediately on native platforms");

  const enqueue = createAsyncSerialQueue();
  const events: string[] = [];
  let releaseFirst: (() => void) | undefined;
  const first = enqueue(async () => {
    events.push("first:start");
    await new Promise<void>(resolve => {
      releaseFirst = resolve;
    });
    events.push("first:end");
  });
  const second = enqueue(async () => {
    events.push("second:start");
  });

  await Promise.resolve();
  assert.deepEqual(events, ["first:start"], "the second native schedule must wait for the first cancellation/schedule operation");
  if (!releaseFirst) throw new Error("the first queued task did not start");
  releaseFirst();
  await Promise.all([first, second]);
  assert.deepEqual(events, ["first:start", "first:end", "second:start"], "queued schedule operations must run sequentially");

  await assert.rejects(
    enqueue(async () => {
      throw new Error("expected queue failure");
    }),
    /expected queue failure/,
  );
  await enqueue(async () => {
    events.push("after-failure");
  });
  assert.equal(events[events.length - 1], "after-failure", "a failed task must not poison later schedule refreshes");

  console.log("Native reminder schedule serialization and Dhikr preference persistence contracts passed.");
}

void main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
