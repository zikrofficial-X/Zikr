import { enforceCanonicalProductionUrl, PRODUCTION_URL } from "@/lib/site";

// `process` is not polyfilled in browser bundles, so a bare `process.env`
// object reference throws `ReferenceError: process is not defined` if this
// module ever gets pulled into a client bundle (e.g. transitively via a
// 'use client' component). Guard the full env object for server-only use,
// and read NEXT_PUBLIC_* values via direct literal `process.env.NEXT_PUBLIC_X`
// access below — Next.js inlines those at build time, so they stay correct
// (and safe) in the browser too.
const e: Record<string, string | undefined> =
  typeof process !== "undefined" ? process.env : {};

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

// Direct literal reads so Next.js inlines these at build time for client
// bundles instead of falling back to the guarded `e` object above.
const NEXT_PUBLIC_SUPABASE_URL_RAW = process.env.NEXT_PUBLIC_SUPABASE_URL || undefined;
const NEXT_PUBLIC_SUPABASE_ANON_KEY_RAW =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  undefined;
const NEXT_PUBLIC_SITE_URL_RAW = process.env.NEXT_PUBLIC_SITE_URL || undefined;
const NEXT_PUBLIC_GA_MEASUREMENT_ID_RAW = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined;
const NEXT_PUBLIC_GTM_ID_RAW = process.env.NEXT_PUBLIC_GTM_ID || undefined;

const siteUrl = enforceCanonicalProductionUrl(
  NEXT_PUBLIC_SITE_URL_RAW || PRODUCTION_URL
);

/**
 * Return this app's own OAuth callback URL.
 * Ignores a mis-provisioned value that points at the Supabase provider
 * callback (`https://<project>.supabase.co/auth/v1/callback`) — using that as
 * the app `redirectTo` would break the OAuth code exchange.
 */
