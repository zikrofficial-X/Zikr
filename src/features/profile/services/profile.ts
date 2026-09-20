import "server-only";

import {
  createAdminClient,
  createClient,
} from "@/lib/supabase/server";

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


export type ProfileUpdateInput = {
  display_name?: string | null;
  displayName?: string | null;
  locale?: unknown;
};

export type ProfileUpdateResult =
  | { ok: true; profile: Record<string, unknown>; email: string | null }
  | { ok: false; error: "Unauthorized" | "Invalid" | "Failed"; message?: string };

const MAX_DISPLAY_NAME_LENGTH = 80;
const SUPPORTED_LOCALES = new Set(["ar", "en"]);

function parseProfileUpdate(
  input: unknown,
):
  | {
      display_name?: string | null;
      locale?: string;
    }
  | { error: string } {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { error: "Request body must be an object" };
  }

  const body = input as Record<string, unknown>;
  const hasSnake = Object.hasOwn(body, "display_name");
  const hasCamel = Object.hasOwn(body, "displayName");
  const hasLocale = Object.hasOwn(body, "locale");

  if (!hasSnake && !hasCamel && !hasLocale) {
    return {
      error: "Provide display_name, displayName, or locale to update the profile",
    };
  }

  const parsed: { display_name?: string | null; locale?: string } = {};

  if (hasSnake || hasCamel) {
    const value = hasSnake ? body.display_name : body.displayName;
    if (typeof value !== "string") {
      return { error: "display_name must be a string" };
    }
    const displayName = value.trim();
    if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      return {
        error: `display_name must not exceed ${MAX_DISPLAY_NAME_LENGTH} characters`,
      };
    }
    parsed.display_name = displayName || null;
  }

  if (hasLocale) {
    if (
      typeof body.locale !== "string" ||
      !SUPPORTED_LOCALES.has(body.locale)
    ) {
      return { error: "locale must be either ar or en" };
    }
    parsed.locale = body.locale;
  }

  return parsed;
}

export async function updateCurrentProfile(
  input: unknown,
): Promise<ProfileUpdateResult> {
  const session = await getAuthenticatedUserForProfile();
  if (!session) return { ok: false, error: "Unauthorized" };

  const parsed = parseProfileUpdate(input);
  if ("error" in parsed) {
    return { ok: false, error: "Invalid", message: parsed.error };
  }

  const updates: {
    id: string;
    display_name?: string | null;
    locale?: string;
    updated_at: string;
  } = {
    id: session.user.id,
    updated_at: new Date().toISOString(),
  };

  if (Object.hasOwn(parsed, "display_name")) {
    updates.display_name = parsed.display_name;
  }
  if (Object.hasOwn(parsed, "locale")) {
    updates.locale = parsed.locale;
  }

  const { data, error } = await session.supabase
    .from("profiles")
    .upsert(updates, { onConflict: "id" })
    .select(
      "id, display_name, avatar_url, locale, role, created_at, updated_at",
    )
    .single();

  if (error) {
    console.error("[profile] update failed:", error);
    return { ok: false, error: "Failed" };
  }

  return {
    ok: true,
    profile: data as Record<string, unknown>,
    email: session.user.email ?? null,
  };
}

async function getAuthenticatedUserForProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}


export async function syncAuthProfile(
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!user.id.trim()) return { ok: false, error: "Invalid user" };

  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};

  const displayName =
    typeof metadata.full_name === "string"
      ? metadata.full_name.trim()
      : typeof metadata.name === "string"
        ? metadata.name.trim()
        : null;

  const avatarUrl =
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url.trim()
      : typeof metadata.picture === "string"
        ? metadata.picture.trim()
        : null;

  const adminClient = createAdminClient();
  const { error } = await adminClient.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      display_name: displayName || null,
      avatar_url: avatarUrl || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[profile] auth sync failed:", error);
    return { ok: false, error: "profile_sync_failed" };
  }

  return { ok: true };
}


export async function updateCurrentProfileAvatar(
  avatarUrl: string,
): Promise<{ ok: true } | { ok: false; error: "Unauthorized" | "Invalid" | "Failed" }> {
  const session = await getAuthenticatedUserForProfile();
  if (!session) return { ok: false, error: "Unauthorized" };

  const url = avatarUrl.trim();
  if (!/^https:\/\//i.test(url) || url.length > 2048) {
    return { ok: false, error: "Invalid" };
  }

  const { error } = await session.supabase
    .from("profiles")
    .upsert(
      {
        id: session.user.id,
        avatar_url: url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    console.error("[profile] avatar update failed:", error);
    return { ok: false, error: "Failed" };
  }

  return { ok: true };
}
