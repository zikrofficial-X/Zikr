import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

function getEnv() {
  const env = getServerEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL on the server)."
    );
  }
  if (!anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY on the server)."
    );
  }
  return { url, anonKey, serviceKey };
}

export function isSupabaseConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function createAdminClient() {
  const { url, serviceKey } = getEnv();
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
  const { url, anonKey } = getEnv();
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
};

function isRetryableTransportError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as Error & { cause?: unknown }).cause;
  const causeCode =
    typeof code === "object" && code !== null && "code" in code
      ? String((code as { code?: unknown }).code ?? "")
      : "";
  return (
    error.name === "AbortError" ||
    error.name === "TimeoutError" ||
    causeCode === "UND_ERR_SOCKET" ||
    causeCode === "ECONNRESET" ||
    causeCode === "ETIMEDOUT"
  );
}

async function restRequest<T>(
  path: string,
  init?: RestRequestInit,
  apiKey?: string
): Promise<T> {
  const { url, anonKey } = getEnv();
  const key = apiKey ?? anonKey;
  const { timeoutMs = 20000, ...fetchInit } = init ?? {};
  const method = (fetchInit.method ?? "GET").toUpperCase();
  const retryableMethod = method === "GET" || method === "HEAD";
  const maxAttempts = retryableMethod ? 3 : 1;

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
        // Retry transient upstream failures only for idempotent requests.
        if (retryableMethod && attempt < maxAttempts && res.status >= 500) {
          await new Promise(resolve => setTimeout(resolve, 250 * attempt));
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
      if (!retryableMethod || attempt >= maxAttempts || !isRetryableTransportError(error)) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 250 * attempt));
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Supabase REST request failed");
}

export const supabaseServerAnonRequest = <T>(
  path: string,
  init?: RestRequestInit
) => restRequest<T>(path, init);

export const supabaseServerAdminRequest = <T>(
  path: string,
  init?: RestRequestInit
) =>
  (() => {
    const { serviceKey } = getEnv();
    if (!serviceKey) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY for server-admin Supabase request."
      );
    }
    return restRequest<T>(path, init, serviceKey);
  })();

export async function supabaseServerAdminCount(table: string): Promise<number> {
  const { url, serviceKey } = getEnv();
  if (!serviceKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY for server-admin Supabase count."
    );
  }
  const key = serviceKey;
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id`, {
      method: "HEAD",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "count=exact",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      console.warn(`[supabase] Count failed for ${table}: HTTP ${res.status}`);
      return 0;
    }
    const range = res.headers.get("content-range") ?? "";
    const total = Number(range.split("/")[1]);
    return Number.isFinite(total) ? total : 0;
  } catch (error) {
    console.warn(`[supabase] Count failed for ${table}:`, error);
    return 0;
  }
}

export async function assertSupabaseConnection() {
  try {
    await restRequest("/rest/v1/");
    return true;
  } catch {
    return false;
  }
}
