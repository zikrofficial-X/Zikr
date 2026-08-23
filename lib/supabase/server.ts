import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

// Lazy accessors — read at call-time, not at module-evaluation time.
// This prevents build-time / CI errors when env vars are absent.
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

/**
 * True when the Supabase URL + anon key are present.
 * Route handlers and server components use this to degrade gracefully
 * (empty content, disabled account features) instead of throwing 500s
 * when the database is not connected.
 */
export function isSupabaseConfigured(): boolean {
  const env = getServerEnv();
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Service-role client — bypasses RLS.
 * Use only in server-only code (route handlers, server actions) where you need
 * to write data for a user who may not yet have an active session cookie
 * (e.g. right after an OAuth code exchange before cookies are flushed).
 */
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

/**
 * Do NOT put this client in a global variable.
 * Always create a new client within each function call.
 */
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

/** Convenience: get the currently authenticated user (server-side). */
export async function getSupabaseUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ─── Legacy REST compatibility helpers ───────────────────────────────────────
// These wrap the Supabase REST API directly, used by older services that
// have not yet been migrated to the supabase-js client.

type RestRequestInit = RequestInit & {
  /** Maximum time allowed for the upstream REST request. */
  timeoutMs?: number;
};

async function restRequest<T>(
  path: string,
  init?: RestRequestInit,
  apiKey?: string
): Promise<T> {
  const { url, anonKey } = getEnv();
  const key = apiKey ?? anonKey;
  const { timeoutMs = 8000, ...fetchInit } = init ?? {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(`${url}${path}`, {
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
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase REST ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Authenticated REST request using the anon key. */
export const supabaseServerAnonRequest = <T>(
  path: string,
  init?: RestRequestInit
) => restRequest<T>(path, init);

/** Authenticated REST request using the service-role key (bypasses RLS). */
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

/**
 * Exact row count of a table (service-role, bypasses RLS).
 * Uses a HEAD request with `Prefer: count=exact` and parses the Content-Range header.
 */
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
    });
    if (!res.ok) {
      console.error(`[supabase] Count failed for ${table}: HTTP ${res.status}`);
      return 0;
    }
    // Content-Range: 0-24/3573 → total after the slash
    const range = res.headers.get("content-range") ?? "";
    const total = Number(range.split("/")[1]);
    return Number.isFinite(total) ? total : 0;
  } catch (error) {
    console.error(`[supabase] Count failed for ${table}:`, error);
    return 0;
  }
}

/** Legacy: check Supabase connectivity. */
export async function assertSupabaseConnection() {
  try {
    await restRequest("/rest/v1/");
    return true;
  } catch {
    return false;
  }
}
