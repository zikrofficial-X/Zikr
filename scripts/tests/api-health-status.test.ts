import assert from "node:assert/strict";
import { createSupabaseHealthCheck } from "../../src/lib/services/api-health-status";

assert.deepEqual(createSupabaseHealthCheck(true), {
  name: "Supabase Auth/REST",
  status: "ok",
  message: "Supabase URL and anon key responded successfully.",
});
const failed = createSupabaseHealthCheck(false);
assert.equal(failed.name, "Supabase Auth/REST");
assert.equal(failed.status, "error");
assert.match(failed.message, /data-plane probe did not respond successfully/);

console.log("Supabase data-plane health result tests passed.");
