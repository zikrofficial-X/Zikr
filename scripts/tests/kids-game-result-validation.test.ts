import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateGameResultPayload } from "../../src/lib/games/validation";

const valid = {
  gameId: "zikr-runner",
  score: 1200,
  collectibles: 4,
  distance: 250,
  difficulty: "normal",
  level: 3,
  combo: 2,
  timeSeconds: 45,
  completed: true,
  clientSubmissionId: "submission-123",
  metadata: {
    source: "kids-world",
    runtime: "runner",
    mistakes: 0,
    accuracy: 100,
    dailyMissionCompleted: true,
  },
};

const accepted = validateGameResultPayload(valid);
assert.ok(accepted, "a bounded registered game result must validate");
assert.deepEqual(accepted.metadata, valid.metadata);
assert.equal(accepted.gameId, "zikr-runner");
assert.equal(accepted.difficulty, "normal");

assert.equal(
  validateGameResultPayload({ ...valid, metadata: { admin: true } }),
  null,
  "unknown metadata keys must be rejected"
);
assert.equal(
  validateGameResultPayload({ ...valid, metadata: { source: "x".repeat(513) } }),
  null,
  "oversized metadata strings must be rejected"
);
assert.equal(
  validateGameResultPayload({ ...valid, metadata: { source: "x".repeat(5000) } }),
  null,
  "oversized metadata payloads must be rejected"
);
assert.equal(
  validateGameResultPayload({ ...valid, metadata: { source: { nested: { too: { deep: { value: true } } } } } }),
  null,
  "excessively nested metadata must be rejected"
);
assert.equal(
  validateGameResultPayload({ ...valid, score: 100001 }),
  null,
  "scores above the registered game limit must be rejected"
);
assert.equal(
  validateGameResultPayload({ ...valid, collectibles: -1 }),
  null,
  "negative counters must be rejected"
);
assert.equal(
  validateGameResultPayload({ ...valid, clientSubmissionId: "short" }),
  null,
  "invalid idempotency keys must be rejected"
);

const migration = readFileSync(
  "supabase/migrations/20261101090000_harden_kids_game_result_insert_contract.sql",
  "utf8"
);
assert.ok(migration.includes("kids_game_results_validate_insert"));
assert.ok(migration.includes("NEW.collectibles IS NULL"));
assert.ok(migration.includes("NEW.difficulty IS NULL"));
assert.ok(migration.includes("NEW.created_at := COALESCE"));
assert.ok(migration.includes("TO service_role"));
assert.ok(migration.includes("pg_advisory_xact_lock"));
assert.ok(migration.includes("kids_game_results_user_created_at_idx"));
assert.ok(migration.includes("interval '1 minute'"));
assert.ok(migration.includes("jsonb_object_length"));
assert.ok(migration.includes("'level', 'combo', 'completed'"), "database metadata validation must allow server-generated result fields");
assert.ok(migration.includes("'letter-lab'"));
console.log("Kids game result validation passed: bounded metadata, registered score limits, and database insert guard.");
