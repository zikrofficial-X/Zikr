import { getServerEnv } from "@/lib/env";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";
import { buildFacebookQueueRecoveryFilter, buildFacebookQueueRecoveryPatch, resolveSocialPublishCutoff } from "@/features/social/services/facebook-queue-recovery-policy";

export type FacebookCredentialSource = "database" | "environment" | "missing";
export type FacebookConnectionStatus =
  | "connected"
  | "disabled"
  | "not_connected"
  | "reauthorization_required"
  | "permission_error"
  | "error";

export type StoredFacebookCredential = {
  platform: "facebook";
  page_id: string;
  page_name: string | null;
  page_access_token: string;
  is_enabled: boolean;
  token_type: string;
  expires_at: string | null;
  granted_permissions: string[] | null;
  connection_status: FacebookConnectionStatus;
  last_validated_at: string | null;
  last_error_code: string | null;
  last_error_message: string | null;
  connected_at: string | null;
  updated_at: string | null;
  facebook_reels_next_allowed_at: string | null;
};

export type FacebookPageCredentials = {
  pageId: string;
  pageName: string | null;
  accessToken: string;
  isEnabled: boolean;
  source: Exclude<FacebookCredentialSource, "missing">;
  expiresAt: string | null;
  connectionStatus: FacebookConnectionStatus;
  reelsNextAllowedAt: string | null;
};

export type FacebookConnectionHealth = {
  facebookEnabled: boolean;
  facebookCredentialsConfigured: boolean;
  facebookEnvironmentTokenConfigured: boolean;
  facebookConnectionStatus: FacebookConnectionStatus;
  facebookPageName: string | null;
  facebookTokenSource: FacebookCredentialSource;
  facebookLastCheckedAt: string | null;
  facebookTokenExpiresAt: string | null;
  facebookConnectionMessage: string;
  facebookInsightsPermissionGranted: boolean;
};

const LEGACY_CREDENTIAL_FIELDS =
  "platform,page_id,page_name,page_access_token,is_enabled,token_type,expires_at,granted_permissions,connection_status,last_validated_at,last_error_code,last_error_message,connected_at,updated_at";
const CREDENTIAL_FIELDS = `${LEGACY_CREDENTIAL_FIELDS},facebook_reels_next_allowed_at`;

function siteGraphVersion() {
  return getServerEnv().FACEBOOK_GRAPH_API_VERSION || "v26.0";
}

/**
 * The Supabase row is the only credential used by publishing workers.
 * A Vercel environment token may be explicitly imported by an administrator after
 * app identity, expiry, required scopes, and target Page are verified server-side.
 * Merely changing an environment variable never silently changes the active credential.
 */
type FacebookCredentialRequest = <T>(path: string) => Promise<T>;
type FacebookCredentialReader = () => Promise<StoredFacebookCredential | null>;

export function isMissingFacebookReelsCooldownColumnError(error: unknown): boolean {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return message.includes("facebook_reels_next_allowed_at") && (
    message.includes("42703") ||
    message.includes("pgrst204") ||
    /column[\s\S]*(does not exist|schema cache)/.test(message)
  );
}

export function buildFacebookCredentialValidationFilter(
  credential: Pick<StoredFacebookCredential, "page_id" | "updated_at">,
): string | null {
  const pageId = credential.page_id.trim();
  const updatedAt = credential.updated_at?.trim() ?? "";
  if (!pageId || !updatedAt || !Number.isFinite(Date.parse(updatedAt))) return null;
  return `platform=eq.facebook&page_id=eq.${encodeURIComponent(pageId)}&updated_at=eq.${encodeURIComponent(updatedAt)}`;
}

