type RestRequestInit = RequestInit & {
  timeoutMs?: number;
  retries?: number;
};

function normalizeSupabaseUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/\/$/, "").replace(/\/rest\/v1\/?$/, "");
}

function getSupabaseUrl(): string {
  const url = normalizeSupabaseUrl(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
  if (!url) throw new Error("Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL.");
  return url;
}

function getServiceKey(): string {
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  return key;
}

function isRetryableTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const cause = (error as Error & { cause?: unknown }).cause;
  const causeCode =
    typeof cause === "object" && cause !== null && "code" in cause
      ? String((cause as { code?: unknown }).code ?? "")
      : "";

  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    causeCode === "UND_ERR_SOCKET" ||
    causeCode === "ECONNRESET" ||
    causeCode === "ETIMEDOUT"
  );
}

function retryDelayMs(attempt: number): number {
  return Math.min(4000, 400 * 2 ** Math.max(0, attempt - 1));
}

async function restRequest<T>(
  path: string,
  init?: RestRequestInit,
): Promise<T> {
  const url = getSupabaseUrl();
  const key = getServiceKey();
  const { timeoutMs = 12000, retries, ...fetchInit } = init ?? {};
  const method = (fetchInit.method ?? "GET").toUpperCase();
  const retryableMethod = method === "GET" || method === "HEAD";
  const retryCount = retryableMethod
    ? Math.min(
        2,
        Math.max(
          0,
          Number.isFinite(retries) ? Math.floor(retries as number) : 1,
        ),
      )
    : 0;
  const maxAttempts = 1 + retryCount;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${url}${path}`, {
        ...fetchInit,
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
          ...(fetchInit.headers || {}),
        },
        cache: fetchInit.cache ?? "no-store",
        signal: fetchInit.signal ?? controller.signal,
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        const retryableStatus = [429, 500, 502, 503, 504].includes(response.status);

        if (retryableMethod && attempt < maxAttempts && retryableStatus) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "");
          const retryAfterMs =
            Number.isFinite(retryAfter) && retryAfter > 0
              ? Math.min(8000, retryAfter * 1000)
              : retryDelayMs(attempt);
          await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
          continue;
        }

        throw new Error(`Supabase REST ${response.status}: ${body}`);
      }

      if (response.status === 204) return undefined as T;
      const text = await response.text();
      if (!text) return undefined as T;
      return JSON.parse(text) as T;
    } catch (error) {
      lastError = error;
      if (
        !retryableMethod ||
        attempt >= maxAttempts ||
        !isRetryableTransportError(error)
      ) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs(attempt)));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Supabase REST request failed.");
}

/**
 * Node/worker-safe Supabase REST admin client.
 *
 * This module intentionally has no dependency on next/headers, @supabase/ssr,
 * or server-only so GitHub Actions/CLI workers can import it safely.
 */
export const supabaseServerAdminRequest = <T>(
  path: string,
  init?: RestRequestInit,
): Promise<T> => restRequest<T>(path, init);

export async function supabaseServerAdminCount(table: string): Promise<number> {
  const url = getSupabaseUrl();
  const key = getServiceKey();
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase REST ${res.status}: ${body.slice(0, 500)}`);
  }

  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  if (Number.isFinite(total)) return total;

  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0 ? 1 : 0;
}
