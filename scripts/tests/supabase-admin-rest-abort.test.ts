import assert from "node:assert/strict";
import test from "node:test";

import { supabaseServerAdminRequest } from "../../src/lib/supabase/admin-rest";

test("Supabase REST does not retry caller cancellation for retryable reads", async () => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://supabase.example.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "unit-test-key";
  let fetchCalls = 0;
  globalThis.fetch = ((_input: RequestInfo | URL, init?: RequestInit) => {
    fetchCalls += 1;
    const signal = init?.signal;
    return new Promise<Response>((_resolve, reject) => {
      const abort = () => reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
      if (signal?.aborted) abort();
      else signal?.addEventListener("abort", abort, { once: true });
    });
  }) as typeof fetch;

  try {
    const caller = new AbortController();
    const request = supabaseServerAdminRequest("/rest/v1/video_generation_requests", {
      method: "GET",
      signal: caller.signal,
      timeoutMs: 5_000,
    });
    caller.abort();
    await assert.rejects(request);
    assert.equal(fetchCalls, 1, "an explicit caller abort must never be retried as a transient transport failure");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});

test("server REST timeout remains active when a caller signal is supplied", async () => {
  const originalFetch = globalThis.fetch;
  const originalPath = process.env.PATH;
  const envKeys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  const originalEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://supabase.example.test";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "unit-test-anon-key";
  process.env.SUPABASE_URL = "https://supabase.example.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test";
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
    const { supabaseServerAdminRequest: serverAdminRequest } = await import("../../src/lib/supabase/server");
    const caller = new AbortController();
    const request = serverAdminRequest("/rest/v1/video_generation_requests", {
      method: "PATCH",
      signal: caller.signal,
      timeoutMs: 5,
      retries: 0,
    });
    const outcome = await Promise.race([
      request.then(() => "resolved", () => "rejected"),
      new Promise<string>(resolve => setTimeout(() => resolve("timeout"), 50)),
    ]);
    if (outcome === "timeout") caller.abort(new Error("test cleanup"));
    await request.catch(() => undefined);
    assert.equal(outcome, "rejected", "the internal timeout must abort fetch even when a caller signal is present");
    assert.equal(caller.signal.aborted, false, "the internal timeout must not abort the caller-owned controller");
    assert.equal(observedSignal?.aborted, true, "the combined fetch signal must observe the internal timeout");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
    for (const key of envKeys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

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
