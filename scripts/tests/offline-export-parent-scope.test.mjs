import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  getPublishedParentScope,
  isParentScopedOfflineDataset,
} from "../lib/offline-export-parent-scope.mjs";

const ids = {
  published: "40000000-0000-4000-8000-000000000001",
  second: "40000000-0000-4000-8000-000000000002",
};

test("offline child datasets are scoped to validated published parent ids", () => {
  const exported = [
    {
      dataset: "prophets",
      rows: [{ id: ids.published }, { id: ids.second }],
    },
  ];

  assert.deepEqual(getPublishedParentScope("prophet_sections", exported), {
    filter: `prophet_id=in.(${ids.published},${ids.second})`,
    hasParents: true,
    parentDataset: "prophets",
  });
  assert.equal(isParentScopedOfflineDataset("prophet_sections"), true);
});

test("all child snapshots use their matching published parent dataset", () => {
  const scopes = [
    ["prophet_sections", "prophets", "prophet_id"],
    ["battle_events", "battles", "battle_id"],
    ["conquest_events", "conquests", "conquest_id"],
    ["companion_stories", "companions", "companion_id"],
    ["kids_game_levels", "kids_games", "game_id"],
  ];

  for (const [dataset, parentDataset, foreignKey] of scopes) {
    const exported = [{ dataset: parentDataset, rows: [{ id: ids.published }] }];
    assert.deepEqual(getPublishedParentScope(dataset, exported), {
      filter: `${foreignKey}=in.(${ids.published})`,
      hasParents: true,
      parentDataset,
    });
  }
});

test("empty published parent sets produce an empty public child snapshot", () => {
  assert.deepEqual(
    getPublishedParentScope("companion_stories", [{ dataset: "companions", rows: [] }]),
    { filter: null, hasParents: false, parentDataset: "companions" },
  );
});

test("missing or invalid parent inventories fail closed", () => {
  assert.throws(
    () => getPublishedParentScope("battle_events", []),
    /validated battles rows are unavailable/,
  );
  assert.throws(
    () => getPublishedParentScope("battle_events", [{ dataset: "battles", rows: [{ id: "not-a-uuid" }] }]),
    /invalid id/,
  );
  assert.equal(getPublishedParentScope("articles", []), null);
  assert.equal(isParentScopedOfflineDataset("articles"), false);
});

test("offline export applies parent scope before validating and writing child datasets", () => {
  const exporter = readFileSync("scripts/export-offline-content.mjs", "utf8");
  assert.match(exporter, /getPublishedParentScope\(dataset, exported\)/);
  assert.match(exporter, /parentScope\?\.hasParents === false/);
  assert.match(exporter, /\[\.\.\.filters, parentScope\.filter\]/);
  assert.match(exporter, /isParentScopedOfflineDataset\(dataset\) \? 0 : configuredMinimum/);
});
