import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { getServerEnv } from "@/lib/env";
import {
  saveFacebookPageCredential,
  unblockFacebookAuthBlockedQueue,
} from "@/features/social/services/facebook-credentials";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "zikr-facebook-oauth-state";
const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
] as const;

type MetaGraphError = {
  code?: unknown;
  message?: unknown;
};

class MetaOAuthError extends Error {
  code: string | null;
  constructor(code: unknown, message: unknown) {
    super(String(message ?? "Meta OAuth request failed."));
    this.name = "MetaOAuthError";
    this.code = code == null ? null : String(code);
  }
}

type GraphTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: MetaGraphError;
};

type ManagedPage = {
  id?: string;
  name?: string;
  access_token?: string;
  expires_at?: number | string;
  expires_in?: number;
  tasks?: string[];
};

type ManagedPagesResponse = {
  data?: ManagedPage[];
  error?: MetaGraphError;
};

type PermissionResponse = {
  data?: Array<{ permission?: string; status?: string }>;
  error?: MetaGraphError;
};

function siteUrl() {
  return getServerEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

function redirectResult(status: string, extra: Record<string, string> = {}) {
  const url = new URL("/admin/social", siteUrl());
  url.searchParams.set("facebook", status);
  for (const [key, value] of Object.entries(extra)) url.searchParams.set(key, value);
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: siteUrl().startsWith("https://"),
    sameSite: "lax",
    path: "/api/admin/social/facebook/callback",
    maxAge: 0,
  });
  return response;
}

function matchesState(expected: string, actual: string) {
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

function graphVersion() {
  return getServerEnv().FACEBOOK_GRAPH_API_VERSION || "v26.0";
}

async function graphGet<T>(path: string, params: URLSearchParams): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${graphVersion()}/${path.replace(/^\//, "")}`);
  url.search = params.toString();
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: { accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({})) as T & { error?: MetaGraphError };
  if (!response.ok || payload.error) {
    throw new MetaOAuthError(payload.error?.code, payload.error?.message ?? `Meta Graph HTTP ${response.status}`);
  }
  return payload;
}

function oauthErrorStatus(error: unknown) {
  if (!(error instanceof MetaOAuthError)) return "oauth_failed";
  const code = error.code;
  const message = error.message.toLowerCase();
  if (code === "190" || message.includes("session has expired") || message.includes("invalid oauth")) return "reauthorization_required";
  if (code === "10" || code === "200" || message.includes("permission")) return "permission_missing";
  if (message.includes("redirect_uri") || message.includes("redirect uri")) return "redirect_uri_mismatch";
  return "oauth_failed";
}

function expiresAt(page: ManagedPage): string | null {
  if (typeof page.expires_at === "number" && page.expires_at > 0) {
    return new Date(page.expires_at * 1000).toISOString();
  }
  if (typeof page.expires_at === "string" && Number.isFinite(Date.parse(page.expires_at))) {
    return new Date(page.expires_at).toISOString();
  }
  if (typeof page.expires_in === "number" && page.expires_in > 0) {
    return new Date(Date.now() + page.expires_in * 1000).toISOString();
  }
  return null;
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
    const denied = providerError === "access_denied" ? "authorization_denied" : "oauth_failed";
    return redirectResult(denied);
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return redirectResult("missing_code");

  const env = getServerEnv();
  const appId = env.FACEBOOK_APP_ID?.trim() ?? "";
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() ?? "";
  const pageIdConfigured = env.FACEBOOK_PAGE_ID?.trim() ?? "";
  if (!appId || !appSecret || !siteUrl()) return redirectResult("configuration_missing");

  const redirectUri = new URL("/api/admin/social/facebook/callback", siteUrl()).toString();
  try {
    // Exchange the login code for a short-lived user token, then exchange it server-side
    // for a long-lived user token before requesting a Page-scoped token.
    const codeParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    });
    const shortToken = await graphGet<GraphTokenResponse>("oauth/access_token", codeParams);
    if (!shortToken.access_token) throw new MetaOAuthError(null, "Meta did not return a user access token.");

    const longTokenParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: shortToken.access_token,
    });
    const longToken = await graphGet<GraphTokenResponse>("oauth/access_token", longTokenParams);
    if (!longToken.access_token) throw new MetaOAuthError(null, "Meta did not return a long-lived user token.");

    const pagesParams = new URLSearchParams({
      fields: "id,name,access_token,expires_at,expires_in,tasks",
      limit: "100",
      access_token: longToken.access_token,
    });
    const pages = await graphGet<ManagedPagesResponse>("me/accounts", pagesParams);
    const managedPages = Array.isArray(pages.data) ? pages.data : [];
    const selectedPage = pageIdConfigured
      ? managedPages.find(page => String(page.id ?? "") === pageIdConfigured)
      : managedPages.length === 1 ? managedPages[0] : undefined;
    if (!selectedPage?.id || !selectedPage.access_token) {
      return redirectResult("page_not_found");
    }

    const permissionParams = new URLSearchParams({ access_token: longToken.access_token });
    const permissions = await graphGet<PermissionResponse>("me/permissions", permissionParams);
    const granted = (permissions.data ?? [])
      .filter(permission => permission.status === "granted" && typeof permission.permission === "string")
      .map(permission => permission.permission as string);
    const missing = REQUIRED_PERMISSIONS.filter(permission => !granted.includes(permission));
    if (missing.length) {
      return redirectResult("permission_missing", { missing: missing.join(",") });
    }

    // Validate the selected Page token against the exact configured Page before storing it.
    const verifyParams = new URLSearchParams({
      fields: "id,name",
      access_token: selectedPage.access_token,
    });
    const verifiedPage = await graphGet<{ id?: unknown; name?: unknown }>(
      String(selectedPage.id),
      verifyParams,
    );
    if (String(verifiedPage.id ?? "") !== String(selectedPage.id)) {
      return redirectResult("page_validation_failed");
    }

    await saveFacebookPageCredential({
      pageId: String(selectedPage.id),
      pageName: String(verifiedPage.name ?? selectedPage.name ?? "Facebook Page"),
      accessToken: selectedPage.access_token,
      expiresAt: expiresAt(selectedPage),
      grantedPermissions: granted,
    });

    // Invalidate cached Page metadata so the public Facebook card immediately tests the new credential.
    try {
      await supabaseServerAdminRequest(
        "/rest/v1/social_platform_profiles?platform=eq.facebook",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            synced_at: "2000-01-01T00:00:00.000Z",
            status: "stale",
            last_error: null,
          }),
        },
      );
    } catch {
      // The next page request refreshes the cache; credential storage already succeeded.
    }

    let released = 0;
    try {
      released = await unblockFacebookAuthBlockedQueue();
    } catch {
      // Credentials remain connected; the regular publisher schedule can recover the queue.
    }

    let dispatched = "false";
    try {
      await dispatchGitHubWorkflow("publish-social.yml");
      dispatched = "true";
    } catch {
      // The scheduled GitHub publisher runs every 15 minutes even if the immediate dispatch token is unavailable.
    }

    return redirectResult("connected", {
      released: String(released),
      dispatched,
      page: String(verifiedPage.name ?? selectedPage.name ?? "Facebook Page"),
    });
  } catch (error) {
    // Never log the OAuth code, access tokens, callback URL, or raw provider response.
    const status = oauthErrorStatus(error);
    return redirectResult(status);
  }
}
