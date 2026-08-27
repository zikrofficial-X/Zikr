import { enforceCanonicalProductionUrl, PRODUCTION_URL } from "@/lib/site";

// ─── Numbered-suffix env var resolution ──────────────────────────────────────
// Vercel integrations expose vars as NAME_2, NAME_19, NAME_22, etc. when
// multiple projects share the same account. `pick` resolves any base name by
// trying the bare name first, then each known numeric suffix, so the rest of
// the app always sees clean names regardless of how Vercel provisioned them.
// Priority: bare name → _2 → _3 → _19 → _20 → _22

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

// Vercel can suffix duplicated integration variables with any numeric suffix.
// Resolve the bare key first, then deterministic numeric aliases that actually
// exist in the project instead of maintaining a stale hand-written list.
const SUFFIXES = Object.keys(e)
  .map(key => key.match(/_(\d+)$/)?.[1])
  .filter((suffix): suffix is string => Boolean(suffix))
  .sort((a, b) => Number(a) - Number(b))
  .map(suffix => `_${suffix}`);

/** Resolve the first non-empty value across the given base names + suffixes. */
function pick(...bases: string[]): string | undefined {
  for (const base of bases) {
    const bareValue = e[base];
    if (bareValue !== undefined && bareValue !== "") return bareValue;

    for (const suffix of SUFFIXES) {
      const value = e[`${base}${suffix}`];
      if (value !== undefined && value !== "") return value;
    }
  }
  return undefined;
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

  // ── PostgreSQL / Database ──────────────────────────────────────────────────
  POSTGRES_URL: pick("POSTGRES_URL"),
  POSTGRES_PRISMA_URL: pick("POSTGRES_PRISMA_URL"),
  POSTGRES_URL_NON_POOLING: pick("POSTGRES_URL_NON_POOLING"),
  POSTGRES_USER: pick("POSTGRES_USER"),
  POSTGRES_HOST: pick("POSTGRES_HOST"),
  POSTGRES_PASSWORD: pick("POSTGRES_PASSWORD"),
  // POSTGRES_DATABASE falls back to the user name (common in Supabase setups).
  POSTGRES_DATABASE: pick("POSTGRES_DATABASE", "POSTGRES_USER"),

  // ── DATABASE_URL ──────────────────────────────────────────────────────────
  DATABASE_URL: pick(
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING"
  ),

  // ── Supabase ──────────────────────────────────────────────────────────────
  // The public URL and anon key are intentionally public; the service-role key
  // remains server-only and is never returned by getPublicEnv(). Accept both
  // app-facing NEXT_PUBLIC_* names and Supabase integration names.
  NEXT_PUBLIC_SUPABASE_URL: normalizeSupabaseUrl(
    pick("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: pick(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_ANON_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_KEY"
  ),
  SUPABASE_SERVICE_ROLE_KEY: pick(
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY"
  ),

  // ── Cloudinary (server-only authenticated uploads) ─────────────────────────
  CLOUDINARY_CLOUD_NAME: pick("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: pick("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: pick("CLOUDINARY_API_SECRET"),

  // ── Site / Auth ───────────────────────────────────────────────────────────
  // NEXT_PUBLIC_SITE_URL: use the known production URL when the env var is empty
  NEXT_PUBLIC_SITE_URL: siteUrl,
  // AUTH_CALLBACK_URL is this app's callback route used as Supabase redirectTo.
  // The Supabase provider callback (https://<project>.supabase.co/auth/v1/callback)
  // belongs in Google Cloud/Supabase provider settings, not in Vercel app env.
  // Guard against a mis-provisioned value pointing at the Supabase provider
  // callback: such a value would break OAuth, so fall back to the app callback.
  AUTH_CALLBACK_URL: resolveAppCallbackUrl(pick("AUTH_CALLBACK_URL"), siteUrl),

  // ── Google OAuth ──────────────────────────────────────────────────────────
  // Supabase hosts the actual OAuth provider, but keeping these values in the
  // app env lets deployment checks catch mismatched Google/Supabase settings
  // before users hit /auth/google.
  GOOGLE_CLIENT_ID: pick("GOOGLE_CLIENT_ID", "NEXT_PUBLIC_GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: pick("GOOGLE_CLIENT_SECRET"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: pick(
    "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_ID"
  ),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: pick("NEXT_PUBLIC_GA_MEASUREMENT_ID"),

  // ── YouTube ───────────────────────────────────────────────────────────────
  YOUTUBE_API_KEY: pick("YOUTUBE_API_KEY"),
  YOUTUBE_CHANNEL_ID: pick("YOUTUBE_CHANNEL_ID"),
  YOUTUBE_REFRESH_TOKEN: pick("YOUTUBE_REFRESH_TOKEN"),

  // ── Gemini AI ─────────────────────────────────────────────────────────────
  GEMINI_API_KEY: pick("GEMINI_API_KEY"),
  GEMINI_MODEL: pick("GEMINI_MODEL") || "gemini-2.5-flash",

  // ── Quran / Islamic content APIs ──────────────────────────────────────────
  QURAN_API_BASE_URL: pick("QURAN_API_BASE_URL", "NEXT_PUBLIC_QURAN_API"),
  QURAN_AUDIO_CDN_URL:
    pick("QURAN_AUDIO_CDN_URL") || "https://cdn.islamic.network/quran/audio",
  HADITH_API_BASE_URL: pick("HADITH_API_BASE_URL", "NEXT_PUBLIC_HADITH_API"),
  NEXT_PUBLIC_QURAN_API:
    pick("NEXT_PUBLIC_QURAN_API", "QURAN_API_BASE_URL") ||
    "https://api.alquran.cloud/v1",
  NEXT_PUBLIC_HADITH_API:
    pick("NEXT_PUBLIC_HADITH_API", "HADITH_API_BASE_URL") ||
    "https://ummahapi.com/api/hadith",

  // ── Facebook ──────────────────────────────────────────────────────────────
  FACEBOOK_APP_ID: pick("FACEBOOK_APP_ID"),
  FACEBOOK_APP_SECRET: pick("FACEBOOK_APP_SECRET"),
  FACEBOOK_PAGE_ACCESS_TOKEN: pick("FACEBOOK_PAGE_ACCESS_TOKEN"),
  FACEBOOK_PAGE_ID: pick("FACEBOOK_PAGE_ID"),
};

const validatedEnv = rawEnv;

export function getPublicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: validatedEnv.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      validatedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    NEXT_PUBLIC_SITE_URL: validatedEnv.NEXT_PUBLIC_SITE_URL || "",
    NEXT_PUBLIC_GOOGLE_CLIENT_ID:
      validatedEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      validatedEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID || "",
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    SUPABASE_SERVICE_ROLE_KEY: validatedEnv.SUPABASE_SERVICE_ROLE_KEY || "",
    CLOUDINARY_CLOUD_NAME: validatedEnv.CLOUDINARY_CLOUD_NAME || "",
    CLOUDINARY_API_KEY: validatedEnv.CLOUDINARY_API_KEY || "",
    CLOUDINARY_API_SECRET: validatedEnv.CLOUDINARY_API_SECRET || "",
    DATABASE_URL: validatedEnv.DATABASE_URL || "",
    AUTH_CALLBACK_URL: validatedEnv.AUTH_CALLBACK_URL || "",
    GEMINI_API_KEY: validatedEnv.GEMINI_API_KEY || "",
    GEMINI_MODEL: validatedEnv.GEMINI_MODEL || "gemini-2.5-flash",
    QURAN_API_BASE_URL:
      validatedEnv.QURAN_API_BASE_URL || "https://api.alquran.cloud/v1",
    QURAN_AUDIO_CDN_URL:
      validatedEnv.QURAN_AUDIO_CDN_URL ||
      "https://cdn.islamic.network/quran/audio",
    HADITH_API_BASE_URL:
      validatedEnv.HADITH_API_BASE_URL || "https://ummahapi.com/api/hadith",
    YOUTUBE_API_KEY: validatedEnv.YOUTUBE_API_KEY || "",
    YOUTUBE_CHANNEL_ID: validatedEnv.YOUTUBE_CHANNEL_ID || "",
    YOUTUBE_REFRESH_TOKEN: validatedEnv.YOUTUBE_REFRESH_TOKEN || "",
    GOOGLE_CLIENT_ID: validatedEnv.GOOGLE_CLIENT_ID || "",
    GOOGLE_CLIENT_SECRET: validatedEnv.GOOGLE_CLIENT_SECRET || "",
    FACEBOOK_APP_ID: validatedEnv.FACEBOOK_APP_ID || "",
    FACEBOOK_APP_SECRET: validatedEnv.FACEBOOK_APP_SECRET || "",
    FACEBOOK_PAGE_ACCESS_TOKEN: validatedEnv.FACEBOOK_PAGE_ACCESS_TOKEN || "",
    FACEBOOK_PAGE_ID: validatedEnv.FACEBOOK_PAGE_ID || "",
  };
}

