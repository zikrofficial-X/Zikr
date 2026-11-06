import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
type StoredYouTubeOAuthCredential = {
  refresh_token?: string | null;
  granted_scopes?: string[] | null;
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
      "/rest/v1/youtube_oauth_credentials?provider=eq.youtube&select=refresh_token,granted_scopes&limit=1",
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    const scopes = Array.isArray(row?.granted_scopes) ? row.granted_scopes : [];
    const readScopes = [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ];
    if (!readScopes.every((scope) => scopes.includes(scope))) return null;
    const token = row?.refresh_token;
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    // A missing table during deployment or a temporary REST error must not
    // break the currently configured environment credential.
    return null;
  }
}

/**
 * Only a credential carrying both explicit read-only scopes is returned.
 * Legacy environment tokens are intentionally not used for analytics because
 * their granted scopes are unknown and may include write/delete capabilities.
 */
export async function getYouTubeRefreshToken(
  _env?: { YOUTUBE_REFRESH_TOKEN?: string },
  readStored: () => Promise<string | null> = readStoredYouTubeRefreshToken,
): Promise<string | null> {
  return readStored().catch(() => null);
}


/**
 * Publishing uses a separately verified credential that explicitly includes
 * youtube.upload as well as channel/analytics read scopes. Analytics continues
 * using the read-only getter above; no video-delete scope is ever accepted.
 */
export async function getYouTubeUploadRefreshToken(): Promise<string | null> {
  try {
    const rows = await supabaseServerAdminRequest<StoredYouTubeOAuthCredential[]>(
      "/rest/v1/youtube_oauth_credentials?provider=eq.youtube&select=refresh_token,granted_scopes&limit=1",
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    const scopes = Array.isArray(row?.granted_scopes) ? row.granted_scopes : [];
    const required = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ];
    if (!required.every((scope) => scopes.includes(scope))) return null;
    const token = row?.refresh_token;
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    return null;
  }
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
