import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_AUDIO_SETTINGS, getAudioChoice, getNativeAudio, normalizeAudioSettings, registerAudioChoices } from "../../src/lib/audio/config";
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
assert.ok(androidChannels.some(channel => channel.id.startsWith("zikr-audio-prayer-")));
assert.ok(androidChannels.some(channel => channel.id.startsWith("zikr-audio-dhikr-")));
assert.ok(androidChannels.some(channel => channel.id.startsWith("zikr-audio-salawat-")));

const invalidSlotSettings = normalizeAudioSettings({
  prayer: "salawat-wav",
  dhikr: "adhan-01",
  salawat: "adhan-02",
});
assert.deepEqual(
  invalidSlotSettings,
  DEFAULT_AUDIO_SETTINGS,
  "audio settings must not accept a known choice from a different notification slot",
);
assert.equal(
  normalizeAudioSettings({ prayer: "site:id:offline-library-choice" }).prayer,
  "site:id:offline-library-choice",
  "unknown remote library IDs must survive offline normalization until the catalog is reachable",
);
assert.equal(
  getAudioChoice("salawat-wav", "prayer").key,
  "adhan-01",
  "slot-aware lookup must fall back to the correct bundled audio instead of playing another slot's sound",
);

const staleRemoteChoice = {
  key: "site:id:stale-audio-choice",
  label: "Stale recording",
  webUrl: "https://media.example.invalid/stale.mp3",
  nativeFile: null,
  slot: "dhikr" as const,
};
const currentRemoteChoice = {
  key: "site:id:current-audio-choice",
  label: "Current recording",
  webUrl: "https://media.example.invalid/current.mp3",
  nativeFile: null,
  slot: "dhikr" as const,
};
registerAudioChoices([staleRemoteChoice, currentRemoteChoice]);
assert.equal(getAudioChoice(staleRemoteChoice.key, "dhikr").webUrl, staleRemoteChoice.webUrl);
registerAudioChoices([currentRemoteChoice]);
assert.equal(
  getAudioChoice(staleRemoteChoice.key, "dhikr").webUrl,
  getAudioChoice("unknown-remote-choice", "dhikr").webUrl,
  "a successful catalog refresh must remove unpublished remote choices so stale URLs fall back safely",
);
assert.equal(
  getAudioChoice(currentRemoteChoice.key, "dhikr").webUrl,
  currentRemoteChoice.webUrl,
  "the current remote catalog snapshot must remain available after stale entries are removed",
);
registerAudioChoices([]);

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

const audioConfigSource = readFileSync(resolve(process.cwd(), "src/lib/audio/config.ts"), "utf8");
const audioLibrarySource = readFileSync(resolve(process.cwd(), "src/components/audio/audio-library.tsx"), "utf8");
assert.ok(audioConfigSource.includes("if (audioResponse.ok) registerAudioChoices(remote)"),
  "a failed site-audio response must not clear the last known-good remote audio snapshot");
assert.ok(audioLibrarySource.includes("if (!response.ok) throw new Error") &&
  audioLibrarySource.indexOf("if (!response.ok) throw new Error") < audioLibrarySource.indexOf("registerAudioChoices(choices)"),
  "the audio library must replace its snapshot only after a successful catalog response");

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
const facadeMethodStart = bridgeSource.indexOf("    async scheduleLocalNotification(notification)");
const facadeMethodEnd = bridgeSource.indexOf(
  "    async requestNotificationPermission()",
  facadeMethodStart,
);
const bridgeEffectStart = bridgeSource.indexOf("export function NativeCapacitorBridge()");
const facadeMethod = bridgeSource.slice(facadeMethodStart, facadeMethodEnd);
const bridgeEffect = bridgeSource.slice(bridgeEffectStart);

assert.ok(facadeMethodStart >= 0 && facadeMethodEnd > facadeMethodStart);
assert.doesNotMatch(
  facadeMethod,
  /let disposed|audioSettingsRefreshQueue|handleAudioSettingsChanged/,
  "audio refresh lifecycle must not be scoped to a one-shot notification method",
);
assert.match(
  bridgeEffect,
  /const localNotifications = plugins\.LocalNotifications;\s*let disposed = false;/,
  "the effect must own the disposal flag and notification plugin",
);
assert.match(
  bridgeEffect,
  /const handleAudioSettingsChanged = \(\) => \{\s*void refreshNativeAudioSettings\(\);\s*\};/,
);
assert.match(
  bridgeEffect,
  /window\.addEventListener\(\s*"zikr:audio-settings-changed",\s*handleAudioSettingsChanged,\s*\)/,
);
assert.match(
  bridgeEffect,
  /window\.removeEventListener\(\s*"zikr:audio-settings-changed",\s*handleAudioSettingsChanged,\s*\)/,
);
assert.match(bridgeEffect, /return \(\) => \{\s*disposed = true;/);
assert.match(bridgeSource, /zikr:native-audio-channels-ready/);
assert.match(prayerSource, /zikr:native-audio-channels-ready/);
assert.match(salawatSource, /zikr:native-audio-channels-ready/);

console.log("Native notification audio asset and channel-refresh contract passed.");
