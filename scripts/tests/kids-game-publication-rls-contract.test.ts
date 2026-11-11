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
  /CREATE POLICY kids_game_levels_public_read[\s\S]*?TO anon[\s\S]*?published IS TRUE[\s\S]*?FROM public\.kids_games AS game[\s\S]*?game\.published IS TRUE/i,
  "published levels must be visible only when their parent game is published",
);
assert.match(
  questionsMigration,
  /DROP POLICY IF EXISTS kids_game_questions_public_read[\s\S]*?ON public\.kids_game_questions/i,
  "the previous public question policy must be removed",
);
assert.doesNotMatch(
  questionsMigration,
  /CREATE POLICY kids_game_questions_public_read|TO anon/i,
  "question rows must never be exposed directly because they include the correct_index answer key",
);
assert.match(
  questionsMigration,
  /REVOKE SELECT ON TABLE public\.kids_game_questions FROM PUBLIC, anon/i,
  "anonymous clients must not have direct SELECT privilege on question rows",
);
assert.match(
  questionsMigration,
  /GRANT SELECT ON TABLE public\.kids_game_questions TO authenticated/i,
  "authenticated admins must retain table privilege subject to the existing admin RLS policy",
);
assert.match(
  questionsMigration,
  /public gameplay must use a reviewed projection that omits correct_index/i,
  "future public gameplay must use a safe question projection without answer keys",
);
assert.match(integrationSetup, /CREATE TABLE public\.kids_game_questions/);
assert.match(integrationSetup, /CREATE POLICY kids_game_questions_admin_all/);
assert.ok(integrationTest.includes("has_table_privilege('anon', 'public.kids_game_questions', 'SELECT')"));
assert.match(integrationTest, /kids_game_questions\) <> 0/);
assert.match(integrationTest, /kids_game_questions\) <> 4/);
assert.match(integrationRunner, /20261111170000_kids_game_questions_require_published_parent\.sql/);

console.log("Kids game and question publication RLS contracts passed.");
