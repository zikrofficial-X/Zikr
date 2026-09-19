import { enforceCanonicalProductionUrl, PRODUCTION_URL } from "@/lib/site";

const e = process.env;

/** Normalize Supabase project URLs supplied by integrations or local scripts. */
function normalizeSupabaseUrl(value: string | undefined): string | undefined {
  if (!value) return value;
  try {
    const url = new URL(value.trim());
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return value.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  }
}

function pick(name: string): string | undefined {
  const value = e[name];
  return value !== undefined && value !== "" ? value : undefined;
}

const siteUrl = enforceCanonicalProductionUrl(
  pick("NEXT_PUBLIC_SITE_URL") || PRODUCTION_URL
);

/**
 * Return this app's own OAuth callback URL.
 * Ignores a mis-provisioned value that points at the Supabase provider
 * callback (`https://<project>.supabase.co/auth/v1/callback`) — using that as
 * the app `redirectTo` would break the OAuth code exchange.
 */
function resolveAppCallbackUrl(
  configured: string | undefined,
  site: string
): string {
  const fallback = `${site.replace(/\/$/, "")}/auth/callback`;
  if (!configured) return fallback;
  try {
    const url = new URL(configured);
    const isSupabaseProviderCallback =
      url.hostname.endsWith(".supabase.co") &&
      url.pathname === "/auth/v1/callback";
    if (isSupabaseProviderCallback) return fallback;
    return configured;
  } catch {
    return fallback;
  }
}

const rawEnv: Record<string, string | undefined> = {
  ...e,

  // ── Supabase ──────────────────────────────────────────────────────────────
  SUPABASE_URL: normalizeSupabaseUrl(pick("SUPABASE_URL")),
  NEXT_PUBLIC_SUPABASE_URL: normalizeSupabaseUrl(
    pick("NEXT_PUBLIC_SUPABASE_URL") || pick("SUPABASE_URL")
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: pick("SUPABASE_SERVICE_ROLE_KEY"),

  // ── Cloudinary ───────────────────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: pick("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: pick("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: pick("CLOUDINARY_API_SECRET"),

  // ── Site / Auth ───────────────────────────────────────────────────────────
  NEXT_PUBLIC_SITE_URL: siteUrl,
  AUTH_CALLBACK_URL: resolveAppCallbackUrl(pick("AUTH_CALLBACK_URL"), siteUrl),

  NEXT_PUBLIC_GA_MEASUREMENT_ID: pick("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
  NEXT_PUBLIC_GTM_ID: pick("NEXT_PUBLIC_GTM_ID"),

  // ── YouTube ───────────────────────────────────────────────────────────────
  // Uploads require the OAuth client + refresh token. API key is optional and
  // is kept for public-data reads.
  YOUTUBE_API_KEY: pick("YOUTUBE_API_KEY"),
  YOUTUBE_CLIENT_ID: pick("YOUTUBE_CLIENT_ID"),
  YOUTUBE_CLIENT_SECRET: pick("YOUTUBE_CLIENT_SECRET"),
  YOUTUBE_CHANNEL_ID: pick("YOUTUBE_CHANNEL_ID"),
  YOUTUBE_REFRESH_TOKEN: pick("YOUTUBE_REFRESH_TOKEN"),

  // ── Gemini AI ─────────────────────────────────────────────────────────────
  GEMINI_API_KEY: pick("GEMINI_API_KEY"),
  GEMINI_MODEL: pick("GEMINI_MODEL") || "gemini-2.5-flash",

  // ── Islamic content API ───────────────────────────────────────────────────
  HADITH_API_BASE_URL: pick("HADITH_API_BASE_URL"),

  // ── Facebook ──────────────────────────────────────────────────────────────
  FACEBOOK_APP_ID: pick("FACEBOOK_APP_ID"),
  FACEBOOK_APP_SECRET: pick("FACEBOOK_APP_SECRET"),
  FACEBOOK_PAGE_ACCESS_TOKEN: pick("FACEBOOK_PAGE_ACCESS_TOKEN"),
  FACEBOOK_PAGE_ID: pick("FACEBOOK_PAGE_ID"),
  FACEBOOK_GRAPH_API_VERSION: pick("FACEBOOK_GRAPH_API_VERSION") || "v26.0",
};

const validatedEnv = rawEnv;

export function getPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL:
      validatedEnv.NEXT_PUBLIC_SUPABASE_URL || validatedEnv.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      validatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    NEXT_PUBLIC_SITE_URL: validatedEnv.NEXT_PUBLIC_SITE_URL || "",
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      validatedEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
    NEXT_PUBLIC_GTM_ID: validatedEnv.NEXT_PUBLIC_GTM_ID || "",
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    SUPABASE_URL: validatedEnv.SUPABASE_URL || validatedEnv.NEXT_PUBLIC_SUPABASE_URL || "",
    SUPABASE_SERVICE_ROLE_KEY: validatedEnv.SUPABASE_SERVICE_ROLE_KEY || "",
    CLOUDINARY_CLOUD_NAME: validatedEnv.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: validatedEnv.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: validatedEnv.CLOUDINARY_API_SECRET || "",
    AUTH_CALLBACK_URL: validatedEnv.AUTH_CALLBACK_URL || "",
    GEMINI_API_KEY: validatedEnv.GEMINI_API_KEY || "",
    GEMINI_MODEL: validatedEnv.GEMINI_MODEL || "gemini-2.5-flash",
    HADITH_API_BASE_URL:
      validatedEnv.HADITH_API_BASE_URL || "https://ummahapi.com/api/hadith",
    YOUTUBE_API_KEY: validatedEnv.YOUTUBE_API_KEY || "",
    YOUTUBE_CLIENT_ID: validatedEnv.YOUTUBE_CLIENT_ID || "",
    YOUTUBE_CLIENT_SECRET: validatedEnv.YOUTUBE_CLIENT_SECRET || "",
    YOUTUBE_CHANNEL_ID: validatedEnv.YOUTUBE_CHANNEL_ID || "",
    YOUTUBE_REFRESH_TOKEN: validatedEnv.YOUTUBE_REFRESH_TOKEN || "",
    FACEBOOK_APP_ID: validatedEnv.FACEBOOK_APP_ID || "",
    FACEBOOK_APP_SECRET: validatedEnv.FACEBOOK_APP_SECRET || "",
    FACEBOOK_PAGE_ACCESS_TOKEN: validatedEnv.FACEBOOK_PAGE_ACCESS_TOKEN || "",
    FACEBOOK_PAGE_ID: validatedEnv.FACEBOOK_PAGE_ID || "",
    FACEBOOK_GRAPH_API_VERSION:
      validatedEnv.FACEBOOK_GRAPH_API_VERSION || "v26.0",
  };
}

