import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { saveFacebookPageCredential, saveFacebookPublicProfile, unblockFacebookAuthBlockedQueue } from "@/features/social/services/facebook-credentials";
import { getServerEnv } from "@/lib/env";
import { hasFacebookPagePublishingTask } from "@/features/social/services/facebook-oauth-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "zikr-facebook-oauth-state";
const CANONICAL_SITE_ORIGIN = "https://zikrmediaofficial.vercel.app";
const FACEBOOK_REDIRECT_URI = CANONICAL_SITE_ORIGIN + "/api/admin/social/facebook/callback";
const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "read_insights",
] as const;

type MetaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; type?: string; code?: number };
};

type MetaPermissionResponse = {
  data?: Array<{ permission?: string; status?: string }>;
};

type MetaPagesResponse = {
  data?: Array<{
    id?: string;
    name?: string;
    access_token?: string;
    tasks?: string[];
  }>;
};

type MetaPageResponse = {
  id?: string;
  name?: string;
  error?: { message?: string; code?: number };
};

function graphBase(version: string) {
  return "https://graph.facebook.com/" + version;
}

function redirectResult(status: string) {
  const response = NextResponse.redirect(
    new URL("/admin/social?facebook=" + encodeURIComponent(status), CANONICAL_SITE_ORIGIN),
  );
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(STATE_COOKIE, "", {
    httpOnly: true,
    secure: true,
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

async function graphGet<T>(url: URL): Promise<{ ok: boolean; data: T }> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({})) as T;
  return { ok: response.ok, data };
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
    return redirectResult(providerError === "access_denied" ? "authorization_denied" : "oauth_failed");
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) return redirectResult("missing_code");

  const env = getServerEnv();
  const appId = env.FACEBOOK_APP_ID?.trim() ?? "";
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() ?? "";
  if (!appId || !appSecret) return redirectResult("configuration_missing");

  const version = (env.FACEBOOK_GRAPH_API_VERSION || "v26.0").trim();
  const base = graphBase(version);

  try {
    const shortTokenUrl = new URL(base + "/oauth/access_token");
    shortTokenUrl.searchParams.set("client_id", appId);
    shortTokenUrl.searchParams.set("client_secret", appSecret);
    shortTokenUrl.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
    shortTokenUrl.searchParams.set("code", code);
    const shortTokenResult = await graphGet<MetaTokenResponse>(shortTokenUrl);
    const shortToken = shortTokenResult.data.access_token;
    if (!shortTokenResult.ok || !shortToken) return redirectResult("oauth_failed");

    const longTokenUrl = new URL(base + "/oauth/access_token");
    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", appId);
    longTokenUrl.searchParams.set("client_secret", appSecret);
    longTokenUrl.searchParams.set("fb_exchange_token", shortToken);
    const longTokenResult = await graphGet<MetaTokenResponse>(longTokenUrl);
    const userToken = longTokenResult.data.access_token;
    if (!longTokenResult.ok || !userToken) return redirectResult("oauth_failed");

    const permissionsUrl = new URL(base + "/me/permissions");
    permissionsUrl.searchParams.set("access_token", userToken);
    const permissionsResult = await graphGet<MetaPermissionResponse>(permissionsUrl);
    if (!permissionsResult.ok) return redirectResult("oauth_failed");
    const grantedPermissions = (permissionsResult.data.data ?? [])
      .filter((item) => item.status === "granted" && typeof item.permission === "string")
      .map((item) => item.permission as string);
    if (!REQUIRED_PERMISSIONS.every((permission) => grantedPermissions.includes(permission))) {
      return redirectResult("permission_missing");
    }

    const pagesUrl = new URL(base + "/me/accounts");
    pagesUrl.searchParams.set("fields", "id,name,access_token,tasks");
    pagesUrl.searchParams.set("limit", "100");
    pagesUrl.searchParams.set("access_token", userToken);
    const pagesResult = await graphGet<MetaPagesResponse>(pagesUrl);
    if (!pagesResult.ok) return redirectResult("oauth_failed");
    const pages = Array.isArray(pagesResult.data.data) ? pagesResult.data.data : [];
    const configuredPageId = env.FACEBOOK_PAGE_ID?.trim() ?? "";
    const selectedPage = configuredPageId
      ? pages.find((page) => page.id === configuredPageId)
      : pages.length === 1 ? pages[0] : undefined;

    if (!selectedPage) {
      if (configuredPageId) return redirectResult("page_not_found");
      if (pages.length > 1) return redirectResult("page_selection_required");
      return redirectResult("page_not_found");
    }
    if (!selectedPage.id || !selectedPage.access_token) return redirectResult("page_validation_failed");
    if (!hasFacebookPagePublishingTask(selectedPage.tasks)) {
      return redirectResult("permission_missing");
    }

    const pageUrl = new URL(base + "/" + encodeURIComponent(selectedPage.id));
    pageUrl.searchParams.set("fields", "id,name");
    pageUrl.searchParams.set("access_token", selectedPage.access_token);
    const pageResult = await graphGet<MetaPageResponse>(pageUrl);
    if (!pageResult.ok || pageResult.data.id !== selectedPage.id) {
      return redirectResult("page_validation_failed");
    }

    await saveFacebookPageCredential({
      pageId: selectedPage.id,
      pageName: pageResult.data.name || selectedPage.name || "Facebook Page",
      accessToken: selectedPage.access_token,
      expiresAt: null,
      grantedPermissions,
    });
    let releasedAuthBlockedQueueItems = 0;
    let authBlockedQueueRecoveryFailed = false;
    try {
      releasedAuthBlockedQueueItems = await unblockFacebookAuthBlockedQueue();
    } catch {
      // Keep a valid OAuth connection even if queue recovery must be retried separately.
      authBlockedQueueRecoveryFailed = true;
    }
    try {
      await saveFacebookPublicProfile({
        pageId: selectedPage.id,
        pageName: pageResult.data.name || selectedPage.name || "Facebook Page",
      });
    } catch {
      // The publishing credential is already stored; a public profile cache can be refreshed later.
    }

    try {
      await recordAdminAuditEvent({
        action: "social.facebook.oauth.connect",
        permission: "social.manage",
        resourceType: "facebook_page",
        resourceId: selectedPage.id,
        metadata: {
          pageName: pageResult.data.name || selectedPage.name || "Facebook Page",
          grantedPermissions,
          tokenType: "page",
          releasedAuthBlockedQueueItems,
          authBlockedQueueRecoveryFailed,
        },
      });
    } catch {
      // A valid Page credential remains stored if the optional audit event fails.
    }

    return redirectResult("connected");
  } catch {
    // Never log authorization codes, user/Page tokens, or provider response bodies.
    return redirectResult("oauth_failed");
  }
}
