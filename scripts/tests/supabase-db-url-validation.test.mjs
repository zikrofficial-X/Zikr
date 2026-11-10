import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const validatorPath = resolve(process.cwd(), "scripts/verify-supabase-db-url.py");
const projectRef = "zqtssvlvmkzeeyqghqfk";
const testPassword = "test-only-not-a-secret";

function runValidator(url) {
  const result = spawnSync("python3", [validatorPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      SUPABASE_DB_URL: url,
      EXPECTED_PROJECT_REF: projectRef,
    },
  });
  if (result.error) throw result.error;
  return result;
}

function expectPass(url, label) {
  const result = runValidator(url);
  assert.equal(result.status, 0, label + " should pass: " + result.stderr);
  assert.match(result.stdout, /SUPABASE_DB_URL_VALIDATION_PASSED/);
}

function expectFail(url, label) {
  const result = runValidator(url);
  assert.notEqual(result.status, 0, label + " should fail");
  assert.match(result.stderr, /SUPABASE_DB_URL_VALIDATION_FAILED/);
  assert.ok(!result.stderr.includes(testPassword), "validation errors must not expose URL credentials");
}

const directHost = `db.${projectRef}.supabase.co`;
const directUrl = user =>
  `postgresql://${user}:${testPassword}@${directHost}:5432/postgres?sslmode=require`;

expectPass(directUrl("postgres"), "direct Supabase administrative role");
expectPass(directUrl(`postgres.${projectRef}`), "project-qualified direct Supabase role");
expectPass(
  `postgresql://postgres.${projectRef}:${testPassword}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=verify-full`,
  "project-qualified Supabase pooler role",
);

expectFail(directUrl("zikr_seed_loader"), "retired seed-loader role");
expectFail(
  `postgresql://postgres:${testPassword}@attacker.example/postgres?sslmode=require&note=${projectRef}`,
  "foreign host containing the project ref elsewhere in the URL",
);
expectFail(
  `postgresql://postgres:${testPassword}@aws-0-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require`,
  "pooler username without the project-qualified role",
);
expectFail(
  `postgresql://postgres:${testPassword}@${directHost}:5432/postgres`,
  "missing TLS mode",
);
expectFail(
  `postgresql://postgres:${testPassword}@${directHost}:5432/postgres?sslmode=prefer`,
  "weak TLS mode",
);
expectFail(
  `postgresql://postgres:${testPassword}@${directHost}:5432/postgres?sslmode=require&host=attacker.example`,
  "query-string host override",
);
expectFail(
  `postgresql://postgres:${testPassword}@${directHost}:5432/postgres?sslmode=require&user=postgres&user=zikr_seed_loader`,
  "duplicate effective user parameters",
);

console.log("Supabase database URL endpoint, role, project, TLS, override, and credential-redaction tests passed.");