export function getEnvAudit() {
  return {
    public: [
      "SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
      "NEXT_PUBLIC_GTM_ID",
    ],
    serverOnly: [
      "SUPABASE_SERVICE_ROLE_KEY",
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_CLIENT_SECRET",
      "YOUTUBE_REFRESH_TOKEN",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "FACEBOOK_PAGE_ACCESS_TOKEN",
    ],
    runtimeServer: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "AUTH_CALLBACK_URL",
      "GEMINI_API_KEY",
      "GEMINI_MODEL",
      "YOUTUBE_API_KEY",
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_CLIENT_SECRET",
      "YOUTUBE_CHANNEL_ID",
      "YOUTUBE_REFRESH_TOKEN",
      "FACEBOOK_APP_ID",
      "FACEBOOK_APP_SECRET",
      "FACEBOOK_PAGE_ACCESS_TOKEN",
      "FACEBOOK_PAGE_ID",
      "FACEBOOK_GRAPH_API_VERSION",
    ],
    optionalIntegrations: [
      "HADITH_API_BASE_URL",
      "YOUTUBE_API_KEY",
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_CLIENT_SECRET",
      "YOUTUBE_CHANNEL_ID",
      "YOUTUBE_REFRESH_TOKEN",
      "GEMINI_API_KEY",
      "GEMINI_MODEL",
      "FACEBOOK_APP_ID",
      "FACEBOOK_APP_SECRET",
      "FACEBOOK_PAGE_ACCESS_TOKEN",
      "FACEBOOK_PAGE_ID",
      "FACEBOOK_GRAPH_API_VERSION",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ],
  } as const;
}
