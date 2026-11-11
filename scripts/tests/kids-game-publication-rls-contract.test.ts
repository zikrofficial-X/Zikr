import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const levelsMigration = readFileSync(
  "supabase/migrations/20261111040000_kids_game_levels_require_published_game.sql",
  "utf8",
);
const questionsMigration = readFileSync(
  "supabase/migrations/20261111170000_kids_game_questions_require_published_parent.sql",
  "utf8",
);
const integrationSetup = readFileSync(
  "scripts/tests/kids-game-levels-rls.integration-setup.sql",
  "utf8",
);
const integrationTest = readFileSync(
  "scripts/tests/kids-game-levels-rls.integration.sql",
  "utf8",
);
const integrationRunner = readFileSync(
  "scripts/tests/kids-game-levels-rls.integration.sh",
  "utf8",
);

assert.match(
  levelsMigration,
  /CREATE POLICY kids_game_levels_public_read[\s\S]*?TO anon[\s\S]*?level\.published IS TRUE[\s\S]*?game\.published IS TRUE/i,
  "published levels must be visible only when their parent game is published",
);
assert.match(
  questionsMigration,
  /CREATE POLICY kids_game_questions_public_read[\s\S]*?TO anon[\s\S]*?published IS TRUE[\s\S]*?FROM public\.kids_game_levels[\s\S]*?JOIN public\.kids_games[\s\S]*?level\.published IS TRUE[\s\S]*?game\.published IS TRUE/i,
  "published questions must be visible only when both their level and parent game are published",
);
assert.doesNotMatch(
  questionsMigration,
  /TO anon,\s*authenticated/i,
  "authenticated non-admin clients must retain the existing anonymous-only publication boundary",
);
assert.match(integrationSetup, /CREATE TABLE public\.kids_game_questions/);
assert.match(integrationSetup, /CREATE POLICY kids_game_questions_admin_all/);
assert.match(integrationTest, /kids_game_questions\) <> 1/);
assert.match(integrationTest, /kids_game_questions\) <> 0/);
assert.match(integrationTest, /kids_game_questions\) <> 4/);
assert.match(integrationRunner, /20261111170000_kids_game_questions_require_published_parent\.sql/);

console.log("Kids game and question publication RLS contracts passed.");
