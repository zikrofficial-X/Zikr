import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getNativeAudio } from "../../src/lib/audio/config";

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

console.log("Native notification audio asset contract passed.");
