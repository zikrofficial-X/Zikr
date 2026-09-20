import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ProfileFavorite = {
  id: string;
  item_type: string;
  item_ref: string;
  created_at: string;
};

export type ProfileReadingProgress = {
  id: string;
  scope: string;
  ref: string;
  progress_json: Record<string, unknown>;
  updated_at: string;
};

export type CurrentProfileData = {
  user: {
    id: string;
    email: string | null;
    created_at: string;
    last_sign_in_at: string | null;
    email_confirmed_at: string | null;
    user_metadata: Record<string, unknown>;
    app_metadata: Record<string, unknown>;
  };
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    locale: string | null;
    role: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null;
  assignedRole: string | null;
  favorites: ProfileFavorite[];
  readingProgress: ProfileReadingProgress[];
};

export async function getCurrentProfileData(): Promise<CurrentProfileData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [profileRes, assignmentRes, favoritesRes, progressRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name, avatar_url, locale, role, created_at, updated_at")
        .eq("id", user.id)
        .limit(1),
      supabase
        .from("admin_role_assignments")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("favorites")
        .select("id, item_type, item_ref, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("reading_progress")
        .select("id, scope, ref, progress_json, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
      user_metadata:
        user.user_metadata && typeof user.user_metadata === "object"
          ? (user.user_metadata as Record<string, unknown>)
          : {},
      app_metadata:
        user.app_metadata && typeof user.app_metadata === "object"
          ? (user.app_metadata as Record<string, unknown>)
          : {},
    },
    profile: profileRes.data?.[0]
      ? {
          display_name: profileRes.data[0].display_name ?? null,
          avatar_url: profileRes.data[0].avatar_url ?? null,
          locale: profileRes.data[0].locale ?? null,
          role: profileRes.data[0].role ?? null,
          created_at: profileRes.data[0].created_at ?? null,
          updated_at: profileRes.data[0].updated_at ?? null,
        }
      : null,
    assignedRole:
      typeof assignmentRes.data?.role === "string"
        ? assignmentRes.data.role
        : null,
    favorites: (favoritesRes.data ?? []) as ProfileFavorite[],
    readingProgress: (progressRes.data ?? []) as ProfileReadingProgress[],
  };
}