export async function readStoredFacebookCredential(
  request: FacebookCredentialRequest = supabaseServerAdminRequest,
): Promise<StoredFacebookCredential | null> {
  let rows: StoredFacebookCredential[];
  try {
    rows = await request<StoredFacebookCredential[]>(
      `/rest/v1/social_platform_credentials?platform=eq.facebook&select=${CREDENTIAL_FIELDS}&limit=1`,
    );
  } catch (error) {
    // Only a missing additive cooldown column justifies the legacy projection.
    // Network, permission, and server errors must not erase cooldown state.
    if (!isMissingFacebookReelsCooldownColumnError(error)) throw error;
    const legacyRows = await request<Omit<StoredFacebookCredential, "facebook_reels_next_allowed_at">[]>(
      `/rest/v1/social_platform_credentials?platform=eq.facebook&select=${LEGACY_CREDENTIAL_FIELDS}&limit=1`,
    );
    if (!Array.isArray(legacyRows)) {
      throw new Error("Legacy Facebook credential query returned an invalid row set.");
    }
    const row = legacyRows[0] ?? null;
    return row ? { ...row, facebook_reels_next_allowed_at: null } : null;
  }
  if (!Array.isArray(rows)) {
    throw new Error("Facebook credential query returned an invalid row set.");
  }
  return rows[0] ?? null;
}

export async function getFacebookReelsNextAllowedAt(): Promise<string | null> {
  const stored = await readStoredFacebookCredential();
  return stored?.facebook_reels_next_allowed_at ?? null;
}

export async function setFacebookReelsNextAllowedAt(until: string): Promise<void> {
  await supabaseServerAdminRequest(
    "/rest/v1/social_platform_credentials?platform=eq.facebook",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        facebook_reels_next_allowed_at: until,
        updated_at: new Date().toISOString(),
      }),
    },
  );
}

export class FacebookPageNotConnectedError extends Error {
  constructor() {
    super("Facebook Page is not connected through the OAuth-managed publishing center. Reconnect the Page from the admin publishing center.");
    this.name = "FacebookPageNotConnectedError";
  }
}

export async function getFacebookPageCredentials(
  readCredential: FacebookCredentialReader = readStoredFacebookCredential,
): Promise<FacebookPageCredentials> {
  // Outbound publishing uses only the validated Supabase credential. A server-side
  // environment token is never used directly; the admin must explicitly validate and
  // import it through adoptServerConfiguredFacebookPageToken first.
  const stored = await readCredential();
  if (!stored) {
    throw new FacebookPageNotConnectedError();
  }

  if (stored.expires_at && Number.isFinite(Date.parse(stored.expires_at)) && Date.parse(stored.expires_at) <= Date.now()) {
    throw new Error("Facebook access token has expired. Reconnect the Page from the admin publishing center.");
  }
  if (stored.connection_status === "reauthorization_required") {
    throw new Error("Facebook access token requires reauthorization. Reconnect the Page from the admin publishing center.");
  }
  if (stored.connection_status === "permission_error") {
    throw new Error("Facebook access token is missing required Page permissions. Reconnect the Page from the admin publishing center.");
  }

  return {
    pageId: stored.page_id,
    pageName: stored.page_name,
    accessToken: stored.page_access_token,
    isEnabled: stored.is_enabled === true,
    source: "database",
    expiresAt: stored.expires_at,
    connectionStatus: stored.connection_status,
    reelsNextAllowedAt: stored.facebook_reels_next_allowed_at,
  };
}

export async function getOptionalFacebookPageCredentials(
  readCredential: FacebookCredentialReader = readStoredFacebookCredential,
): Promise<FacebookPageCredentials | null> {
  try {
    return await getFacebookPageCredentials(readCredential);
  } catch (error) {
    if (error instanceof FacebookPageNotConnectedError) return null;
    throw error;
  }
}

function classifyGraphFailure(code: string | null, message: string): {
  status: "reauthorization_required" | "permission_error" | "error";
  safeMessage: string;
} {
  const normalized = message.toLowerCase();
  if (
    code === "190" ||
    normalized.includes("session has expired") ||
    normalized.includes("error validating access token") ||
    normalized.includes("invalid oauth access token") ||
    normalized.includes("access token has expired")
  ) {
    return {
      status: "reauthorization_required",
      safeMessage: "انتهت صلاحية اتصال Facebook أو أُلغيت. اضغط «ربط/تجديد Facebook» مرة واحدة لإعادة التفويض؛ سيعود النشر الآلي بعد نجاح الاختبار.",
    };
  }
  if (code === "10" || code === "200" || normalized.includes("permission")) {
    return {
      status: "permission_error",
      safeMessage: "اتصال Facebook موجود لكن الصلاحيات المطلوبة للنشر والإحصاءات غير مكتملة. أعد الربط ووافق على pages_show_list وpages_read_engagement وpages_manage_posts وread_insights.",
    };
  }
  return {
    status: "error",
    safeMessage: "تعذر التحقق من Facebook الآن. أعد الاختبار لاحقًا؛ لم يتم تغيير حالة النشر.",
  };
}

