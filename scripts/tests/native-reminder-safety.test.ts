import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createAsyncSerialQueue } from "../../src/lib/async-serial-queue";

async function main() {
  const prayerHook = readFileSync("src/features/prayer/hooks/use-prayer-alert.ts", "utf8");
  const salawatHook = readFileSync("src/features/reminders/hooks/use-salawat-reminder.ts", "utf8");
  const dhikrHook = readFileSync("src/features/reminders/hooks/use-dhikr-reminder.ts", "utf8");

  assert.match(prayerHook, /createAsyncSerialQueue/, "prayer schedule refreshes must be serialized");
  assert.match(prayerHook, /enqueueNativePrayerSchedule/, "prayer alarm cancellation and replacement must share one queue");
  assert.match(salawatHook, /createAsyncSerialQueue/, "salawat schedule refreshes must be serialized");
  assert.match(salawatHook, /enqueueNativeSalawatSchedule/, "salawat alarm cancellation and replacement must share one queue");

  assert.match(dhikrHook, /const SETTINGS_KEY = "zikr_dhikr_settings"/, "Dhikr preferences need a stable local storage key");
  assert.match(dhikrHook, /localStorage\.getItem\(SETTINGS_KEY\)/, "anonymous users must be able to restore local Dhikr preferences");
  assert.match(dhikrHook, /localStorage\.setItem\(SETTINGS_KEY/, "Dhikr changes must persist for anonymous users");
  assert.match(dhikrHook, /setSettings\(loadSettings\(\)\)/, "local settings must load before authenticated server reconciliation");
  assert.match(dhikrHook, /saveSettings\(next\)/, "server preference reconciliation must refresh the local copy");

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
