export const MAX_REQUEST_BODY_BYTES = 16_384;

export type BoundedRequestBytesResult =
  | { ok: true; bytes: Uint8Array }
  | { ok: false; status: 400 | 413; error: string };

export type BoundedJsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

const INVALID_BODY: BoundedJsonBodyResult = {
  ok: false,
  status: 400,
  error: "Invalid JSON payload",
};

const INVALID_REQUEST_BODY: BoundedRequestBytesResult = {
  ok: false,
  status: 400,
  error: "Unable to read request body",
};

const OVERSIZED_BODY: BoundedJsonBodyResult = {
  ok: false,
  status: 413,
  error: "Request body is too large",
};

const OVERSIZED_REQUEST_BODY: BoundedRequestBytesResult = {
  ok: false,
  status: 413,
  error: "Request body is too large",
};

function validateMaxBytes(maxBytes: number) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("maxBytes must be a positive safe integer.");
  }
}

/**
 * Read a request body as bytes with an authoritative streamed-size limit.
 * Content-Length is only an early-rejection hint because chunked or
 * under-reported requests may omit or lie about it.
 */
export async function readBoundedRequestBytes(
  request: Pick<Request, "headers" | "body">,
  maxBytes: number,
): Promise<BoundedRequestBytesResult> {
  validateMaxBytes(maxBytes);

  const declaredLengthHeader = request.headers.get("content-length");
  if (declaredLengthHeader !== null) {
    const declaredLength = Number(declaredLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      await request.body?.cancel().catch(() => undefined);
      return OVERSIZED_REQUEST_BODY;
    }
  }

  if (!request.body) return { ok: true, bytes: new Uint8Array() };

  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    reader = request.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return OVERSIZED_REQUEST_BODY;
      }
      chunks.push(value);
    }
  } catch {
    return INVALID_REQUEST_BODY;
  } finally {
    try {
      reader?.releaseLock();
    } catch {
      // A failed or cancelled stream must not mask the bounded-read result.
    }
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

export async function readBoundedJsonBody(
  request: Pick<Request, "headers" | "body">,
  maxBytes = MAX_REQUEST_BODY_BYTES,
): Promise<BoundedJsonBodyResult> {
  const body = await readBoundedRequestBytes(request, maxBytes);
  if (!body.ok) return body.status === 413 ? OVERSIZED_BODY : INVALID_BODY;
  if (!body.bytes.byteLength) return INVALID_BODY;

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(body.bytes);
    return { ok: true, value: JSON.parse(decoded) as unknown };
  } catch {
    return INVALID_BODY;
  }
}
