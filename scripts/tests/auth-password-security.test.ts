import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { isPwnedPassword } from "../../src/lib/security/pwned-password";

const candidate = "a-password-used-only-by-the-unit-test-42!";
const hash = createHash("sha1").update(candidate, "utf8").digest("hex").toUpperCase();
const prefix = hash.slice(0, 5);
const suffix = hash.slice(5);
const originalFetch = globalThis.fetch;

try {
  let requestedUrl = "";
  let requestInit: RequestInit | undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(input);
    requestInit = init;
    return new Response(suffix.toLowerCase() + ":3\r\n", { status: 200 });
  }) as typeof fetch;

  assert.equal(await isPwnedPassword(candidate), true);
  assert.equal(requestedUrl, "https://api.pwnedpasswords.com/range/" + prefix);
  assert.equal(requestedUrl.includes(hash), false, "the full password hash must never be sent");
  assert.equal(new Headers(requestInit?.headers).get("user-agent"), "ZIKR Password Security Check");
  assert.equal(new Headers(requestInit?.headers).get("add-padding"), "true");
  assert.equal(requestInit?.cache, "no-store");
  assert.ok(requestInit?.signal, "the network request must be abortable");

  globalThis.fetch = (async () => new Response("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:12\n", { status: 200 })) as typeof fetch;
  assert.equal(await isPwnedPassword(candidate), false, "an absent suffix must be treated as not found");

  globalThis.fetch = (async () => new Response(suffix + ":0\n", { status: 200 })) as typeof fetch;
  assert.equal(await isPwnedPassword(candidate), false, "a zero count must not be treated as pwned");

  globalThis.fetch = (async () => new Response("unavailable", { status: 503 })) as typeof fetch;
  await assert.rejects(isPwnedPassword(candidate), /HIBP password range request failed: 503/);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("Password breach-range tests passed.");
