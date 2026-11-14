import type { SocialPlatformEnvironment } from "./platform-availability";
import { findYouTubeChannelAcrossPages, getYouTubeRefreshToken } from "./youtube-oauth-credentials";

export type YouTubePublishingHealthStatus =
  | "not_configured"
  | "connected"
  | "public_data_only"
  | "reauthorization_required"
  | "permission_missing"
  | "channel_not_found"
  | "channel_selection_required"
  | "unavailable";

export type YouTubeChannelReadSource = "oauth" | "api_key" | null;

export type YouTubePublishingConnectionHealth = {
  status: YouTubePublishingHealthStatus;
  readSource: YouTubeChannelReadSource;
  channelId: string | null;
  channelName: string | null;
  subscribers: number | null;
  totalViews: number | null;
  videoCount: number | null;
  checkedAt: string;
  message: string;
};

type TokenResponse = { access_token?: string; error?: string };
type ChannelStatistics = { subscriberCount?: string; videoCount?: string; viewCount?: string };
type ChannelResponse = {
  items?: Array<{ id?: string; snippet?: { title?: string }; statistics?: ChannelStatistics }>;
  nextPageToken?: string;
  error?: { errors?: Array<{ reason?: string }> };
};

export function classifyYouTubeHealthHttpStatus(status: number, endpoint: "token" | "channel"): YouTubePublishingHealthStatus {
  if (status === 400 || status === 401) return "reauthorization_required";
  if (status === 403 && endpoint === "channel") return "permission_missing";
  if (status === 404 && endpoint === "channel") return "channel_not_found";
  return "unavailable";
}

function result(
  status: YouTubePublishingHealthStatus,
  message: string,
  channelId: string | null = null,
  channelName: string | null = null,
  statistics?: ChannelStatistics,
  readSource: YouTubeChannelReadSource = null,
): YouTubePublishingConnectionHealth {
  const count = (value: string | undefined) =>
    typeof value === "string" && /^\d+$/.test(value) ? Number(value) : null;

  return {
    status,
    readSource,
    channelId,
    channelName,
    subscribers: count(statistics?.subscriberCount),
    totalViews: count(statistics?.viewCount),
    videoCount: count(statistics?.videoCount),
    checkedAt: new Date().toISOString(),
    message,
  };
}

/**
 * Reads only fields that YouTube exposes publicly for a known channel ID.
 * The API key is read server-side and is never returned or logged.
 */
async function readPublicChannel(
  env: SocialPlatformEnvironment,
  fetcher: typeof fetch,
  reason: "oauth_missing" | "reauthorization_required" | "permission_missing",
): Promise<YouTubePublishingConnectionHealth | null> {
  const apiKey = env.YOUTUBE_API_KEY?.trim();
  const channelId = env.YOUTUBE_CHANNEL_ID?.trim();
  if (!apiKey || !channelId) return null;

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "id,snippet,statistics");
    url.searchParams.set("id", channelId);
    url.searchParams.set("key", apiKey);
    const response = await fetcher(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;

    const channels = await response.json() as ChannelResponse;
    const channel = channels.items?.find((item) => item.id === channelId);
    if (!channel?.id) {
      return result("channel_not_found", "مفتاح YouTube API يعمل، لكن رقم القناة المحدد لم يُرجع قناة عامة.", channelId);
    }

    const reasonMessage = reason === "oauth_missing"
      ? "OAuth الخاص بالنشر غير مكتمل؛ تم عرض بيانات القناة العامة فقط."
      : reason === "reauthorization_required"
        ? "تمت قراءة بيانات القناة العامة، لكن OAuth الخاص بالنشر يحتاج إعادة تفويض."
        : "تمت القراءة العامة للقناة باستخدام مفتاح API؛ صلاحية OAuth لقراءة القناة وتقارير Analytics غير ممنوحة.";

    return result(
      "public_data_only",
      reasonMessage,
      channel.id,
      channel.snippet?.title ?? null,
      channel.statistics,
      "api_key",
    );
  } catch {
    return null;
  }
}

/**
 * Read-only health check. It prefers OAuth; if channel-read scope is absent,
 * it falls back to the configured public API key + channel ID. It never
 * uploads, edits, publishes, returns or logs OAuth credentials or API keys.
 */
