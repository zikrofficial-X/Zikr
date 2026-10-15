import assert from "node:assert/strict";
import { isValidContactEmail } from "../../src/features/contact/validation";
import { getContactRateLimitActorId } from "../../src/features/contact/rate-limit-identity";

const validAddresses = [
  "test@example.com",
  "sara.smith@example.co.uk",
  "mohamed.alaa+zikr@example.com",
  "USER@SUBDOMAIN.EXAMPLE.org",
  "a_b-c@example-domain.com",
];

for (const email of validAddresses) {
  assert.equal(isValidContactEmail(email), true, `expected valid email: ${email}`);
}

const invalidAddresses = [
  "",
  "plain-text",
  "missing-at.example.com",
  "user@localhost",
  "user@@example.com",
  "user @example.com",
  "user@ example.com",
  "user@example .com",
  "user@example",
  "user@example..com",
  ".user@example.com",
  "user@example.com.",
  "user@example.com\n",
  "a".repeat(243) + "@example.com",
];

for (const email of invalidAddresses) {
  assert.equal(isValidContactEmail(email), false, `expected invalid email: ${JSON.stringify(email)}`);
}

const actorA = getContactRateLimitActorId("203.0.113.10", "test-secret");
const actorB = getContactRateLimitActorId("203.0.113.11", "test-secret");
assert.match(actorA, /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
assert.equal(getContactRateLimitActorId("203.0.113.10", "test-secret"), actorA, "rate-limit actor must be stable for a caller");
assert.notEqual(getContactRateLimitActorId("203.0.113.10", "other-secret"), actorA, "the database actor must depend on a server-only secret");
assert.notEqual(actorA, actorB, "different client identifiers must use different rate-limit buckets");

assert.throws(() => getContactRateLimitActorId("203.0.113.10", ""), /secret is not configured/);
console.log("Contact validation and shared rate-limit identity checks passed.");
