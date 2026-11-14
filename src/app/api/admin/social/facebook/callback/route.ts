import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { saveFacebookPageCredential, saveFacebookPublicProfile } from "@/features/social/services/facebook-credentials";
import { getServerEnv } from "@/lib/env";
import {
  findFacebookPageAcrossPages,
  hasFacebookInsightsPermission,
  hasFacebookPagePublishingTask,
  hasFacebookPublishingPermissions,
} from "@/features/social/services/facebook-oauth-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "zikr-facebook-oauth-state";
const CANONICAL_SITE_ORIGIN = "https://zikrmediaofficial.vercel.app";
const FACEBOOK_REDIRECT_URI = CANONICAL_SITE_ORIGIN + "/api/admin/social/facebook/callback";
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
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { code?: number; message?: string };
};

type MetaPageResponse = {
  id?: string;
  name?: string;
  error?: { message?: string; code?: number };
};

function graphBase(version: string) {
  return "https://graph.facebook.com/" + version;
}

function redirectResult(status: string, extraQuery: Record<string, string> = {}) {
  const query = new URLSearchParams({ facebook: status, ...extraQuery });
  const response = NextResponse.redirect(
    new URL("/admin/social?" + query.toString(), CANONICAL_SITE_ORIGIN),
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

async function graphGet<T>(url: URL, timeoutMs = 20_000): Promise<{ ok: boolean; status: number; data: T }> {
  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await response.json().catch(() => ({})) as T;
  return { ok: response.ok, status: response.status, data };
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
    if (!hasFacebookPublishingPermissions(grantedPermissions)) {
      return redirectResult("permission_missing");
    }

    const configuredPageId = env.FACEBOOK_PAGE_ID?.trim() ?? "";
    const pageLookup = await findFacebookPageAcrossPages(async (after) => {
      const pagesUrl = new URL(base + "/me/accounts");
      pagesUrl.searchParams.set("fields", "id,name,access_token,tasks");
      pagesUrl.searchParams.set("limit", "100");
      pagesUrl.searchParams.set("access_token", userToken);
      if (after) pagesUrl.searchParams.set("after", after);
      const pagesResult = await graphGet<MetaPagesResponse>(pagesUrl, 8_000);
      if (!pagesResult.ok || pagesResult.data.error) {
        return {
          data: [],
          error: {
            status: pagesResult.status,
            code: pagesResult.data.error?.code ?? null,
          },
        };
      }
      return {
        data: Array.isArray(pagesResult.data.data) ? pagesResult.data.data : [],
        paging: pagesResult.data.paging,
      };
    }, configuredPageId, 3);

    if (pageLookup.error) {
      const code = String(pageLookup.error.code ?? "");
      if (code === "190" || pageLookup.error.status === 401) return redirectResult("reauthorization_required");
      if (code === "10" || code === "200" || pageLookup.error.status === 403) return redirectResult("permission_missing");
      return redirectResult("oauth_failed");
    }
    if (!pageLookup.page) {
      if (!pageLookup.complete) return redirectResult("page_lookup_incomplete");
      if (!configuredPageId && pageLookup.multiplePages) {
        return redirectResult("page_selection_required");
      }
      return redirectResult("page_not_found");
    }
    const selectedPage = pageLookup.page;
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
          queueRecoveryRequiresExplicitPublishStepUp: true,
        },
      });
    } catch {
      // A valid Page credential remains stored if the optional audit event fails.
    }

    return redirectResult("connected", hasFacebookInsightsPermission(grantedPermissions) ? {} : { insights: "missing" });
  } catch {
    // Never log authorization codes, user/Page tokens, or provider response bodies.
    return redirectResult("oauth_failed");
  }
}
