#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migration = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20261030110000_foreign_key_supporting_indexes.sql"),
  "utf8",
);
const indexes = [
  ["hadith_explanations", "hadith_id", "idx_hadith_explanations_hadith_id"],
  ["recent_recitations", "user_id", "idx_recent_recitations_user_id"],
  ["recent_recitations", "reciter_id", "idx_recent_recitations_reciter_id"],
  ["reciter_favorites", "reciter_id", "idx_reciter_favorites_reciter_id"],
  ["tawasheeh_favorites", "tawasheeh_id", "idx_tawasheeh_favorites_tawasheeh_id"],
  ["tawasheeh_playlist_items", "tawasheeh_id", "idx_tawasheeh_playlist_items_tawasheeh_id"],
  ["tawasheeh_playlists", "user_id", "idx_tawasheeh_playlists_user_id"],
];
for (const [table, column, index] of indexes) {
  const pattern = new RegExp(
    `CREATE INDEX IF NOT EXISTS ${index}\\s+ON public\\.${table} USING btree \\(${column}\\)`,
    "i",
  );
  assert.match(migration, pattern, `Missing FK-support index ${index} on ${table}(${column})`);
}
console.log("Foreign-key supporting index contract passed.");
