import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getNativeAudio } from "../../src/lib/audio/config";
import { ensureNativeNotificationChannels } from "../../src/features/notifications/services/native-notification-channels";

const iosPrayer = getNativeAudio("prayer", "ios");
const iosDhikr = getNativeAudio("dhikr", "ios");
const iosSalawat = getNativeAudio("salawat", "ios");

assert.equal(iosPrayer.sound, "adhan.wav");
assert.equal(iosDhikr.sound, "adhan.wav");
assert.equal(iosSalawat.sound, "salawat.wav");
assert.ok(!iosPrayer.sound.endsWith(".mp3"));
assert.ok(!iosSalawat.sound.endsWith(".mp3"));

for (const sound of [iosPrayer.sound, iosDhikr.sound, iosSalawat.sound]) {
  assert.ok(
    existsSync(resolve(process.cwd(), "ios/App/App/Resources", sound)),
    `iOS notification sound must exist in the native app bundle: ${sound}`,
  );
}

const androidPrayer = getNativeAudio("prayer", "android");
const androidDhikr = getNativeAudio("dhikr", "android");
const androidSalawat = getNativeAudio("salawat", "android");
for (const sound of [androidPrayer.sound, androidDhikr.sound, androidSalawat.sound]) {
  assert.ok(
    existsSync(resolve(process.cwd(), "android/app/src/main/res/raw", sound)),
    `Android notification sound must exist in res/raw: ${sound}`,
  );
}

const xcodeProject = readFileSync(
  resolve(process.cwd(), "ios/App/App.xcodeproj/project.pbxproj"),
  "utf8",
);
assert.match(xcodeProject, /adhan\.wav/);
assert.match(xcodeProject, /salawat\.wav/);

const androidChannels: Array<{
  id: string;
  name: string;
  description: string;
  importance: number;
  sound: string;
  vibration: boolean;
  visibility: number;
}> = [];
await ensureNativeNotificationChannels(
  { createChannel: async options => { androidChannels.push(options); } },
  "android",
);
assert.equal(androidChannels.length, 3);
assert.deepEqual(
  new Set(androidChannels.map(channel => channel.id)),
  new Set([
    getNativeAudio("prayer", "android").channelId,
    getNativeAudio("dhikr", "android").channelId,
    getNativeAudio("salawat", "android").channelId,
  ]),
);
assert.ok(androidChannels.some(channel =>
  channel.id === getNativeAudio("dhikr", "android").channelId,
));

let iosChannelCount = 0;
await ensureNativeNotificationChannels(
  { createChannel: async () => { iosChannelCount += 1; } },
  "ios",
);
assert.equal(iosChannelCount, 0);

const bridgeSource = readFileSync(
  resolve(process.cwd(), "src/components/layout/native-capacitor-bridge.tsx"),
  "utf8",
);
const prayerSource = readFileSync(
  resolve(process.cwd(), "src/features/prayer/hooks/use-prayer-alert.ts"),
  "utf8",
);
const salawatSource = readFileSync(
  resolve(process.cwd(), "src/features/reminders/hooks/use-salawat-reminder.ts"),
  "utf8",
);
assert.match(bridgeSource, /zikr:audio-settings-changed/);
assert.match(bridgeSource, /zikr:native-audio-channels-ready/);
assert.match(prayerSource, /zikr:native-audio-channels-ready/);
assert.match(salawatSource, /zikr:native-audio-channels-ready/);

console.log("Native notification audio asset and channel-refresh contract passed.");
