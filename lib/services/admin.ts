import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type AdminProfile = {
  id: string;
  email?: string;
  display_name: string | null;
  role: 'user' | 'admin';
};

export async function getCurrentProfile(): Promise<AdminProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', user.id)
      .single();

    if (!profile) return { id: user.id, email: user.email, display_name: null, role: 'user' };
    return { ...profile, email: user.email };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/auth/login?next=/admin');
  if (profile.role !== 'admin') redirect('/profile?error=admin_required');
  return profile;
}

/**
 * API-route-safe admin guard. Unlike `requireAdmin` (which uses `redirect()`
 * and is only valid in Server Components / pages), this returns a result
 * object so API routes can respond with proper 401/403 JSON.
 */
export async function requireAdminApi(): Promise<
  | { ok: true; profile: AdminProfile }
  | { ok: false; status: 401 | 403; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, status: 401, error: 'Unauthorized' };
  if (profile.role !== 'admin') return { ok: false, status: 403, error: 'Forbidden' };
  return { ok: true, profile };
}