export function getScriptEnv() {
  return {
    DATABASE_URL: validatedEnv.DATABASE_URL,
  };
}

export function getEnvAudit() {
  return {
    public: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID",
      "NEXT_PUBLIC_GA_MEASUREMENT_ID",
    ],
    serverOnly: [
      "SUPABASE_SERVICE_ROLE_KEY",
      "GOOGLE_CLIENT_SECRET",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ],
    runtimeServer: [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SITE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
      "DATABASE_URL",
      "AUTH_CALLBACK_URL",
      "GEMINI_API_KEY",
      "GEMINI_MODEL",
      "YOUTUBE_API_KEY",
      "YOUTUBE_CHANNEL_ID",
      "YOUTUBE_REFRESH_TOKEN",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "FACEBOOK_APP_ID",
      "FACEBOOK_APP_SECRET",
      "FACEBOOK_PAGE_ACCESS_TOKEN",
      "FACEBOOK_PAGE_ID",
    ],
    scriptsOnly: ["DATABASE_URL"],
    optionalIntegrations: [
      "QURAN_API_BASE_URL",
      "QURAN_AUDIO_CDN_URL",
      "HADITH_API_BASE_URL",
      "YOUTUBE_API_KEY",
      "YOUTUBE_CHANNEL_ID",
      "YOUTUBE_REFRESH_TOKEN",
      "GEMINI_API_KEY",
      "GEMINI_MODEL",
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "FACEBOOK_APP_ID",
      "FACEBOOK_APP_SECRET",
      "FACEBOOK_PAGE_ACCESS_TOKEN",
      "FACEBOOK_PAGE_ID",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ],
  } as const;
}
