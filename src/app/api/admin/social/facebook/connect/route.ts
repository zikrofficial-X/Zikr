import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "zikr-facebook-oauth-state";
const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
];

function siteUrl() {
  return getServerEnv().NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

function adminStatusRedirect(status: string) {
  return NextResponse.redirect(new URL(`/admin/social?facebook=${encodeURIComponent(status)}`, siteUrl()));
}

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const env = getServerEnv();
  if (!env.FACEBOOK_APP_ID?.trim() || !env.FACEBOOK_APP_SECRET?.trim() || !siteUrl()) {
    return adminStatusRedirect("configuration_missing");
  }

  const state = randomBytes(32).toString("hex");
  const redirectUri = new URL("/api/admin/social/facebook/callback", siteUrl()).toString();
  const graphVersion = env.FACEBOOK_GRAPH_API_VERSION || "v26.0";
  const authorizeUrl = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
  authorizeUrl.searchParams.set("client_id", env.FACEBOOK_APP_ID.trim());
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", REQUIRED_PERMISSIONS.join(","));
  authorizeUrl.searchParams.set("auth_type", "rerequest");

  const response = NextResponse.redirect(authorizeUrl);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: siteUrl().startsWith("https://"),
    sameSite: "lax",
    path: "/api/admin/social/facebook/callback",
    maxAge: 10 * 60,
  });
  return response;
}
