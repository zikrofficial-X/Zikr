import assert from "node:assert/strict";
import test from "node:test";

import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";

test("Supabase REST combines caller cancellation with its own timeout", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://supabase.example.test";
  const testServiceKey = "unit-test-key";
  assert.ok(testServiceKey.length < 20, "the fake credential must not resemble a secret literal");
  process.env.SUPABASE_SERVICE_ROLE_KEY = testServiceKey;

  let observedSignal: AbortSignal | undefined;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    observedSignal = init?.signal ?? undefined;
    return new Promise<Response>((_resolve, reject) => {
      const abort = () => reject(observedSignal?.reason ?? new DOMException("Aborted", "AbortError"));
      if (observedSignal?.aborted) abort();
      else observedSignal?.addEventListener("abort", abort, { once: true });
    });
  }) as typeof fetch;

  try {
    const caller = new AbortController();
    const callerRequest = supabaseServerAdminRequest("/rest/v1/video_generation_requests", {
      method: "PATCH",
      signal: caller.signal,
      timeoutMs: 5_000,
    });
    caller.abort(new Error("video lease lost"));
    await assert.rejects(callerRequest, /video lease lost/);
    assert.equal(observedSignal?.aborted, true, "caller cancellation must reach the actual fetch signal");

    const timeoutCaller = new AbortController();
    const timeoutRequest = supabaseServerAdminRequest("/rest/v1/video_generation_requests", {
      method: "PATCH",
      signal: timeoutCaller.signal,
      timeoutMs: 5,
    });
    await assert.rejects(timeoutRequest);
    assert.equal(timeoutCaller.signal.aborted, false, "a request timeout must not mutate the caller's controller");
    assert.equal(observedSignal?.aborted, true, "the internal timeout must still abort when a caller signal is supplied");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});