function resolveAppCallbackUrl(
  _configured: string | undefined,
  site: string,
): string {
  // Production OAuth is permanently pinned to the canonical public origin.
  // The native custom-scheme callback is handled separately by the native flow.
  void site;
  return PRODUCTION_URL.replace(/\/$/, "") + "/auth/callback";
}
const rawEnv: Record<string, string | undefined> = {
  ...e,

  // ── Supabase ──────────────────────────────────────────────────────────────
  SUPABASE_URL: normalizeSupabaseUrl(pick("SUPABASE_URL")),
  NEXT_PUBLIC_SUPABASE_URL: normalizeSupabaseUrl(
    NEXT_PUBLIC_SUPABASE_URL_RAW || pick("NEXT_PUBLIC_SUPABASE_URL") || pick("SUPABASE_URL")
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    NEXT_PUBLIC_SUPABASE_ANON_KEY_RAW || pick("NEXT_PUBLIC_SUPABASE_ANON_KEY") || pick("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: pick("SUPABASE_SERVICE_ROLE_KEY"),

  // ── Cloudinary ───────────────────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: pick("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: pick("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: pick("CLOUDINARY_API_SECRET"),

  // ── Site / Auth ───────────────────────────────────────────────────────────
  NEXT_PUBLIC_SITE_URL: siteUrl,
  AUTH_CALLBACK_URL: resolveAppCallbackUrl(pick("AUTH_CALLBACK_URL"), siteUrl),

  NEXT_PUBLIC_GA_MEASUREMENT_ID:
    NEXT_PUBLIC_GA_MEASUREMENT_ID_RAW || pick("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
  NEXT_PUBLIC_GTM_ID: NEXT_PUBLIC_GTM_ID_RAW || pick("NEXT_PUBLIC_GTM_ID"),

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
  GEMINI_MODEL: pick("GEMINI_MODEL") || "gemini-3.1-flash-lite",

  // ── Islamic content API ───────────────────────────────────────────────────
  HADITH_API_BASE_URL: pick("HADITH_API_BASE_URL"),

  // ── Facebook ──────────────────────────────────────────────────────────────
  FACEBOOK_APP_ID: pick("FACEBOOK_APP_ID"),
  FACEBOOK_APP_SECRET: pick("FACEBOOK_APP_SECRET"),
  FACEBOOK_PAGE_ACCESS_TOKEN: pick("FACEBOOK_PAGE_ACCESS_TOKEN"),
  FACEBOOK_PAGE_ID: pick("FACEBOOK_PAGE_ID"),
  SOCIAL_PUBLISH_FACEBOOK_ENABLED: pick("SOCIAL_PUBLISH_FACEBOOK_ENABLED"),
  FACEBOOK_GRAPH_API_VERSION: pick("FACEBOOK_GRAPH_API_VERSION") || "v26.0",

  // ── Runtime / media / publishing ─────────────────────────────────────────
  AI_GATEWAY_API_KEY: pick("AI_GATEWAY_API_KEY"),
  NEXT_PUBLIC_ADSENSE_CLIENT: pick("NEXT_PUBLIC_ADSENSE_CLIENT"),
  NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: pick("NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL"),
  INTERNAL_JOB_SECRET: pick("INTERNAL_JOB_SECRET"),
  YOUTUBE_SYNC_SECRET: pick("YOUTUBE_SYNC_SECRET"),
  WEBHOOK_SECRET: pick("WEBHOOK_SECRET"),
  ANDROID_APP_LINKS_SHA256: pick("ANDROID_APP_LINKS_SHA256"),
  IOS_ASSOCIATED_DOMAIN_APP_ID: pick("IOS_ASSOCIATED_DOMAIN_APP_ID"),
  YOUTUBE_UPLOAD_PRIVACY: pick("YOUTUBE_UPLOAD_PRIVACY"),
  HF_TOKEN: pick("HF_TOKEN"),
  HF_VIDEO_PROVIDER_TIMEOUT_MS: pick("HF_VIDEO_PROVIDER_TIMEOUT_MS"),
  HF_WAN_SPACE: pick("HF_WAN_SPACE"),
  HF_LTX_FAST_SPACE: pick("HF_LTX_FAST_SPACE"),
  HF_WAN_VIDEO_ENABLED: pick("HF_WAN_VIDEO_ENABLED"),
  HF_LTX_FAST_VIDEO_ENABLED: pick("HF_LTX_FAST_VIDEO_ENABLED"),
  HF_VIDEO_PYTHON: pick("HF_VIDEO_PYTHON"),
  ARABIC_TTS_PYTHON: pick("ARABIC_TTS_PYTHON"),
  FREE_VIDEO_PROVIDER_URL: pick("FREE_VIDEO_PROVIDER_URL"),
  FREE_VIDEO_PROVIDER_TOKEN: pick("FREE_VIDEO_PROVIDER_TOKEN"),
  COMFYUI_BASE_URL: pick("COMFYUI_BASE_URL"),
  COMFYUI_TIMEOUT_MS: pick("COMFYUI_TIMEOUT_MS"),
  COMFYUI_MODEL: pick("COMFYUI_MODEL"),
  COMFYUI_LTX_WORKFLOW_JSON: pick("COMFYUI_LTX_WORKFLOW_JSON"),
  COMFYUI_WAN_WORKFLOW_JSON: pick("COMFYUI_WAN_WORKFLOW_JSON"),
  GITHUB_TOKEN: pick("GITHUB_TOKEN") || pick("GH_TOKEN"),

  // ── Feature flags / operations ───────────────────────────────────────────
  KIDS_CONTENT_SHAREABLE: pick("KIDS_CONTENT_SHAREABLE"),
  KIDS_FACEBOOK_SHARE_ENABLED: pick("KIDS_FACEBOOK_SHARE_ENABLED"),
  KIDS_YOUTUBE_INTEGRATION_ENABLED: pick("KIDS_YOUTUBE_INTEGRATION_ENABLED"),
  NATIVE_SOCIAL_SYNC_ENABLED: pick("NATIVE_SOCIAL_SYNC_ENABLED"),
  NEXT_PUBLIC_KIDS_CONTENT_SHAREABLE: pick("NEXT_PUBLIC_KIDS_CONTENT_SHAREABLE"),
  NEXT_PUBLIC_KIDS_SHARE_MESSAGE: pick("NEXT_PUBLIC_KIDS_SHARE_MESSAGE"),
  SOCIAL_BACKGROUND_BATCH_SIZE: pick("SOCIAL_BACKGROUND_BATCH_SIZE"),
  SOCIAL_PUBLISH_ENABLED: pick("SOCIAL_PUBLISH_ENABLED"),
  VIDEO_AUTO_PUBLISH: pick("VIDEO_AUTO_PUBLISH"),
  VIDEO_BACKGROUND_BATCH_SIZE: pick("VIDEO_BACKGROUND_BATCH_SIZE"),
  VIDEO_GENERATOR: pick("VIDEO_GENERATOR"),
  VIDEO_PUBLISH_SCHEDULE: pick("VIDEO_PUBLISH_SCHEDULE"),
  PUSH_CONTACT: pick("PUSH_CONTACT"),
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
    GEMINI_MODEL: validatedEnv.GEMINI_MODEL || "gemini-3.1-flash-lite",
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
    SOCIAL_PUBLISH_FACEBOOK_ENABLED: validatedEnv.SOCIAL_PUBLISH_FACEBOOK_ENABLED || "false",
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
