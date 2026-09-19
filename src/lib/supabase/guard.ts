import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * Guard for account-scoped route handlers.
 *
 * When Supabase is not connected there is no auth provider, so no request can
 * ever be authenticated. Returning 401 (rather than letting the client
 * constructor throw a 500) lets the UI show its normal "sign in required"
 * state instead of an error.
 *
 * Returns a response to send immediately, or `null` to continue.
 */
export function requireSupabaseAuth(): NextResponse | null {
  if (isSupabaseConfigured()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Guard for admin-only route handlers that need the service-role key.
 * Returns a response to send immediately, or `null` to continue.
 */
export function requireSupabaseAdmin(): NextResponse | null {
  if (isSupabaseConfigured()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
