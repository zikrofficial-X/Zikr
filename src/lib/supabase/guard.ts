import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/server';

/**
 * Supabase-availability guard for account-scoped route handlers.
 *
 * This is not an identity check: each route's service must still call
 * supabase.auth.getUser() and scope every query to that authenticated user
 * before reading or writing account data. Returning 401 here only prevents
 * client-construction failures when the provider is not configured.
 *
 * Returns a response to send immediately, or `null` to continue.
 */
export function requireSupabaseAuth(): NextResponse | null {
  if (isSupabaseConfigured()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Legacy Supabase-availability check only. This does not validate an admin
 * role or authorize service-role access; admin routes must use requireAdminApi
 * and the role-assignment/RLS contract.
 * Returns a response to send immediately, or `null` to continue.
 */
export function requireSupabaseAdmin(): NextResponse | null {
  if (isSupabaseConfigured()) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
