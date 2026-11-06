import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { getServerEnv } from "@/lib/env";

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

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const env = getServerEnv();
  const appId = env.FACEBOOK_APP_ID?.trim();
  if (!appId || !env.FACEBOOK_APP_SECRET?.trim()) {
    return NextResponse.redirect(
      new URL("/admin/social?facebook=configuration_missing", CANONICAL_SITE_ORIGIN),
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const state = randomBytes(32).toString("hex");
  const version = (env.FACEBOOK_GRAPH_API_VERSION || "v26.0").trim();
  const authorizeUrl = new URL("https://www.facebook.com/" + version + "/dialog/oauth");
  authorizeUrl.searchParams.set("client_id", appId);
  authorizeUrl.searchParams.set("redirect_uri", FACEBOOK_REDIRECT_URI);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", REQUIRED_PERMISSIONS.join(","));
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("auth_type", "rerequest");

  const response = NextResponse.redirect(authorizeUrl);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/admin/social/facebook/callback",
    maxAge: 10 * 60,
  });
  return response;
}
