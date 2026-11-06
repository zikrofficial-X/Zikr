import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { getServerEnv } from "@/lib/env";

type StoredYouTubeOAuthCredential = {
  refresh_token?: string | null;
};

export type YouTubeOAuthCredentialInput = {
  refreshToken: string;
  grantedScopes: string[];
  channelId: string;
  channelName: string | null;
};

export async function readStoredYouTubeRefreshToken(): Promise<string | null> {
  try {
    const rows = await supabaseServerAdminRequest<StoredYouTubeOAuthCredential[]>(
      "/rest/v1/youtube_oauth_credentials?provider=eq.youtube&select=refresh_token&limit=1",
    );
    const token = Array.isArray(rows) ? rows[0]?.refresh_token : null;
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    // A missing table during deployment or a temporary REST error must not
    // break the currently configured environment credential.
    return null;
  }
}

/**
 * The privately stored, newly authorized token takes precedence. The Vercel /
 * GitHub environment token remains a rollback path until the new connection is
 * validated and persisted.
 */
export async function getYouTubeRefreshToken(
  env: { YOUTUBE_REFRESH_TOKEN?: string } = getServerEnv(),
  readStored: () => Promise<string | null> = readStoredYouTubeRefreshToken,
): Promise<string | null> {
  const stored = await readStored().catch(() => null);
  if (stored) return stored;
  const fallback = env.YOUTUBE_REFRESH_TOKEN?.trim();
  return fallback || null;
}

export async function saveYouTubeOAuthCredential(
  credential: YouTubeOAuthCredentialInput,
  connectedBy?: string | null,
): Promise<void> {
  const now = new Date().toISOString();
  await supabaseServerAdminRequest(
    "/rest/v1/youtube_oauth_credentials?on_conflict=provider",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        provider: "youtube",
        refresh_token: credential.refreshToken,
        granted_scopes: credential.grantedScopes,
        channel_id: credential.channelId,
        channel_name: credential.channelName,
        connected_by: connectedBy ?? null,
        connected_at: now,
        updated_at: now,
      }),
    },
  );
}
