import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { getServerEnv } from "@/lib/env";
import { hasYouTubeUploadScopes, saveYouTubeOAuthCredential, selectYouTubeChannel } from "@/features/social/services/youtube-oauth-credentials";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "zikr-youtube-oauth-state";
const CANONICAL_SITE_ORIGIN = "https://zikrmediaofficial.vercel.app";
const YOUTUBE_REDIRECT_URI = CANONICAL_SITE_ORIGIN + "/api/admin/social/youtube/callback";
const YOUTUBE_READ_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
const ANALYTICS_SCOPE = "https://www.googleapis.com/auth/yt-analytics.readonly";

type GoogleOAuthToken = {
  access_token?: string;
  refresh_token?: string;
  scope?: string;
  error?: string;
};

type GoogleTokenInfo = {
  scope?: string;
  error?: string;
};

type YouTubeChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: { title?: string };
    statistics?: { subscriberCount?: string; viewCount?: string; videoCount?: string };
  }>;
  error?: {
    code?: number;
    message?: string;
    errors?: Array<{ reason?: string }>;
  };
};

function siteUrl() {
  return CANONICAL_SITE_ORIGIN;
}

function redirectResult(status: string, extra: Record<string, string> = {}) {
  const url = new URL("/admin/social", siteUrl());
  url.searchParams.set("youtube", status);
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, value);
  }
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: siteUrl().startsWith("https://"),
    sameSite: "lax",
    path: "/api/admin/social/youtube/callback",
    maxAge: 0,
  });
  return response;
}

function matchesState(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

function scopeFlags(scopes: string[]) {
  const set = new Set(scopes);
  return {
    canUpload: hasYouTubeUploadScopes(scopes),
    canReadChannel: set.has(YOUTUBE_READ_SCOPE),
    canReadAnalytics: set.has(ANALYTICS_SCOPE),
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return redirectResult("admin_session_missing");

  const state = request.nextUrl.searchParams.get("state") ?? "";
  const expectedState = request.cookies.get(STATE_COOKIE)?.value ?? "";
  if (!state || !expectedState || !matchesState(expectedState, state)) {
    return redirectResult("state_mismatch");
  }

  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    return redirectResult(
      providerError === "access_denied"
        ? "authorization_denied"
        : providerError === "redirect_uri_mismatch"
          ? "redirect_uri_mismatch"
          : "oauth_failed",
    );
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return redirectResult("missing_code");

  const env = getServerEnv();
  const clientId = env.YOUTUBE_CLIENT_ID?.trim() ?? "";
  const clientSecret = env.YOUTUBE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) return redirectResult("configuration_missing");

  const redirectUri = YOUTUBE_REDIRECT_URI;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const token = await tokenResponse.json().catch(() => ({})) as GoogleOAuthToken;
    if (!tokenResponse.ok || !token.access_token) {
      return redirectResult(token.error === "redirect_uri_mismatch" ? "redirect_uri_mismatch" : "oauth_failed");
    }

    // tokeninfo returns granted scope names only; neither token is ever included in a response or log.
    const infoUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    infoUrl.searchParams.set("access_token", token.access_token);
    const infoResponse = await fetch(infoUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const tokenInfo = await infoResponse.json().catch(() => ({})) as GoogleTokenInfo;
    const grantedScopes = typeof tokenInfo.scope === "string"
      ? tokenInfo.scope.split(/\s+/).filter(Boolean)
      : typeof token.scope === "string"
        ? token.scope.split(/\s+/).filter(Boolean)
        : [];
    const flags = scopeFlags(grantedScopes);
    if (!flags.canUpload || !flags.canReadChannel || !flags.canReadAnalytics) {
      return redirectResult("permission_missing", {
        upload: flags.canUpload ? "ready" : "missing",
        read: flags.canReadChannel ? "ready" : "missing",
        analytics: flags.canReadAnalytics ? "ready" : "missing",
      });
    }

    if (!token.refresh_token) {
      // Keep the old credential active. Google must issue a new offline refresh token
      // before this connection can replace the server-side publishing credential.
      return redirectResult("refresh_token_missing");
    }

    const channelUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
    channelUrl.searchParams.set("part", "id,snippet,statistics");
    channelUrl.searchParams.set("mine", "true");
    const channelResponse = await fetch(channelUrl, {
      headers: { Authorization: "Bearer " + token.access_token },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const channelPayload = await channelResponse.json().catch(() => ({})) as YouTubeChannelResponse;
    const channels = Array.isArray(channelPayload.items) ? channelPayload.items : [];
    const validChannels = channels.filter(
      (item) => typeof item.id === "string" && item.id.trim().length > 0,
    );
    const configuredChannelId = env.YOUTUBE_CHANNEL_ID?.trim();
    const channel = selectYouTubeChannel(validChannels, configuredChannelId);
    if (!channel?.id) {
      if (channelResponse.ok && !configuredChannelId && validChannels.length > 1) {
        return redirectResult("channel_selection_required");
      }
      if (channelResponse.ok && configuredChannelId) {
        return redirectResult("channel_mismatch");
      }
      const reason = channelPayload.error?.errors?.[0]?.reason;
      return redirectResult(reason === "insufficientPermissions" ? "permission_missing" : "channel_read_failed");
    }

    await saveYouTubeOAuthCredential({
      refreshToken: token.refresh_token,
      grantedScopes,
      channelId: channel.id,
      channelName: channel.snippet?.title ?? null,
    }, auth.profile.id);

    try {
      await recordAdminAuditEvent({
        action: "social.youtube.oauth.connect",
        permission: "social.manage",
        resourceType: "youtube_channel",
        resourceId: channel.id,
        metadata: {
          channelName: channel.snippet?.title ?? null,
          grantedScopes: grantedScopes.map((scope) => scope.split("/").at(-1)),
          channelRead: true,
          analyticsRead: true,
          upload: true,
          delete: false,
        },
      });
    } catch {
      // The new credential is already stored. Never roll back a valid OAuth connection
      // because the optional audit event could not be recorded.
    }

    return redirectResult("connected", {
      upload: "ready",
      channel: channel.snippet?.title ?? "YouTube",
    });
  } catch {
    // Do not log provider bodies, authorization codes, access tokens, or refresh tokens.
    return redirectResult("oauth_failed");
  }
}
