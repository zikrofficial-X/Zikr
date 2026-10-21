import { getServerEnv } from "@/lib/env";
import { supabaseServerAdminRequest } from "@/lib/supabase/admin-rest";

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
export async function readStoredFacebookCredential(): Promise<StoredFacebookCredential | null> {
  try {
    const rows = await supabaseServerAdminRequest<StoredFacebookCredential[]>(
      `/rest/v1/social_platform_credentials?platform=eq.facebook&select=${CREDENTIAL_FIELDS}&limit=1`,
    );
    return Array.isArray(rows) ? rows[0] ?? null : null;
  } catch {
    // Preview projects can temporarily lack the additive cooldown migration. Fall
    // back to established columns so OAuth connectivity still works.
    try {
      const rows = await supabaseServerAdminRequest<Omit<StoredFacebookCredential, "facebook_reels_next_allowed_at">[]>(
        `/rest/v1/social_platform_credentials?platform=eq.facebook&select=${LEGACY_CREDENTIAL_FIELDS}&limit=1`,
      );
      const row = Array.isArray(rows) ? rows[0] : null;
      return row ? { ...row, facebook_reels_next_allowed_at: null } : null;
    } catch {
      // Never log exceptions because provider responses can contain sensitive context.
      return null;
    }
  }
}

export async function getFacebookReelsRateLimitedUntil(): Promise<string | null> {
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

export async function clearFacebookReelsCooldown(): Promise<void> {
  try {
    await supabaseServerAdminRequest(
      "/rest/v1/social_platform_credentials?platform=eq.facebook",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          facebook_reels_next_allowed_at: null,
          updated_at: new Date().toISOString(),
        }),
      },
    );
  } catch {
    // A successful external post remains successful if only cooldown cleanup fails.
  }
}
export async function getFacebookPageCredentials(): Promise<FacebookPageCredentials> {
  // Outbound publishing uses only the validated Supabase credential. A server-side
  // environment token is never used directly; the admin must explicitly validate and
  // import it through adoptServerConfiguredFacebookPageToken first.
  const stored = await readStoredFacebookCredential();
  if (!stored) {
    throw new Error(
      "Facebook Page is not connected through the OAuth-managed publishing center. Reconnect the Page from the admin publishing center.",
    );
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
      safeMessage: "اتصال Facebook موجود لكن الصلاحيات المطلوبة للنشر غير مكتملة. أعد الربط ووافق على pages_show_list وpages_read_engagement وpages_manage_posts.",
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
    await supabaseServerAdminRequest(
      "/rest/v1/social_platform_credentials?platform=eq.facebook",
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
  const stored = await readStoredFacebookCredential();
  const envPageId = env.FACEBOOK_PAGE_ID?.trim() ?? "";
  const envToken = env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ?? "";
  const hasEnvironmentToken = Boolean(envPageId && envToken);

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
  const required = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];
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

export async function unblockFacebookAuthBlockedQueue(): Promise<number> {
  const rows = await supabaseServerAdminRequest<Array<{
    id: string;
    target_platforms: string[] | null;
    metadata: Record<string, unknown> | null;
    status: string;
  }>>(
    "/rest/v1/social_publish_queue?status=in.(failed,partial)&select=id,target_platforms,metadata,status&order=updated_at.asc&limit=250",
  );
  let released = 0;
  for (const item of rows ?? []) {
    const metadata = item.metadata ?? {};
    const targets = item.target_platforms ?? [];
    if (metadata.authBlocked !== true || !targets.some(p => p === "facebook" || p === "facebook_reels")) continue;
    const now = new Date().toISOString();
    const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
      `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=eq.${encodeURIComponent(item.status)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify({
          status: "queued",
          scheduled_at: now,
          published_at: null,
          error_message: null,
          metadata: {
            ...metadata,
            authBlocked: false,
            attempts: 0,
            nextRetryAt: null,
            reauthorizedAt: now,
          },
          updated_at: now,
        }),
      },
    );
    if (Array.isArray(updated) && updated[0]?.id) released += 1;
  }
  return released;
}
