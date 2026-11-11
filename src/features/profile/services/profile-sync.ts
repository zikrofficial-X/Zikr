export type AuthProfileSyncUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export type ExistingAuthProfile = {
  display_name?: string | null;
  avatar_url?: string | null;
} | null;

export type AuthProfileSyncPayload = {
  id: string;
  updated_at: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
};

function firstNonEmptyString(
  metadata: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Provider metadata is a bootstrap source, not the owner of a user's editable
 * profile. Only fill blank profile fields; never overwrite a custom name or
 * avatar on a later sign-in when a provider omits or changes its metadata.
 */
export function buildAuthProfileSyncPayload(
  user: AuthProfileSyncUser,
  existingProfile: ExistingAuthProfile,
  updatedAt: string,
): AuthProfileSyncPayload {
  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};
  const email = typeof user.email === "string" && user.email.trim()
    ? user.email.trim()
    : null;
  const providerName =
    firstNonEmptyString(metadata, "full_name", "name", "display_name") ??
    (email ? email.split("@")[0] || null : null);
  const providerAvatar = firstNonEmptyString(metadata, "avatar_url", "picture");

  const payload: AuthProfileSyncPayload = {
    id: user.id,
    updated_at: updatedAt,
  };
  if (email) payload.email = email;
  if (!existingProfile?.display_name?.trim() && providerName) {
    payload.display_name = providerName;
  }
  if (!existingProfile?.avatar_url?.trim() && providerAvatar) {
    payload.avatar_url = providerAvatar;
  }
  return payload;
}
