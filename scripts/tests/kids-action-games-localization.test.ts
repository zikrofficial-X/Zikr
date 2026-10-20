import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const runnerRoad = readFileSync("src/features/kids/components/games/kids-action-runner-road.tsx", "utf8");
const adventure = readFileSync("src/features/kids/components/games/kids-action-adventure.tsx", "utf8");

assert.equal(
  (runnerRoad.match(/const \{ isEnglish \} = useLanguage\(\);/g) ?? []).length,
  2,
  "ZIKR Runner and ZIKR Road must both read the selected language",
);
assert.equal(
  (adventure.match(/const \{ isEnglish \} = useLanguage\(\);/g) ?? []).length,
  3,
  "Jump, Crescent Flight, and Mosque Adventure must read the selected language",
);

for (const title of ['title={isEnglish ? "ZIKR Runner"', 'title={isEnglish ? "ZIKR Road"']) {
  assert.ok(runnerRoad.includes(title), "missing localized action-game title: " + title);
}
for (const title of [
  'title={isEnglish ? "ZIKR Jump"',
  'title={isEnglish ? "Crescent Flight"',
  'title={isEnglish ? "Mosque Adventure"',
]) {
  assert.ok(adventure.includes(title), "missing localized adventure-game title: " + title);
}

for (const label of ['"Score" : "النقاط"', '"Stars" : "النجوم"', '"Lives" : "المحاولات"', '"Distance" : "المسافة"']) {
  assert.ok(runnerRoad.includes(label), "runner/road HUD label is not bilingual: " + label);
}
for (const label of ['"Score" : "النقاط"', '"Stars" : "النجوم"', '"Stations" : "المحطات"', '"Mistakes" : "الأخطاء"']) {
  assert.ok(adventure.includes(label), "adventure HUD label is not bilingual: " + label);
}

assert.match(
  runnerRoad,
  /getKidsLevelMeta\s*\(\s*"zikr-runner"\s*,\s*difficulty\s*,\s*model\.levelIndex\s*\)/,
  "Runner must use localized level metadata",
);
assert.match(
  runnerRoad,
  /getKidsLevelMeta\s*\(\s*"zikr-road"\s*,\s*difficulty\s*,\s*state\.levelIndex\s*\)/,
  "Road must use localized level metadata",
);
assert.match(
  adventure,
  /getKidsLevelMeta\s*\(\s*"zikr-jump"\s*,\s*difficulty\s*,\s*snapshot\.levelIndex\s*\)/,
  "Jump must use localized level metadata",
);
assert.match(
  adventure,
  /getKidsLevelMeta\s*\(\s*"hilal-fly"\s*,\s*difficulty\s*,\s*state\.levelIndex\s*\)/,
  "Crescent Flight must use localized level metadata",
);

const nodeCatalog = adventure.split("const NODE_TEMPLATES = [")[1]?.split("] as const;")[0] ?? "";
assert.equal((nodeCatalog.match(/titleEn:/g) ?? []).length, 7, "all Mosque Adventure map nodes need English titles");
assert.equal((nodeCatalog.match(/labelEn:/g) ?? []).length, 7, "all Mosque Adventure map nodes need English labels");
assert.ok(adventure.includes("title: (isEnglish ? template.titleEn : template.title)"), "Mosque map-node names must follow the selected language");
assert.ok(adventure.includes("label: isEnglish ? template.labelEn : template.label"), "Mosque map-node labels must follow the selected language");

assert.equal(
  (runnerRoad.match(/The question and choices use the approved Arabic source content\./g) ?? []).length,
  2,
  "Runner and Road must clarify that checkpoint questions stay in approved Arabic source wording",
);
assert.ok(
  adventure.includes("This checkpoint uses the approved Arabic scenario content."),
  "Mosque Adventure must clarify that scenario text stays in approved Arabic source wording",
);

const gameKit = readFileSync("src/features/kids/components/games/kids-game-kit.tsx", "utf8");
assert.ok(gameKit.includes('label: isEnglish ? "Right" : "يمين"') && gameKit.includes('label: isEnglish ? "Left" : "يسار"'), "shared touch controls must localize direction labels");
assert.ok(gameKit.includes('aria-label={isEnglish ? "Game controls" : "أزرار التحكم باللعبة"}'), "shared touch controls need a localized group label");
assert.ok(gameKit.includes("hideAction = false") && gameKit.includes("hideAction ? \"grid-cols-2\" : \"grid-cols-3\""), "TouchArrows must support hiding unused action controls");
assert.ok(runnerRoad.includes("onAction={() => undefined} hideAction"), "Road must not show an action button that does nothing");

console.log("Kids action-game localization contract passed: 5 games, bilingual HUD/feedback, level metadata, map labels, and verified Arabic checkpoint content.");
