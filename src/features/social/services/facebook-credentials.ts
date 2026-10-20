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
};

export type FacebookPageCredentials = {
  pageId: string;
  pageName: string | null;
  accessToken: string;
  isEnabled: boolean;
  source: Exclude<FacebookCredentialSource, "missing">;
  expiresAt: string | null;
  connectionStatus: FacebookConnectionStatus;
};

export type FacebookConnectionHealth = {
  facebookEnabled: boolean;
  facebookCredentialsConfigured: boolean;
  facebookConnectionStatus: FacebookConnectionStatus;
  facebookPageName: string | null;
  facebookTokenSource: FacebookCredentialSource;
  facebookLastCheckedAt: string | null;
  facebookTokenExpiresAt: string | null;
  facebookConnectionMessage: string;
};

const CREDENTIAL_FIELDS =
  "platform,page_id,page_name,page_access_token,is_enabled,token_type,expires_at,granted_permissions,connection_status,last_validated_at,last_error_code,last_error_message,connected_at,updated_at";

function siteGraphVersion() {
  return getServerEnv().FACEBOOK_GRAPH_API_VERSION || "v26.0";
}

/**
 * The DB record is the canonical credential once the administrator completes OAuth.
 * The environment credential remains a migration/backward-compatibility fallback only.
 */
export async function readStoredFacebookCredential(): Promise<StoredFacebookCredential | null> {
  try {
    const rows = await supabaseServerAdminRequest<StoredFacebookCredential[]>(
      `/rest/v1/social_platform_credentials?platform=eq.facebook&select=${CREDENTIAL_FIELDS}&limit=1`,
    );
    return Array.isArray(rows) ? rows[0] ?? null : null;
  } catch {
    // During deployment, the additive migration may not yet exist in every preview.
    // Never log the exception because provider responses can contain sensitive context.
    return null;
  }
}

export async function getFacebookPageCredentials(): Promise<FacebookPageCredentials> {
  const stored = await readStoredFacebookCredential();
  if (stored) {
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
    };
  }

  const env = getServerEnv();
  const pageId = env.FACEBOOK_PAGE_ID?.trim() ?? "";
  const accessToken = env.FACEBOOK_PAGE_ACCESS_TOKEN?.trim() ?? "";
  if (!pageId || !accessToken) {
    throw new Error("Facebook Page is not connected. Use the Facebook connect button in the admin publishing center.");
  }
  return {
    pageId,
    pageName: null,
    accessToken,
    isEnabled: env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === "true",
    source: "environment",
    expiresAt: null,
    connectionStatus: env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === "true" ? "connected" : "disabled",
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
  const pageId = stored?.page_id ?? envPageId;
  const accessToken = stored?.page_access_token ?? envToken;
  const source: FacebookCredentialSource = stored ? "database" : pageId && accessToken ? "environment" : "missing";
  const enabled = stored ? stored.is_enabled === true : env.SOCIAL_PUBLISH_FACEBOOK_ENABLED === "true";
  const configured = Boolean(pageId && accessToken);

  const base: FacebookConnectionHealth = {
    facebookEnabled: enabled,
    facebookCredentialsConfigured: configured,
    facebookConnectionStatus: !configured ? "not_connected" : enabled ? "error" : "disabled",
    facebookPageName: stored?.page_name ?? null,
    facebookTokenSource: source,
    facebookLastCheckedAt: stored?.last_validated_at ?? null,
    facebookTokenExpiresAt: stored?.expires_at ?? null,
    facebookConnectionMessage: !configured
      ? "اربط صفحة Facebook من هنا مرة واحدة لتشغيل النشر التلقائي."
      : enabled
        ? "يتم اختبار اتصال Facebook الآن."
        : "بيانات Facebook موجودة، لكن النشر الآلي لم يُفعّل من خلال اتصال OAuth بعد.",
  };
  if (!configured) return base;

  if (stored?.expires_at && Number.isFinite(Date.parse(stored.expires_at)) && Date.parse(stored.expires_at) <= Date.now()) {
    const safeMessage = "انتهت صلاحية رمز الصفحة. اضغط «ربط/تجديد Facebook» لإعادة التفويض.";
    await persistValidation(stored, "reauthorization_required", safeMessage, "190");
    return { ...base, facebookConnectionStatus: "reauthorization_required", facebookConnectionMessage: safeMessage };
  }

  try {
    const url = new URL(`https://graph.facebook.com/${siteGraphVersion()}/${encodeURIComponent(pageId)}`);
    url.searchParams.set("fields", "id,name");
    url.searchParams.set("access_token", accessToken);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
    const body = await response.json().catch(() => ({})) as {
      id?: unknown;
      name?: unknown;
      error?: { code?: unknown; message?: unknown };
    };
    if (!response.ok || body.error || String(body.id ?? "") !== pageId) {
      const code = body.error?.code == null ? null : String(body.error.code);
      const result = classifyGraphFailure(code, String(body.error?.message ?? ""));
      if (stored) await persistValidation(stored, result.status, result.safeMessage, code);
      return {
        ...base,
        facebookConnectionStatus: result.status,
        facebookConnectionMessage: result.safeMessage,
      };
    }
    const status: FacebookConnectionStatus = enabled ? "connected" : "disabled";
    const checkedAt = new Date().toISOString();
    if (stored) await persistValidation(stored, status, null, null);
    return {
      ...base,
      facebookConnectionStatus: status,
      facebookPageName: String(body.name ?? stored?.page_name ?? "صفحة Facebook"),
      facebookLastCheckedAt: checkedAt,
      facebookConnectionMessage: enabled
        ? "اتصال Facebook صالح؛ سيعالج الناشر العناصر تلقائيًا كل 15 دقيقة."
        : "تم التحقق من الصفحة، لكن النشر معطّل حتى إكمال الربط من زر مركز النشر.",
    };
  } catch {
    return {
      ...base,
      facebookConnectionStatus: "error",
      facebookConnectionMessage: "تعذر الوصول إلى Meta للتحقق من الاتصال. لم يتم إيقاف الجدولة التلقائية؛ أعد الاختبار بعد قليل.",
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
