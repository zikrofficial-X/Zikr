import type { SocialPlatformEnvironment } from "./platform-availability";

export type YouTubePublishingHealthStatus =
  | "not_configured"
  | "connected"
  | "reauthorization_required"
  | "permission_missing"
  | "channel_not_found"
  | "unavailable";

export type YouTubePublishingConnectionHealth = {
  status: YouTubePublishingHealthStatus;
  channelId: string | null;
  channelName: string | null;
  subscribers: number | null;
  totalViews: number | null;
  videoCount: number | null;
  checkedAt: string;
  message: string;
};

type TokenResponse = { access_token?: string; error?: string };
type ChannelResponse = { items?: Array<{ id?: string; snippet?: { title?: string }; statistics?: { subscriberCount?: string; videoCount?: string; viewCount?: string } }>; error?: { errors?: Array<{ reason?: string }> } };

export function classifyYouTubeHealthHttpStatus(status: number, endpoint: "token" | "channel"): YouTubePublishingHealthStatus {
  if (status === 400 || status === 401) return "reauthorization_required";
  if (status === 403 && endpoint === "channel") return "permission_missing";
  if (status === 404 && endpoint === "channel") return "channel_not_found";
  return "unavailable";
}

function result(status: YouTubePublishingHealthStatus, message: string, channelId: string | null = null, channelName: string | null = null, statistics?: { subscribers?: string; totalViews?: string; videoCount?: string }): YouTubePublishingConnectionHealth {
  const count = (value: string | undefined) => value && /^\\d+$/.test(value) ? Number(value) : null;
  return { status, channelId, channelName, subscribers: count(statistics?.subscribers), totalViews: count(statistics?.totalViews), videoCount: count(statistics?.videoCount), checkedAt: new Date().toISOString(), message };
}

/**
 * Read-only OAuth health check for the YouTube channel. It never uploads,
 * edits, or publishes content, and never returns/logs OAuth credentials.
 */
export async function getYouTubePublishingConnectionHealth(
  env: SocialPlatformEnvironment = process.env,
  fetcher: typeof fetch = fetch,
): Promise<YouTubePublishingConnectionHealth> {
  const clientId = env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = env.YOUTUBE_CLIENT_SECRET?.trim();
  const refreshToken = env.YOUTUBE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    return result("not_configured", "بيانات OAuth الخاصة بـYouTube غير مكتملة.");
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
      return result(status, status === "reauthorization_required"
        ? "Google رفض تحديث رمز YouTube؛ أعد تفويض القناة."
        : "تعذر الوصول إلى خدمة OAuth الخاصة بـGoogle حاليًا.");
    }
    const token = await tokenResponse.json() as TokenResponse;
    if (typeof token.access_token !== "string" || !token.access_token) {
      return result("reauthorization_required", "لم يُرجع Google رمز وصول صالحًا؛ أعد تفويض القناة.");
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/channels");
    url.searchParams.set("part", "id,snippet,statistics");
    url.searchParams.set("mine", "true");
    const channelResponse = await fetcher(url, {
      headers: { Authorization: "Bearer " + token.access_token },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!channelResponse.ok) {
      const status = classifyYouTubeHealthHttpStatus(channelResponse.status, "channel");
      return result(status, status === "permission_missing"
        ? "تم تحديث OAuth، لكن صلاحية قراءة ملف القناة غير متاحة. هذا الفحص تشخيصي ولا يوقف Facebook."
        : status === "reauthorization_required"
          ? "انتهت صلاحية OAuth أو تم رفضها؛ أعد تفويض YouTube."
          : "تعذر قراءة ملف قناة YouTube حاليًا.");
    }
    const channels = await channelResponse.json() as ChannelResponse;
    const channel = channels.items?.[0];
    if (!channel?.id) return result("channel_not_found", "OAuth صالح، لكن الحساب لم يُرجع قناة YouTube مرتبطة.");
    return result("connected", "تم تحديث OAuth والتحقق من قناة YouTube بنجاح.", channel.id, channel.snippet?.title ?? null, { subscribers: channel.statistics?.subscriberCount, totalViews: channel.statistics?.viewCount, videoCount: channel.statistics?.videoCount });
  } catch {
    return result("unavailable", "تعذر اختبار اتصال YouTube بسبب مهلة أو خطأ اتصال مؤقت.");
  }
}
