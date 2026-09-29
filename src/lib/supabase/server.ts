import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { delimiter, resolve } from "node:path";
import { getServerEnv } from "@/lib/env";

// The production video renderer uses a pinned static FFmpeg binary bundled
// during `prebuild`. Adding its vendor directory to PATH keeps the existing
// execFile("ffmpeg", ...) call portable across Vercel and Linux workers while
// preserving the development fallback to a system-installed ffmpeg.
const bundledFfmpegDir = resolve(process.cwd(), "vendor");
process.env.PATH = [bundledFfmpegDir, process.env.PATH].filter(Boolean).join(delimiter);

function getSupabaseConfig() {
  const env = getServerEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL on the server)."
    );
  }

  return { url, anonKey, serviceKey };
}

function getClientEnv() {
  const { url, anonKey } = getSupabaseConfig();
  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY on the server)."
    );
  }
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createAdminClient() {
  const { url, serviceKey } = getSupabaseConfig();
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY for admin Supabase client."
    );
  }
  return createServerClient(url, serviceKey, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createClient() {
  const { url, anonKey } = getClientEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore if proxy handles refresh.
        }
      },
    },
  });
}

export async function getSupabaseUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

type RestRequestInit = RequestInit & {
  timeoutMs?: number;
  retries?: number;
  next?: { revalidate?: number };
};

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
  apiKey?: string
): Promise<T> {
  const { url, anonKey } = getSupabaseConfig();
  const key = apiKey ?? anonKey;
  if (!key) {
    throw new Error(
      "Missing Supabase API key: configure NEXT_PUBLIC_SUPABASE_ANON_KEY for client requests or SUPABASE_SERVICE_ROLE_KEY for admin requests."
    );
  }

  // Bound the default lifetime of GET/HEAD requests. The previous 30s timeout
  // with 4 retries could keep a single page request alive for roughly 150s per
  // lookup when Supabase returned repeated 504s, which is unsafe on Vercel.
  const { timeoutMs = 12000, retries, ...fetchInit } = init ?? {};
  const method = (fetchInit.method ?? "GET").toUpperCase();
  const retryableMethod = method === "GET" || method === "HEAD";
  const retryCount = retryableMethod
    ? Math.min(
        2,
        Math.max(
          0,
          Number.isFinite(retries) ? Math.floor(retries as number) : 1
        )
      )
    : 0;
  const maxAttempts = 1 + retryCount;

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${url}${path}`, {
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

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const retryableStatus = [429, 500, 502, 503, 504].includes(res.status);
        if (retryableMethod && attempt < maxAttempts && retryableStatus) {
          const retryAfter = Number(res.headers.get("retry-after") ?? "");
          const retryAfterMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? Math.min(8000, retryAfter * 1000)
            : retryDelayMs(attempt);
          await new Promise(resolve => setTimeout(resolve, retryAfterMs));
          continue;
        }
        throw new Error(`Supabase REST ${res.status}: ${body}`);
      }

      if (res.status === 204) return undefined as T;
      const text = await res.text();
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
      await new Promise(resolve => setTimeout(resolve, retryDelayMs(attempt)));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Supabase REST request failed");
}

export const supabaseServerAnonRequest = <T>(
  path: string,
  init?: RestRequestInit
) => {
  const { anonKey } = getClientEnv();
  return restRequest<T>(
    path,
    init ?? { cache: "force-cache", next: { revalidate: 900 } },
    anonKey,
  );
};

export const supabaseServerAdminRequest = <T>(
  path: string,
  init?: RestRequestInit
) =>
  (() => {
    const { serviceKey } = getSupabaseConfig();
    if (!serviceKey) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY for server-admin Supabase request."
      );
    }
    return restRequest<T>(path, init, serviceKey);
  })();

export async function supabaseServerAdminCount(table: string): Promise<number> {
  const { url, serviceKey } = getSupabaseConfig();
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY for server-admin Supabase count."
    );
  }
  const key = serviceKey;

  // Use a bounded GET with an explicit range instead of HEAD. Some Supabase
  // REST deployments do not reliably return Content-Range for HEAD requests,
  // which previously made non-empty tables look empty to background workers.
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

export async function assertSupabaseConnection() {
  try {
    const { anonKey, serviceKey } = getSupabaseConfig();
    const apiKey = serviceKey || anonKey;
    if (!apiKey) return false;

    // Probe a real lightweight application table instead of the REST root
    // metadata endpoint so the admin health status reflects actual data-plane
    // reachability and credentials used by the application.
    await restRequest<{ id: string }[]>(
      "/rest/v1/quran_surahs?select=id&limit=1",
      { timeoutMs: 5000, retries: 1 },
      apiKey,
    );
    return true;
  } catch {
    return false;
  }
}
