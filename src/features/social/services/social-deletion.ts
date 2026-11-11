import { getServerEnv } from "@/lib/env";
import { getYouTubeRefreshToken } from "@/features/social/services/youtube-oauth-credentials";
import { getFacebookPageCredentials } from "@/features/social/services/facebook-credentials";

export type SocialDeletionPlatform = "youtube" | "facebook" | "facebook_reels";
type DeletionEnvironment = {
  YOUTUBE_CLIENT_ID?: string;
  YOUTUBE_CLIENT_SECRET?: string;
  YOUTUBE_REFRESH_TOKEN?: string;
  FACEBOOK_GRAPH_API_VERSION?: string;
};

type FacebookCredentials = {
  pageId: string;
  accessToken: string;
  isEnabled: boolean;
};

type DeleteDependencies = {
  env?: DeletionEnvironment;
  fetcher?: typeof fetch;
  resolveYouTubeRefreshToken?: (env: DeletionEnvironment) => Promise<string | null>;
  getFacebookCredentials?: () => Promise<FacebookCredentials>;
};

type OAuthTokenResponse = {
  access_token?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

function assertYouTubeVideoId(remoteId: string) {
  if (!/^[A-Za-z0-9_-]{11}$/.test(remoteId)) {
    throw new Error("معرّف فيديو YouTube غير صالح؛ لم يتم إرسال طلب حذف.");
  }
}

function assertFacebookObjectId(remoteId: string) {
  if (!/^[0-9_]{8,128}$/.test(remoteId) || remoteId.startsWith("_") || remoteId.endsWith("_")) {
    throw new Error("معرّف منشور Facebook غير صالح؛ لم يتم إرسال طلب حذف.");
  }
}

async function youtubeAccessToken(
  env: DeletionEnvironment,
  fetcher: typeof fetch,
  resolveRefreshToken: (env: DeletionEnvironment) => Promise<string | null>,
): Promise<string> {
  const clientId = env.YOUTUBE_CLIENT_ID?.trim();
  const clientSecret = env.YOUTUBE_CLIENT_SECRET?.trim();
  const refreshToken = (await resolveRefreshToken(env))?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("حذف فيديو YouTube يحتاج بيانات العميل على Vercel واعتماد OAuth مخزنًا على Supabase بصلاحية حذف صريحة.");
  }

  const response = await fetcher("https://oauth2.googleapis.com/token", {
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
  const payload = await response.json().catch(() => ({})) as OAuthTokenResponse;
  if (!response.ok || !payload.access_token) {
    throw new Error(response.status === 400 || response.status === 401
      ? "رمز YouTube يحتاج إعادة تفويض قبل الحذف. لم يتم حذف الفيديو."
      : "تعذر إنشاء جلسة OAuth لحذف فيديو YouTube.");
  }

  const grantedScopes = payload.scope?.split(/\s+/).filter(Boolean) ?? [];
  const hasDeleteScope = grantedScopes.some((scope) =>
    scope === "https://www.googleapis.com/auth/youtube" ||
    scope === "https://www.googleapis.com/auth/youtube.force-ssl" ||
    scope === "https://www.googleapis.com/auth/youtubepartner",
  );
  if (!hasDeleteScope) {
    // Fail closed: a missing scope list is not evidence of delete permission.
    // YouTube videos.delete requires an explicit destructive-capability scope.
    throw new Error("لم يُثبت رمز YouTube صلاحية الحذف المطلوبة؛ يجب أن يحتوي نطاق OAuth صراحةً على youtube.force-ssl أو youtube أو youtubepartner. لم يُرسل طلب حذف.");
  }
  return payload.access_token;
}

/**
 * Deletes only the remote post/video identified by the queue's successful
 * provider ledger. It never removes the queue row or the stored audit record.
 */
export async function deleteSocialPlatformPost(
  platform: SocialDeletionPlatform,
  remoteId: string,
  dependencies: DeleteDependencies = {},
): Promise<{ platform: SocialDeletionPlatform; remoteId: string; deletedAt: string }> {
  const id = remoteId.trim();
  if (!id) throw new Error("معرّف المنشور غير محفوظ؛ لم يتم تنفيذ الحذف.");

  const env = dependencies.env ?? getServerEnv();
  const fetcher = dependencies.fetcher ?? fetch;

  if (platform === "youtube") {
    assertYouTubeVideoId(id);
    const resolveRefreshToken = dependencies.resolveYouTubeRefreshToken ??
      (async value => getYouTubeRefreshToken(value));
    const accessToken = await youtubeAccessToken(env, fetcher, resolveRefreshToken);
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("id", id);
    const response = await fetcher(url, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + accessToken },
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status === 403) {
      throw new Error("رفض YouTube الحذف؛ يلزم أن يكون الفيديو تابعًا للقناة وأن يملك OAuth نطاق youtube.force-ssl أو youtube.");
    }
    if (response.status === 404) {
      throw new Error("فيديو YouTube غير موجود أو لم يعد متاحًا على القناة.");
    }
    if (!response.ok && response.status !== 204) {
      throw new Error("فشل حذف فيديو YouTube (HTTP " + response.status + ").");
    }
    return { platform, remoteId: id, deletedAt: new Date().toISOString() };
  }

  assertFacebookObjectId(id);
  const loadCredentials = dependencies.getFacebookCredentials ?? getFacebookPageCredentials;
  const credentials = await loadCredentials();
  if (!credentials.isEnabled || !credentials.pageId || !credentials.accessToken) {
    throw new Error("اتصال صفحة Facebook غير مفعّل؛ أعد ربط الصفحة قبل الحذف.");
  }

  const version = env.FACEBOOK_GRAPH_API_VERSION?.trim() || "v26.0";
  const url = new URL("https://graph.facebook.com/" + version + "/" + encodeURIComponent(id));
  const response = await fetcher(url, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + credentials.accessToken },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  const payload = await response.json().catch(() => ({})) as { success?: boolean; error?: { code?: number; message?: string } };
  if (response.status === 403 || payload.error?.code === 10 || payload.error?.code === 200) {
    throw new Error("رفض Meta حذف المنشور؛ تحقق من صلاحية pages_manage_posts وملكية المنشور للصفحة المتصلة.");
  }
  if (!response.ok || payload.success !== true) {
    throw new Error("لم تؤكد Meta حذف منشور Facebook (HTTP " + response.status + ").");
  }

  return { platform, remoteId: id, deletedAt: new Date().toISOString() };
}
