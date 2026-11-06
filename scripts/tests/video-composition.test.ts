import assert from "node:assert/strict";
import {
  paginateCaptionText,
  planCaptionTimings,
  resolveVideoComposition,
} from "../../src/features/videos/services/video-composition";

const dimensions = { width: 1080, height: 1920 };
const categories = ["quran", "hadith", "dua", "adhkar", "story", "other"];
const profiles = categories.map((category) =>
  resolveVideoComposition({ category, seed: "same-seed", ...dimensions }),
);

assert.equal(new Set(profiles.map((profile) => profile.key)).size, categories.length);
assert.notEqual(profiles.find((profile) => profile.key === "quran")?.panelHeight, profiles.find((profile) => profile.key === "story")?.panelHeight);
assert.notEqual(profiles.find((profile) => profile.key === "hadith")?.bodyFontSize, profiles.find((profile) => profile.key === "dua")?.bodyFontSize);

const kids = resolveVideoComposition({
  category: "story",
  audience: "kids",
  seed: "kids-seed",
  ...dimensions,
});
assert.equal(kids.key, "kids");
assert.ok(kids.panelLeft > 0 && kids.panelPixelWidth < dimensions.width);
assert.ok(kids.panelTop > 0 && kids.panelPixelHeight < dimensions.height);
assert.ok(["center", "left-to-right", "right-to-left", "top-to-bottom", "bottom-to-top"].includes(kids.cameraPath));

const first = resolveVideoComposition({ category: "quran", seed: "stable-id", ...dimensions });
const retry = resolveVideoComposition({ category: "quran", seed: "stable-id", ...dimensions });
assert.equal(first.cameraPath, retry.cameraPath, "camera path must remain stable across retries");

const longStory = Array.from({ length: 450 }, (_, index) => `كلمة${index + 1}`).join(" ");
const longStoryPages = paginateCaptionText(longStory, 26, 3);
assert.ok(longStoryPages.length > 10, "long narrations must expand into all required caption pages");
const reconstructedLongStory = longStoryPages.join(" ").replace(/\\N/g, " ").replace(/\s+/g, " ").trim();
assert.equal(reconstructedLongStory, longStory, "caption pagination must not drop any spoken words");

const pages = [
  "الحمد لله رب العالمين\\Nالرحمن الرحيم",
  "مالك يوم الدين\\Nإياك نعبد وإياك نستعين.",
  "اهدنا الصراط المستقيم،\\Nصراط الذين أنعمت عليهم.",
];
const cues = planCaptionTimings(pages, 18);
assert.equal(cues.length, pages.length);
assert.equal(cues[0].text, pages[0]);
assert.ok(cues[0].start >= 0);
for (let index = 0; index < cues.length; index += 1) {
  assert.ok(cues[index].end > cues[index].start, "every cue must have a positive duration");
  if (index > 0) {
    assert.ok(cues[index].start >= cues[index - 1].end, "caption cues must never overlap");
  }
}
assert.ok(cues.at(-1)!.end <= 17.61, "captions must finish before the audio tail");

const denseCues = planCaptionTimings(Array.from({ length: 10 }, (_, index) => `مقطع ${index + 1} من النص الطويل.`), 8);
assert.equal(denseCues.length, 10);
assert.ok(denseCues.every((cue) => cue.end > cue.start));
assert.ok(denseCues.at(-1)!.end <= 7.61, "short audio must not produce captions beyond the track");

const zeroDurationCues = planCaptionTimings(["نص قصير"], 0);
assert.equal(zeroDurationCues.length, 1);
assert.ok(zeroDurationCues[0].end > zeroDurationCues[0].start);

assert.deepEqual(planCaptionTimings([], 20), []);

console.log("Video composition and audio-aware caption timing tests passed.");
