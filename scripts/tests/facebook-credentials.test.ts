import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildFacebookCredentialValidationFilter,
  readStoredFacebookCredential,
} from "../../src/features/social/services/facebook-credentials";

const validCredential = {
  page_id: "page 123",
  updated_at: "2026-11-12T18:00:00.000Z",
};

assert.equal(
  buildFacebookCredentialValidationFilter(validCredential),
  "platform=eq.facebook&page_id=eq.page%20123&updated_at=eq.2026-11-12T18%3A00%3A00.000Z",
  "validation writes must target the exact Page and row revision",
);
assert.equal(buildFacebookCredentialValidationFilter({ page_id: " ", updated_at: validCredential.updated_at }), null);
assert.equal(buildFacebookCredentialValidationFilter({ page_id: "123", updated_at: null }), null);
assert.equal(buildFacebookCredentialValidationFilter({ page_id: "123", updated_at: "not-a-date" }), null);

const paths: string[] = [];
const emptyRequest = async <T,>(path: string): Promise<T> => {
  paths.push(path);
  return [] as unknown as T;
};
assert.equal(await readStoredFacebookCredential(emptyRequest), null);
assert.match(paths[0] ?? "", /facebook_reels_next_allowed_at/);

let fallbackCalls = 0;
const fallbackPaths: string[] = [];
const missingColumnRequest = async <T,>(path: string): Promise<T> => {
  fallbackCalls += 1;
  fallbackPaths.push(path);
  if (fallbackCalls === 1) {
    throw new Error('42703 column "facebook_reels_next_allowed_at" does not exist');
  }
  return [] as unknown as T;
};
assert.equal(await readStoredFacebookCredential(missingColumnRequest), null);
assert.equal(fallbackCalls, 2);
assert.doesNotMatch(fallbackPaths[1] ?? "", /facebook_reels_next_allowed_at/);

const malformedRequest = async <T,>(): Promise<T> => ({ unexpected: true }) as T;
await assert.rejects(
  readStoredFacebookCredential(malformedRequest),
  /Facebook credential query returned an invalid row set/,
);
let legacyCall = 0;
const malformedLegacyRequest = async <T,>(): Promise<T> => {
  legacyCall += 1;
  if (legacyCall === 1) {
    throw new Error('42703 column "facebook_reels_next_allowed_at" does not exist');
  }
  return { unexpected: true } as T;
};
await assert.rejects(
  readStoredFacebookCredential(malformedLegacyRequest),
  /Legacy Facebook credential query returned an invalid row set/,
);

const networkErrorRequest = async <T,>(): Promise<T> => {
  throw new Error("facebook credential network failure");
};
await assert.rejects(readStoredFacebookCredential(networkErrorRequest), /facebook credential network failure/);

const source = readFileSync("src/features/social/services/facebook-credentials.ts", "utf8");
const persistStart = source.indexOf("async function persistValidation");
const persistEnd = source.indexOf("export async function getFacebookPageConnectionHealth", persistStart);
assert.ok(persistStart >= 0 && persistEnd > persistStart, "persistValidation must remain a bounded helper");
const persistSource = source.slice(persistStart, persistEnd);
assert.match(persistSource, /buildFacebookCredentialValidationFilter\(credential\)/);
assert.match(persistSource, /if \(!filter\) return;/);
assert.doesNotMatch(persistSource, /social_platform_credentials\?platform=eq\.facebook/);

console.log("Facebook credential row-shape and validation CAS checks passed.");
