import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
type StoredYouTubeOAuthCredential = {
  refresh_token?: string | null;
  granted_scopes?: string[] | null;
  channel_id?: string | null;
};

export function matchesConfiguredYouTubeChannel(
  storedChannelId: unknown,
  configuredChannelId: string | undefined = process.env.YOUTUBE_CHANNEL_ID,
): boolean {
  const stored = typeof storedChannelId === "string" ? storedChannelId.trim() : "";
  const configured = configuredChannelId?.trim() ?? "";
  return Boolean(stored) && (!configured || stored === configured);
}

export function selectYouTubeChannel<T extends { id?: string }>(
  channels: readonly T[],
  configuredChannelId?: string,
): T | null {
  const validChannels = channels.filter(
    (channel) => typeof channel.id === "string" && channel.id.trim().length > 0,
  );
  const configured = configuredChannelId?.trim() ?? "";
  if (configured) {
    return validChannels.find((channel) => channel.id === configured) ?? null;
  }
  // Never silently bind the first channel when a Google account manages several.
  return validChannels.length === 1 ? validChannels[0] : null;
}

export type YouTubeOAuthCredentialInput = {
  refreshToken: string;
  grantedScopes: string[];
  channelId: string;
  channelName: string | null;
};

export async function readStoredYouTubeRefreshToken(): Promise<string | null> {
  try {
    const rows = await supabaseServerAdminRequest<StoredYouTubeOAuthCredential[]>(
      "/rest/v1/youtube_oauth_credentials?provider=eq.youtube&select=refresh_token,granted_scopes,channel_id&limit=1",
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!matchesConfiguredYouTubeChannel(row?.channel_id)) return null;
    const scopes = Array.isArray(row?.granted_scopes) ? row.granted_scopes : [];
    if (!hasYouTubeReadScopes(scopes)) return null;
    const token = row?.refresh_token;
    return typeof token === "string" && token.trim() ? token.trim() : null;
  } catch {
    // Fail closed. Environment refresh tokens are not used because their
    // granted scopes cannot be verified before analytics or publishing calls.
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
const YOUTUBE_READ_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
] as const;

const YOUTUBE_UPLOAD_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  ...YOUTUBE_READ_SCOPES,
] as const;

const YOUTUBE_DELETE_CAPABLE_SCOPES = new Set([
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/youtubepartner",
]);

export function hasYouTubeReadScopes(scopes: readonly string[]): boolean {
  return YOUTUBE_READ_SCOPES.every((scope) => scopes.includes(scope)) &&
    !scopes.some((scope) => YOUTUBE_DELETE_CAPABLE_SCOPES.has(scope));
}

export function hasYouTubeUploadScopes(scopes: readonly string[]): boolean {
  return YOUTUBE_UPLOAD_SCOPES.every((scope) => scopes.includes(scope)) &&
    !scopes.some((scope) => YOUTUBE_DELETE_CAPABLE_SCOPES.has(scope));
}

type YouTubeCredentialRequest = <T>(path: string) => Promise<T>;

export async function readStoredYouTubeUploadRefreshToken(
  request: YouTubeCredentialRequest = supabaseServerAdminRequest,
  configuredChannelId: string | undefined = process.env.YOUTUBE_CHANNEL_ID,
): Promise<string | null> {
  const rows = await request<StoredYouTubeOAuthCredential[]>(
    "/rest/v1/youtube_oauth_credentials?provider=eq.youtube&select=refresh_token,granted_scopes,channel_id&limit=1",
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;
  if (!matchesConfiguredYouTubeChannel(row.channel_id, configuredChannelId)) {
    throw new Error("Stored YouTube OAuth credential does not match the configured channel.");
  }
  const scopes = Array.isArray(row.granted_scopes) ? row.granted_scopes : [];
  if (!hasYouTubeUploadScopes(scopes)) {
    throw new Error("Stored YouTube OAuth credential is missing the required upload/read scopes or includes a delete-capable scope.");
  }
  const token = row.refresh_token;
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Stored YouTube OAuth credential is missing its refresh token.");
  }
  return token.trim();
}

export async function getYouTubeUploadRefreshToken(
  readStored: () => Promise<string | null> = readStoredYouTubeUploadRefreshToken,
): Promise<string | null> {
  // A missing credential is a normal unconfigured state; a failed read or invalid
  // stored credential must propagate so publishing can retry instead of skipping.
  return readStored();
}

export async function saveYouTubeOAuthCredential(
  credential: YouTubeOAuthCredentialInput,
  connectedBy: string,
): Promise<void> {
  if (!connectedBy.trim()) {
    throw new Error("YouTube OAuth credentials require the authenticated admin ID.");
  }
  if (!hasYouTubeUploadScopes(credential.grantedScopes)) {
    throw new Error("YouTube OAuth credential must include upload/read scopes and exclude delete-capable scopes.");
  }
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
        connected_by: connectedBy,
        connected_at: now,
        updated_at: now,
      }),
    },
  );
}
