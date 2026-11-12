import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_REQUEST_BODY_BYTES,
  readBoundedJsonBody,
} from "../../src/lib/request/bounded-json-body";

function createRequest(
  chunks: Uint8Array[],
  headers: Record<string, string> = {},
) {
  let index = 0;
  let reads = 0;
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      reads += 1;
      if (index < chunks.length) {
        controller.enqueue(chunks[index++]);
      } else {
        controller.close();
      }
    },
    cancel() {
      cancelled = true;
    },
  }, { highWaterMark: 0 });
  return {
    request: { headers: new Headers(headers), body },
    state: {
      get reads() { return reads; },
      get cancelled() { return cancelled; },
    },
  };
}

test("a valid JSON body at the exact byte limit is accepted", async () => {
  const prefix = '{"value":"';
  const suffix = '"}';
  const payload = prefix + "a".repeat(MAX_REQUEST_BODY_BYTES - prefix.length - suffix.length) + suffix;
  const bytes = new TextEncoder().encode(payload);
  assert.equal(bytes.byteLength, MAX_REQUEST_BODY_BYTES);

  const { request } = createRequest([bytes], { "content-length": String(bytes.byteLength) });
  const result = await readBoundedJsonBody(request);
  assert.equal(result.ok, true);
  if (result.ok) assert.equal((result.value as { value: string }).value.length, MAX_REQUEST_BODY_BYTES - prefix.length - suffix.length);
});

test("an oversized declared Content-Length is rejected without reading the stream", async () => {
  const { request, state } = createRequest(
    [new TextEncoder().encode('{"ok":true}')],
    { "content-length": String(MAX_REQUEST_BODY_BYTES + 1) },
  );
  const result = await readBoundedJsonBody(request);
  assert.deepEqual(result, { ok: false, status: 413, error: "Request body is too large" });
  assert.equal(state.reads, 0);
  assert.equal(state.cancelled, true, "declared oversized bodies must be cancelled without being read");
});

test("a chunked or under-reported body is stopped as soon as streamed bytes exceed the limit", async () => {
  const { request, state } = createRequest(
    [new Uint8Array(MAX_REQUEST_BODY_BYTES + 1), new TextEncoder().encode('{"ok":true}')],
    { "content-length": "2" },
  );
  const result = await readBoundedJsonBody(request);
  assert.deepEqual(result, { ok: false, status: 413, error: "Request body is too large" });
  assert.equal(state.cancelled, true);
  assert.equal(state.reads, 1, "the parser must stop after the first over-limit chunk");
});

test("UTF-8 multibyte content is measured by bytes rather than JavaScript characters", async () => {
  const payload = JSON.stringify({ value: "😀".repeat(5_000) });
  const bytes = new TextEncoder().encode(payload);
  assert.ok(payload.length < MAX_REQUEST_BODY_BYTES);
  assert.ok(bytes.byteLength > MAX_REQUEST_BODY_BYTES);

  const { request, state } = createRequest([bytes]);
  const result = await readBoundedJsonBody(request);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
  assert.equal(state.cancelled, true);
});

test("malformed JSON and invalid UTF-8 return HTTP 400 contracts", async () => {
  const malformed = createRequest([new TextEncoder().encode('{"unterminated":')]);
  assert.deepEqual(await readBoundedJsonBody(malformed.request), {
    ok: false,
    status: 400,
    error: "Invalid JSON payload",
  });

  const invalidUtf8 = createRequest([new Uint8Array([0xff, 0xfe, 0xfd])]);
  assert.deepEqual(await readBoundedJsonBody(invalidUtf8.request), {
    ok: false,
    status: 400,
    error: "Invalid JSON payload",
  });
});

test("missing request bodies and invalid byte limits are handled explicitly", async () => {
  assert.deepEqual(
    await readBoundedJsonBody({ headers: new Headers(), body: null }),
    { ok: false, status: 400, error: "Invalid JSON payload" },
  );
  await assert.rejects(
    () => readBoundedJsonBody({ headers: new Headers(), body: null }, 0),
    /maxBytes must be a positive safe integer/,
  );
});