async function persistValidation(
  credential: StoredFacebookCredential,
  status: FacebookConnectionStatus,
  message: string | null,
  code: string | null,
) {
  try {
    const filter = buildFacebookCredentialValidationFilter(credential);
    if (!filter) return;
    await supabaseServerAdminRequest(
      `/rest/v1/social_platform_credentials?${filter}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          connection_status: status,
          last_validated_at: status === "connected" || status === "disabled" ? new Date().toISOString() : credential.last_validated_at,
          last_error_code: code,
          last_error_message: message,
          updated_at: new Date().toISOString(),
        }),
      },
    );
  } catch {
    // A health check must not fail solely because diagnostic metadata could not be saved.
  }
}

export async function getFacebookPageConnectionHealth(): Promise<FacebookConnectionHealth> {
  const env = getServerEnv();
  const envPageId = env.FACEBOOK_PAGE_ID?.trim() ?? "";
  const envToken = env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ?? "";
  const hasEnvironmentToken = Boolean(envPageId && envToken);
  let stored: StoredFacebookCredential | null;
  try {
    stored = await readStoredFacebookCredential();
  } catch {
    return {
      facebookEnabled: false,
      facebookCredentialsConfigured: false,
      facebookEnvironmentTokenConfigured: hasEnvironmentToken,
      facebookConnectionStatus: "error",
      facebookPageName: null,
      facebookTokenSource: hasEnvironmentToken ? "environment" : "missing",
      facebookLastCheckedAt: null,
      facebookTokenExpiresAt: null,
      facebookInsightsPermissionGranted: false,
      facebookConnectionMessage: "تعذر قراءة اعتماد Facebook من قاعدة البيانات. أعد الاختبار لاحقًا؛ لم يتم تغيير حالة النشر.",
    };
  }

  // A token configured in Vercel is not the active publishing credential until
  // an administrator validates and imports it into the server-only credentials table.
  // Do not probe it here and misreport a stale legacy token as the active connection.
  if (!stored) {
    return {
      facebookEnabled: false,
      facebookCredentialsConfigured: false,
      facebookEnvironmentTokenConfigured: hasEnvironmentToken,
      facebookConnectionStatus: "not_connected",
      facebookPageName: null,
      facebookTokenSource: hasEnvironmentToken ? "environment" : "missing",
      facebookLastCheckedAt: null,
      facebookTokenExpiresAt: null,
      facebookInsightsPermissionGranted: false,
      facebookConnectionMessage: hasEnvironmentToken
        ? "يوجد توكن في إعدادات الخادم، لكنه غير محفوظ ضمن اعتماد النشر النشط. اضغط «اعتماد توكن الخادم» للتحقق من التطبيق والصفحة والصلاحيات ثم تفعيله دون كشف التوكن."
        : "لا يوجد اعتماد Facebook نشط. اربط الصفحة عبر OAuth أو أضف توكن صفحة إلى إعدادات الخادم ثم اضغط «اعتماد توكن الخادم».",
    };
  }

  const enabled = stored.is_enabled === true;
  const base: FacebookConnectionHealth = {
    facebookEnabled: enabled,
    facebookCredentialsConfigured: Boolean(stored.page_id && stored.page_access_token),
    facebookEnvironmentTokenConfigured: hasEnvironmentToken,
    facebookConnectionStatus: enabled ? "error" : "disabled",
    facebookPageName: stored.page_name,
    facebookTokenSource: "database",
    facebookLastCheckedAt: stored.last_validated_at,
    facebookTokenExpiresAt: stored.expires_at,
    facebookInsightsPermissionGranted: (stored.granted_permissions ?? []).includes("read_insights"),
    facebookConnectionMessage: enabled
      ? "يتم اختبار اعتماد Facebook النشط."
      : "اعتماد الصفحة موجود، لكن النشر معطّل.",
  };

  if (
    stored.expires_at &&
    Number.isFinite(Date.parse(stored.expires_at)) &&
    Date.parse(stored.expires_at) <= Date.now()
  ) {
    const message = "انتهت صلاحية اعتماد الصفحة المحفوظ. أعد ربط Facebook أو اعتمد توكن الخادم الحالي.";
    await persistValidation(stored, "reauthorization_required", message, "190");
    return {
      ...base,
      facebookConnectionStatus: "reauthorization_required",
      facebookConnectionMessage: message,
    };
  }

  try {
    const url = new URL(
      "https://graph.facebook.com/" +
        siteGraphVersion() +
        "/" +
        encodeURIComponent(stored.page_id),
    );
    url.searchParams.set("fields", "id,name");
    url.searchParams.set("access_token", stored.page_access_token);
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const body = (await response.json().catch(() => ({}))) as {
      id?: unknown;
      name?: unknown;
      error?: { code?: unknown; message?: unknown };
    };

    if (!response.ok || body.error || String(body.id ?? "") !== stored.page_id) {
      const code = body.error?.code == null ? null : String(body.error.code);
      const result = classifyGraphFailure(code, String(body.error?.message ?? ""));
      await persistValidation(stored, result.status, result.safeMessage, code);
      return {
        ...base,
        facebookConnectionStatus: result.status,
        facebookConnectionMessage: result.safeMessage,
      };
    }

    const checkedAt = new Date().toISOString();
    const status: FacebookConnectionStatus = enabled ? "connected" : "disabled";
    await persistValidation(stored, status, null, null);
    return {
      ...base,
      facebookConnectionStatus: status,
      facebookPageName: String(body.name ?? stored.page_name ?? "Facebook Page"),
      facebookLastCheckedAt: checkedAt,
      facebookConnectionMessage: enabled
        ? "اعتماد Facebook صالح؛ سيعالج الناشر العناصر المؤهلة تلقائيًا كل 15 دقيقة."
        : "تم التحقق من الصفحة، لكن النشر معطّل. فعّل الاتصال من مركز النشر.",
    };
  } catch {
    return {
      ...base,
      facebookConnectionStatus: "error",
      facebookConnectionMessage: "تعذر الوصول إلى Meta للتحقق من الاعتماد النشط. أعد الاختبار لاحقًا.",
    };
  }
}

export type FacebookPublicProfile = {
  externalId: string | null;
  name: string;
  pageUrl: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  followersCount: number | null;
  likesCount: number | null;
};

export async function saveFacebookPublicProfile(input: {
  pageId: string;
  pageName: string;
}): Promise<void> {
  const now = new Date().toISOString();
  await supabaseServerAdminRequest(
    "/rest/v1/social_platform_profiles?on_conflict=platform",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        platform: "facebook",
        external_id: input.pageId,
        handle: null,
        name: input.pageName,
        description: "",
        category: "media",
        website: null,
        avatar_url: null,
        cover_url: null,
        page_url: "https://www.facebook.com/" + encodeURIComponent(input.pageId),
        subscribers_count: null,
        followers_count: null,
        likes_count: null,
        following_count: null,
        view_count: null,
        video_count: null,
        synced_at: now,
        status: "ok",
        last_error: null,
        updated_at: now,
      }),
    },
  );
}

export async function getFacebookPublicProfile(): Promise<FacebookPublicProfile | null> {
  try {
    const rows = await supabaseServerAdminRequest<Array<{
      external_id: string | null;
      name: string;
      page_url: string;
      avatar_url: string | null;
      cover_url: string | null;
      followers_count: number | null;
      likes_count: number | null;
    }>>(
      "/rest/v1/social_platform_profiles?platform=eq.facebook&select=external_id,name,page_url,avatar_url,cover_url,followers_count,likes_count&limit=1",
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    return {
      externalId: row.external_id,
      name: row.name,
      pageUrl: row.page_url,
      avatarUrl: row.avatar_url,
      coverUrl: row.cover_url,
      followersCount: row.followers_count,
      likesCount: row.likes_count,
    };
  } catch {
    return null;
  }
}

export async function saveFacebookPageCredential(input: {
  pageId: string;
  pageName: string;
  accessToken: string;
  expiresAt?: string | null;
  grantedPermissions: string[];
}) {
  const now = new Date().toISOString();
  await supabaseServerAdminRequest("/rest/v1/social_platform_credentials?on_conflict=platform", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      platform: "facebook",
      page_id: input.pageId,
      page_name: input.pageName,
      page_access_token: input.accessToken,
      is_enabled: true,
      token_type: "page",
      expires_at: input.expiresAt ?? null,
      granted_permissions: input.grantedPermissions,
      connection_status: "connected",
      last_validated_at: now,
      last_error_code: null,
      last_error_message: null,
      connected_at: now,
      updated_at: now,
    }),
  });
}

export async function adoptServerConfiguredFacebookPageToken(): Promise<{
  pageId: string;
  pageName: string;
  expiresAt: string | null;
  grantedPermissions: string[];
}> {
  const env = getServerEnv();
  const pageId = env.FACEBOOK_PAGE_ID?.trim() ?? "";
  const accessToken = env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ?? "";
  const appId = env.FACEBOOK_APP_ID?.trim() ?? "";
  const appSecret = env.FACEBOOK_APP_SECRET?.trim() ?? "";

  if (!pageId || !accessToken) {
    throw new Error("إعدادات الخادم لا تحتوي FACEBOOK_PAGE_ID وFACEBOOK_PAGE_ACCESS_TOKEN معًا.");
  }
  if (!appId || !appSecret) {
    throw new Error("يلزم ضبط FACEBOOK_APP_ID وFACEBOOK_APP_SECRET للتحقق الآمن من التوكن.");
  }

  const graphBase = "https://graph.facebook.com/" + siteGraphVersion() + "/";
  const debugUrl = new URL(graphBase + "debug_token");
  debugUrl.searchParams.set("input_token", accessToken);
  debugUrl.searchParams.set("access_token", appId + "|" + appSecret);

  let debugResponse: Response;
  let debugBody: {
    data?: {
      app_id?: unknown;
      is_valid?: unknown;
      expires_at?: unknown;
      scopes?: unknown;
    };
    error?: { code?: unknown; message?: unknown };
  };
  try {
    debugResponse = await fetch(debugUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    debugBody = (await debugResponse.json().catch(() => ({}))) as typeof debugBody;
  } catch {
    throw new Error("تعذر الوصول إلى Meta للتحقق من توكن الخادم. لم يتم حفظه أو تغيير الطابور.");
  }

  if (!debugResponse.ok || debugBody.error || !debugBody.data) {
    const code = debugBody.error?.code == null ? "" : String(debugBody.error.code);
    if (code === "190") {
      throw new Error("Meta رفض توكن الخادم الحالي. راجع التوكن في Vercel ثم أعد المحاولة.");
    }
    throw new Error("تعذر التحقق من توكن الخادم مع تطبيق Meta. لم يتم تغيير بيانات النشر.");
  }

  const data = debugBody.data;
  if (data.is_valid !== true) {
    throw new Error("توكن الخادم غير صالح أو تم إلغاؤه. لم يتم حفظه.");
  }
  if (String(data.app_id ?? "") !== appId) {
    throw new Error("التوكن صادر عن تطبيق Meta مختلف عن FACEBOOK_APP_ID الحالي.");
  }

  const permissions = Array.isArray(data.scopes)
    ? data.scopes.filter((value): value is string => typeof value === "string")
    : [];
  const required = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "read_insights"];
  const missing = required.filter((permission) => !permissions.includes(permission));
  if (missing.length) {
    throw new Error("توكن الخادم صالح، لكن صلاحيات النشر ناقصة: " + missing.join("، ") + ". أعد تفويض التطبيق مع هذه الصلاحيات.");
  }

  const expirySeconds = Number(data.expires_at ?? 0);
  if (Number.isFinite(expirySeconds) && expirySeconds > 0 && expirySeconds * 1000 <= Date.now()) {
    throw new Error("توكن الخادم منتهي الصلاحية. استبدله بتوكن صفحة صالح ثم أعد المحاولة.");
  }

  const pageUrl = new URL(graphBase + encodeURIComponent(pageId));
  pageUrl.searchParams.set("fields", "id,name");
  pageUrl.searchParams.set("access_token", accessToken);

  let pageResponse: Response;
  let pageBody: {
    id?: unknown;
    name?: unknown;
    error?: { code?: unknown; message?: unknown };
  };
  try {
    pageResponse = await fetch(pageUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    pageBody = (await pageResponse.json().catch(() => ({}))) as typeof pageBody;
  } catch {
    throw new Error("تعذر التحقق من صفحة Facebook المحددة. لم يتم حفظ التوكن.");
  }

  if (!pageResponse.ok || pageBody.error || String(pageBody.id ?? "") !== pageId) {
    const code = pageBody.error?.code == null ? "" : String(pageBody.error.code);
    if (code === "190") {
      throw new Error("Meta رفض توكن الصفحة الحالي. تأكد أنك وضعت Page Access Token وليس User Token.");
    }
    if (code === "10" || code === "200") {
      throw new Error("التوكن لا يملك صلاحية الوصول المطلوبة إلى الصفحة. راجع صلاحيات Meta وإمكانية إدارة الصفحة.");
    }
    throw new Error("التوكن لا يستطيع الوصول إلى Page ID المحدد. تحقق من FACEBOOK_PAGE_ID والتوكن معًا.");
  }

  const pageName = String(pageBody.name ?? "Facebook Page");
  const expiresAt =
    Number.isFinite(expirySeconds) && expirySeconds > 0
      ? new Date(expirySeconds * 1000).toISOString()
      : null;

  // Store the server-only value only after app, token, permissions, and target Page validate.
  await saveFacebookPageCredential({
    pageId,
    pageName,
    accessToken,
    expiresAt,
    grantedPermissions: permissions,
  });

  return { pageId, pageName, expiresAt, grantedPermissions: permissions };
}

type FacebookAuthBlockedQueueRow = {
  id: string;
  target_platforms: string[] | null;
  metadata: Record<string, unknown> | null;
  status: string;
  updated_at: string | null;
  created_at: string | null;
};

export async function unblockFacebookAuthBlockedQueue(): Promise<number> {
  const pageSize = 250;
  let cursor: string | null = null;
  let released = 0;

  // Filter to explicitly auth-blocked rows and use a stable UUID cursor. Updating
  // a row removes it from this query, so offset pagination would skip later rows.
  while (true) {
    const cursorFilter: string = cursor === null ? "" : "&id=gt." + encodeURIComponent(cursor);
    const publishAfter = resolveSocialPublishCutoff(process.env.SOCIAL_PUBLISH_AFTER);
    const rows: FacebookAuthBlockedQueueRow[] = await supabaseServerAdminRequest<FacebookAuthBlockedQueueRow[]>(
      "/rest/v1/social_publish_queue?status=in.(failed,partial)&metadata->>authBlocked=eq.true&created_at=gte." +
        encodeURIComponent(publishAfter) +
        "&select=id,target_platforms,metadata,status,updated_at,created_at&order=id.asc&limit=" +
        pageSize + cursorFilter,
    );
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const item of rows as FacebookAuthBlockedQueueRow[]) {
      cursor = item.id;
      const now = new Date().toISOString();
      const patch = buildFacebookQueueRecoveryPatch(item.metadata, item.target_platforms ?? [], now);
      const filter = buildFacebookQueueRecoveryFilter(item, publishAfter);
      if (!patch || !filter) continue;
      const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
        "/rest/v1/social_publish_queue?" + filter,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify(patch),
        },
      );
      if (Array.isArray(updated) && updated[0]?.id) released += 1;
    }

    if (rows.length < pageSize) break;
  }

  return released;
}