export async function getYouTubePublishingConnectionHealth(
  env: SocialPlatformEnvironment = process.env,
  fetcher: typeof fetch = fetch,
  resolveReadOnlyRefreshToken: () => Promise<string | null> = () => getYouTubeRefreshToken(env),
): Promise<YouTubePublishingConnectionHealth> {
  const clientId = env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = env.YOUTUBE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    const publicRead = await readPublicChannel(env, fetcher, "oauth_missing");
    return publicRead ?? result("not_configured", "بيانات OAuth الخاصة بـYouTube غير مكتملة.");
  }

  let refreshToken: string | null;
  try {
    refreshToken = await resolveReadOnlyRefreshToken();
  } catch {
    const publicRead = await readPublicChannel(env, fetcher, "oauth_missing");
    return publicRead ?? result("unavailable", "تعذر قراءة اعتماد YouTube المحفوظ. أعد الاختبار لاحقًا؛ لم يتم تغيير حالة النشر.");
  }
  if (!refreshToken) {
    const publicRead = await readPublicChannel(env, fetcher, "oauth_missing");
    return publicRead ?? result("not_configured", "بيانات OAuth الخاصة بـYouTube غير مكتملة.");
  }

  try {
    const tokenResponse = await fetcher("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!tokenResponse.ok) {
      const status = classifyYouTubeHealthHttpStatus(tokenResponse.status, "token");
      if (status === "reauthorization_required") {
        const publicRead = await readPublicChannel(env, fetcher, "reauthorization_required");
        if (publicRead) return publicRead;
      }
      return result(status, status === "reauthorization_required"
        ? "Google رفض تحديث رمز YouTube؛ أعد تفويض القناة."
        : "تعذر الوصول إلى خدمة OAuth الخاصة بـGoogle حاليًا.");
    }
    const token = await tokenResponse.json() as TokenResponse;
    if (typeof token.access_token !== "string" || !token.access_token) {
      const publicRead = await readPublicChannel(env, fetcher, "reauthorization_required");
      return publicRead ?? result("reauthorization_required", "لم يُرجع Google رمز وصول صالحًا؛ أعد تفويض القناة.");
    }

    const configuredChannelId = env.YOUTUBE_CHANNEL_ID?.trim() ?? "";
    const channelLookup = await findYouTubeChannelAcrossPages(async (pageToken) => {
      const url = new URL("https://www.googleapis.com/youtube/v3/channels");
      url.searchParams.set("part", "id,snippet,statistics");
      url.searchParams.set("mine", "true");
      url.searchParams.set("maxResults", "50");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const channelResponse = await fetcher(url, {
        headers: { Authorization: "Bearer " + token.access_token },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000),
      });
      const channels = await channelResponse.json().catch(() => ({})) as ChannelResponse;
      if (!channelResponse.ok || channels.error) {
        return {
          items: [],
          error: {
            status: channelResponse.status,
            reason: channels.error?.errors?.[0]?.reason ?? null,
          },
        };
      }
      return {
        items: Array.isArray(channels.items) ? channels.items : [],
        nextPageToken: channels.nextPageToken,
      };
    }, configuredChannelId, 3);

    if (channelLookup.error) {
      const status = channelLookup.error.reason === "insufficientPermissions"
        ? "permission_missing"
        : classifyYouTubeHealthHttpStatus(channelLookup.error.status, "channel");
      if (status === "permission_missing" || status === "reauthorization_required") {
        const publicRead = await readPublicChannel(
          env,
          fetcher,
          status === "permission_missing" ? "permission_missing" : "reauthorization_required",
        );
        if (publicRead) return publicRead;
      }
      return result(status, status === "permission_missing"
        ? "صلاحية OAuth لقراءة ملف القناة غير متاحة، وتعذر استخدام القراءة العامة. تحقق من YOUTUBE_API_KEY وتفعيل YouTube Data API v3."
        : status === "reauthorization_required"
          ? "انتهت صلاحية OAuth أو تم رفضها؛ أعد تفويض YouTube."
          : "تعذر قراءة ملف قناة YouTube حاليًا.");
    }

    if (!channelLookup.channel?.id) {
      if (!channelLookup.complete) {
        return result(
          "unavailable",
          "تعذر فحص جميع القنوات المرتبطة بالحساب ضمن الحد الآمن للصفحات؛ تحقق من YOUTUBE_CHANNEL_ID ثم أعد الاختبار.",
        );
      }
      if (!configuredChannelId && channelLookup.multipleChannels) {
        return result(
          "channel_selection_required",
          "يرتبط حساب Google بأكثر من قناة YouTube؛ اضبط YOUTUBE_CHANNEL_ID على القناة المقصودة ثم أعد تفويضها.",
        );
      }
      const publicRead = await readPublicChannel(env, fetcher, "permission_missing");
      return publicRead ?? result(
        "channel_not_found",
        configuredChannelId
          ? "القناة المحددة في YOUTUBE_CHANNEL_ID غير موجودة ضمن القنوات التي أعادها OAuth."
          : "OAuth صالح، لكن الحساب لم يُرجع قناة YouTube مرتبطة.",
        configuredChannelId || null,
      );
    }
    const channel = channelLookup.channel;
    return result(
      "connected",
      "تم تحديث OAuth والتحقق من قناة YouTube بنجاح.",
      channel.id,
      channel.snippet?.title ?? null,
      channel.statistics,
      "oauth",
    );
  } catch {
    return result("unavailable", "تعذر اختبار اتصال YouTube بسبب مهلة أو خطأ اتصال مؤقت.");
  }
}
