import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  hasAdminPermission,
  type AdminPermission,
  type AdminRole,
  ADMIN_ROLE_PERMISSIONS,
} from '@/features/admin/services/permissions';

export type AdminProfile = {
  id: string;
  email?: string;
  display_name: string | null;
  role: AdminRole;
};

export async function getCurrentProfile(): Promise<AdminProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, role')
      .eq('id', user.id)
      .single();

    if (profileError?.code === 'PGRST116' || !profile) {
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('[admin] profile lookup failed:', profileError);
        return null;
      }
      return { id: user.id, email: user.email, display_name: null, role: 'user' };
    }
    if (profileError) {
      console.error('[admin] profile lookup failed:', profileError);
      return null;
    }

    const { data: assignment, error: assignmentError } = await supabase
      .from('admin_role_assignments')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    // The database resolver only treats an assignment as an admin role when the
    // profiles.role enum is also "admin". Any read failure must fail closed:
    // never fall back to the legacy full-admin role after an assignment error.
    if (assignmentError) {
      console.error('[admin] role assignment lookup failed:', assignmentError);
      return null;
    }

    const assignedRole = assignment?.role as AdminRole | null;
    const role: AdminRole = profile.role !== 'admin'
      ? 'user'
      : assignedRole && assignedRole in ADMIN_ROLE_PERMISSIONS
        ? assignedRole
        : assignment
          ? 'user'
          : 'admin';

    return { ...profile, email: user.email, role };
  } catch {
    return null;
  }
}

export async function requireAdminPermission(permission: AdminPermission) {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/auth/login?next=${encodeURIComponent('/admin')}`);
  if (!hasAdminPermission(profile.role, permission)) {
    redirect('/profile?error=admin_permission_required');
  }
  return profile;
}

/**
 * Backward-compatible guard for existing admin pages.
 * New code should prefer `requireAdminPermission(...)` with the narrowest
 * permission required by the page/action.
 */
export async function requireAdmin() {
  return requireAdminPermission('admin.access');
}

export async function requireAdminPermissionApi(permission: AdminPermission): Promise<
  | { ok: true; profile: AdminProfile }
  | { ok: false; status: 401 | 403; error: string }
> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, status: 401, error: 'Unauthorized' };
  if (!hasAdminPermission(profile.role, permission)) {
    return { ok: false, status: 403, error: 'Forbidden' };
  }
  return { ok: true, profile };
}

/**
 * Backward-compatible API guard with optional scoped permission.
 * Existing routes keep `admin.access`; hardened routes can request the
 * narrowest permission required by the endpoint.
 */
export async function requireAdminApi(permission: AdminPermission = 'admin.access') {
  return requireAdminPermissionApi(permission);
}
