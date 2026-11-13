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
for (const legacyPolicy of [
  "kids_game_levels_admin_select",
  "kids_game_levels_admin_insert",
  "kids_game_levels_admin_update",
  "kids_game_levels_admin_delete",
]) {
  assert.ok(
    levelsMigration.includes("DROP POLICY IF EXISTS " + legacyPolicy),
    "legacy authenticated level policy must be removed: " + legacyPolicy,
  );
}
assert.match(
  levelsMigration,
  /CREATE POLICY kids_game_levels_admin_all[\s\S]*?TO authenticated[\s\S]*?private\.is_admin_user\(\)/i,
  "only database administrators must retain direct authenticated access to all levels",
);

assert.match(
  questionsMigration,
  /DROP POLICY IF EXISTS kids_game_questions_public_read[\s\S]*?ON public\.kids_game_questions/i,
  "the previous public question policy must be removed",
);
assert.match(
  questionsMigration,
  /DROP POLICY IF EXISTS kids_game_questions_admin_select[\s\S]*?ON public\.kids_game_questions/i,
  "the previous broad authenticated question policy must be replaced",
);
assert.match(
  questionsMigration,
  /CREATE POLICY kids_game_questions_admin_select[\s\S]*?TO authenticated[\s\S]*?USING \(private\.is_admin_user\(\)\)/i,
  "only authenticated administrators may read question rows",
);
assert.doesNotMatch(
  questionsMigration,
  /published\s+IS\s+TRUE\s+OR\s+private\.is_admin_user/i,
  "published answer keys must not be visible to ordinary authenticated users",
);
assert.doesNotMatch(
  questionsMigration,
  /CREATE POLICY kids_game_questions_public_read|TO anon/i,
  "question rows must never be exposed directly because they include the correct_index answer key",
);
assert.match(
  questionsMigration,
  /REVOKE ALL PRIVILEGES ON TABLE public\.kids_game_questions\s+FROM PUBLIC, anon, authenticated/i,
  "the answer-key table must remove every legacy client grant before restoring admin-only SELECT",
);
assert.match(
  questionsMigration,
  /GRANT SELECT ON TABLE public\.kids_game_questions TO authenticated/i,
  "authenticated admins must retain table privilege subject to the admin-only RLS policy",
);
assert.match(
  questionsMigration,
  /public gameplay must use a reviewed projection that omits correct_index/i,
  "future public gameplay must use a safe question projection without answer keys",
);

assert.match(integrationSetup, /CREATE TABLE public\.kids_game_questions/);
assert.match(integrationSetup, /correct_index integer NOT NULL/i);
assert.match(
  integrationSetup,
  /CREATE POLICY kids_game_levels_admin_select[\s\S]*?published IS TRUE OR private\.is_admin_user/i,
  "integration fixture must begin with the legacy authenticated published-level policy",
);
assert.match(
  integrationSetup,
  /CREATE POLICY kids_game_questions_admin_select[\s\S]*?published IS TRUE OR private\.is_admin_user/i,
  "integration fixture must begin with the legacy authenticated published-question policy",
);
assert.ok(integrationTest.includes("has_table_privilege('anon', 'public.kids_game_questions', 'SELECT')"));
assert.match(integrationTest, /kids_game_levels\) <> 0/);
assert.match(integrationTest, /kids_game_levels\) <> 3/);
assert.match(integrationTest, /kids_game_questions\) <> 0/);
assert.match(integrationTest, /kids_game_questions\) <> 4/);
assert.match(integrationTest, /kids_game_questions_admin_select/);
assert.match(integrationTest, /private\.is_admin_user/);
assert.match(integrationRunner, /20261111040000_kids_game_levels_require_published_game\.sql/);
assert.match(integrationRunner, /20261111170000_kids_game_questions_require_published_parent\.sql/);

assert.match(
  levelsMigration,
  /REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN\s+ON TABLE public\.kids_game_levels\s+FROM PUBLIC, anon/i,
  "anonymous level access must not retain DML or non-DML privileges",
);
assert.match(
  levelsMigration,
  /REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN\s+ON TABLE public\.kids_game_levels\s+FROM authenticated/i,
  "authenticated level editors must not retain non-DML privileges that bypass RLS",
);
assert.match(
  questionsMigration,
  /REVOKE ALL PRIVILEGES ON TABLE public\.kids_game_questions\s+FROM PUBLIC, anon, authenticated/i,
  "the answer-key table must remove every legacy client grant before restoring admin-only SELECT",
);
assert.match(
  integrationSetup,
  /GRANT ALL PRIVILEGES ON TABLE public\.kids_game_levels, public\.kids_game_questions\s+TO PUBLIC, anon, authenticated/i,
  "the integration fixture must reproduce broad legacy table grants before applying the hardening migrations",
);
assert.match(
  integrationTest,
  /DO \$privilege_contract\$[\s\S]*?Kids answer keys/i,
  "the PostgreSQL integration test must assert least-privilege table ACLs after the migrations",
);

console.log("Kids game and question publication RLS contracts passed.");
