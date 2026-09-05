import { createBrowserClient } from '@supabase/ssr';

function getBrowserSupabaseEnv() {
  // Keep these references static so Next.js can inline NEXT_PUBLIC_* values
  // into the browser bundle. Dynamic process.env lookups are server-only.
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    key:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      '',
  };
}

type BrowserClient = ReturnType<typeof createBrowserClient>;

// ─── Singleton ──────────────────────────────────────────────────────────
// Deferred construction: module evaluation never calls createBrowserClient,
// so Next.js static page collection and CI builds without env vars succeed.

let _instance: BrowserClient | null = null;

export function createClient(): BrowserClient {
  if (_instance) return _instance;

  const { url, key } = getBrowserSupabaseEnv();

  if (!url || !key) {
    // CRITICAL: Missing Supabase configuration.
    // This is a development-only condition and should never occur in production.
    // In the v0 preview sandbox, NEXT_PUBLIC_* vars are not injected at build time.
    // In production on Vercel, NEXT_PUBLIC_SUPABASE_URL is always set.
    throw new Error(
      'Missing Supabase configuration. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      'in your environment variables.'
    );
  }

  _instance = createBrowserClient(url, key);
  return _instance;
}

/** Alias kept for backward compatibility with existing imports. */
export const createBrowserSupabaseClient = createClient;
