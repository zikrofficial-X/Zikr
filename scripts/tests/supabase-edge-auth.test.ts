import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AuthVerificationError,
  requireAuthenticatedUser,
} from "../../supabase/functions/_shared/auth.ts";

const makeRequest = (authorization?: string) =>
  new Request("https://edge.example.test/spiritual-ai", {
    method: "POST",
    headers: authorization ? { Authorization: authorization } : {},
  });

const options = (fetcher: typeof fetch, overrides: Partial<{ supabaseUrl: string; anonKey: string }> = {}) => ({
  supabaseUrl: overrides.supabaseUrl ?? "https://project.supabase.co/",
  anonKey: overrides.anonKey ?? "public-anon-key",
  fetcher,
});

async function expectAuthError(
  promise: Promise<unknown>,
  status: 401 | 503,
): Promise<void> {
  await assert.rejects(promise, (error: unknown) =>
    error instanceof AuthVerificationError && error.status === status,
  );
}

let fetchCalled = false;
await expectAuthError(
  requireAuthenticatedUser(makeRequest(), options(async () => {
    fetchCalled = true;
    return Response.json({ id: "should-not-be-called" });
  })),
  401,
);
assert.equal(fetchCalled, false, "missing bearer token must be rejected before contacting Supabase Auth");

await expectAuthError(
  requireAuthenticatedUser(
    makeRequest("Bearer public-anon-key"),
    options(async (input, init) => {
      fetchCalled = true;
      assert.equal(String(input), "https://project.supabase.co/auth/v1/user");
      assert.equal(init?.method, "GET");
      assert.equal((init?.headers as Record<string, string>).apikey, "public-anon-key");
      assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer public-anon-key");
      assert.equal(init?.redirect, "error");
      return new Response(JSON.stringify({ message: "Invalid JWT" }), { status: 401 });
    }),
  ),
  401,
);
assert.equal(fetchCalled, true, "the public anon JWT must be checked against the Auth user endpoint");

const verified = await requireAuthenticatedUser(
  makeRequest("Bearer signed-in-user-access-token"),
  options(async (input, init) => {
    assert.equal(String(input), "https://project.supabase.co/auth/v1/user");
    assert.equal(init?.method, "GET");
    assert.equal((init?.headers as Record<string, string>).Authorization, "Bearer signed-in-user-access-token");
    assert.equal(init?.cache, "no-store");
    return Response.json({ id: "authenticated-user-123" }, { status: 200 });
  }),
);
assert.deepEqual(verified, {
  token: "signed-in-user-access-token",
  userId: "authenticated-user-123",
});

await expectAuthError(
  requireAuthenticatedUser(
    makeRequest("Bearer valid-looking-token"),
    options(async () => new Response("Auth unavailable", { status: 503 })),
  ),
  503,
);
await expectAuthError(
  requireAuthenticatedUser(
    makeRequest("Bearer valid-looking-token"),
    options(async () => { throw new Error("network down"); }),
  ),
  503,
);
await expectAuthError(
  requireAuthenticatedUser(
    makeRequest("Bearer valid-looking-token"),
    options(async () => Response.json({ message: "no user id" }, { status: 200 })),
  ),
  401,
);
await expectAuthError(
  requireAuthenticatedUser(
    makeRequest("Bearer valid-looking-token"),
    options(async () => Response.json({ id: "not-called" }), { supabaseUrl: "", anonKey: "" }),
  ),
  503,
);

const spiritualAiSource = readFileSync("supabase/functions/spiritual-ai/index.ts", "utf8");
const supabaseConfig = readFileSync("supabase/config.toml", "utf8");
const spiritualAiConfig = supabaseConfig.match(/\\[functions\\.spiritual-ai\\]([\\s\\S]*?)(?=\\n\\[functions\\.|$)/)?.[1] ?? "";
assert.match(spiritualAiSource, /requireAuthenticatedUser\(/, "spiritual-ai must validate an authenticated Supabase user");
assert.doesNotMatch(spiritualAiSource, /requireBearerToken\(/, "a non-empty bearer header is not sufficient authentication");
assert.match(spiritualAiConfig, /^\\s*verify_jwt\\s*=\\s*true\\s*$/m, "the Supabase gateway must continue validating JWT signatures");

console.log("Supabase Edge authenticated-user contract passed: 9 assertions.");
