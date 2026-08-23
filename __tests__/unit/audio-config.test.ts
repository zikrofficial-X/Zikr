import assert from "node:assert/strict";
import test from "node:test";
import {
  AUDIO_CHOICES,
  DEFAULT_AUDIO_SETTINGS,
  getAudioChoice,
  getNativeAudio,
  normalizeAudioSettings,
} from "../../lib/audio/config";

test("audio configuration exposes five distinct adhan choices", () => {
  const adhanChoices = AUDIO_CHOICES.filter(choice =>
    /^adhan-0[1-5]$/.test(choice.key)
  );
  assert.equal(adhanChoices.length, 5);
  assert.deepEqual(
    adhanChoices.slice(0, 5).map(choice => choice.key),
    ["adhan-01", "adhan-02", "adhan-03", "adhan-04", "adhan-05"]
  );
  for (const choice of adhanChoices.slice(0, 5)) {
    assert.match(choice.webUrl, /^\/audio\/adhan-0[1-5]-.*\.wav$/);
    assert.match(choice.nativeFile, /^adhan_0[1-5]_.*\.wav$/);
  }
});

test("the prayer default uses the first adhan and selected settings stay valid", () => {
  assert.equal(DEFAULT_AUDIO_SETTINGS.prayer, "adhan-01");
  assert.equal(getAudioChoice("adhan-03").nativeFile, "adhan_03_enceladus.wav");
  assert.deepEqual(
    normalizeAudioSettings({ prayer: "adhan-05" }).prayer,
    "adhan-05"
  );
  assert.deepEqual(getNativeAudio("prayer"), {
    sound: "adhan_01_charon.wav",
    channelId: "zikr-audio-adhan-01-v1",
  });
});
