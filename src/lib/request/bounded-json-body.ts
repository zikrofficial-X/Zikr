export const MAX_REQUEST_BODY_BYTES = 16_384;

export type BoundedJsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

const INVALID_BODY: BoundedJsonBodyResult = {
  ok: false,
  status: 400,
  error: "Invalid JSON payload",
};

const OVERSIZED_BODY: BoundedJsonBodyResult = {
  ok: false,
  status: 413,
  error: "Request body is too large",
};

/**
 * Read and parse a JSON request without buffering an unbounded body in memory.
 * Content-Length is an early-rejection hint only; the streamed byte count is
 * authoritative because chunked or under-reported requests may omit or lie.
 */
export async function readBoundedJsonBody(
  request: Pick<Request, "headers" | "body">,
  maxBytes = MAX_REQUEST_BODY_BYTES,
): Promise<BoundedJsonBodyResult> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    throw new RangeError("maxBytes must be a positive safe integer.");
  }

  const declaredLengthHeader = request.headers.get("content-length");
  if (declaredLengthHeader !== null) {
    const declaredLength = Number(declaredLengthHeader);
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
      return OVERSIZED_BODY;
    }
  }

  if (!request.body) return INVALID_BODY;

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
        return OVERSIZED_BODY;
      }
      chunks.push(value);
    }
  } catch {
    return INVALID_BODY;
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

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: JSON.parse(decoded) as unknown };
  } catch {
    return INVALID_BODY;
  }
}
