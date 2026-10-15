import assert from "node:assert/strict";
import { isValidContactEmail } from "../../src/features/contact/validation";

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

console.log("Contact validation checks passed: valid email addresses (including 's') and malformed inputs.");
