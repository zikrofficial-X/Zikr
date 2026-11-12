import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { getServerEnv } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATE_COOKIE = "zikr-youtube-oauth-state";
const CANONICAL_SITE_ORIGIN = "https://zikrmediaofficial.vercel.app";
const YOUTUBE_REDIRECT_URI = CANONICAL_SITE_ORIGIN + "/api/admin/social/youtube/callback";
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

function siteUrl() {
  return CANONICAL_SITE_ORIGIN;
}

function adminStatusRedirect(status: string) {
  return NextResponse.redirect(
    new URL(`/admin/social?youtube=${encodeURIComponent(status)}`, siteUrl()),
  );
}

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const publishStepUp = await requireAdminStepUpApi("social.publish", "/admin/social");
  if (!publishStepUp.ok) {
    const nextPath = "nextPath" in publishStepUp ? publishStepUp.nextPath : undefined;
    const destination = nextPath
      ? new URL(nextPath, CANONICAL_SITE_ORIGIN)
      : new URL("/admin/social?youtube=step_up_unavailable", CANONICAL_SITE_ORIGIN);
    return NextResponse.redirect(destination, { headers: { "Cache-Control": "no-store" } });
  }

  const env = getServerEnv();
  const clientId = env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = env.YOUTUBE_CLIENT_SECRET?.trim();
  // Google requires the client secret during the authorization-code exchange.
  // Fail before redirecting to consent when the server configuration is incomplete.
  if (!clientId || !clientSecret) return adminStatusRedirect("configuration_missing");

  const state = randomBytes(32).toString("hex");
  const redirectUri = YOUTUBE_REDIRECT_URI;
  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", REQUIRED_SCOPES.join(" "));
  authorizeUrl.searchParams.set("access_type", "offline");
  authorizeUrl.searchParams.set("include_granted_scopes", "false");
  authorizeUrl.searchParams.set("prompt", "consent");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: siteUrl().startsWith("https://"),
    sameSite: "lax",
    path: "/api/admin/social/youtube/callback",
    maxAge: 10 * 60,
  });
  return response;
}
