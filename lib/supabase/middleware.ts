import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { getPublicEnv } from "@/lib/env";

/**
 * Create a Supabase client suitable for the Next.js proxy edge runtime.
 * Cookie writes are mirrored to the request and response so refreshed tokens are
 * visible to downstream server components and persisted in the browser.
 */
export function createMiddlewareClient(
  request: NextRequest,
  response: NextResponse
) {
  const env = getPublicEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

  if (!configured) {
    return { supabase: null, response, configured } as const;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    return { supabase, response, configured } as const;
  } catch (error) {
    return { supabase: null, response, configured: false } as const;
  }
}
