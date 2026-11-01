import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { enforceAdminRateLimit } from "@/features/admin/services/rate-limit";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";
import {
  adoptServerConfiguredFacebookPageToken,
  getFacebookPageConnectionHealth,
  unblockFacebookAuthBlockedQueue,
} from "@/features/social/services/facebook-credentials";

export const dynamic = "force-dynamic";

type QueueItem = {
  id: string;
  content_type: string;
  content_id: string | null;
  title: string;
  target_platforms: string[];
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  updated_at?: string;
};

const retryableStatuses = new Set(["failed", "partial"]);

function successfulPlatforms(
  metadata: Record<string, unknown> | null | undefined
): Set<string> {
  const values = metadata?.platformResults;
  const result = new Set<string>();

  if (values && typeof values === "object" && !Array.isArray(values)) {
    for (const [platform, value] of Object.entries(values)) {
      if (!value || typeof value !== "object") continue;
      const row = value as {
        platform?: unknown;
        ok?: unknown;
        remoteId?: unknown;
      };
      if (
        row.ok === true &&
        typeof row.remoteId === "string" &&
        row.remoteId.length > 0 &&
        (row.platform === undefined || row.platform === platform)
      ) {
        result.add(platform);
      }
    }
    return result;
  }

  if (Array.isArray(values)) {
    for (const value of values) {
      if (!value || typeof value !== "object") continue;
      const row = value as {
        platform?: unknown;
        ok?: unknown;
        remoteId?: unknown;
      };
      if (
        row.ok === true &&
        typeof row.platform === "string" &&
        typeof row.remoteId === "string" &&
        row.remoteId.length > 0
      ) {
        result.add(row.platform);
      }
    }
  }

  return result;
}

function authBlockedPlatforms(
  metadata: Record<string, unknown> | null | undefined
): Set<string> {
  const values = metadata?.platformResults;
  const result = new Set<string>();
  if (!values || typeof values !== "object" || Array.isArray(values))
    return result;

  for (const [platform, value] of Object.entries(values)) {
    if (!value || typeof value !== "object") continue;
    const row = value as { ok?: unknown; error?: unknown };
    if (row.ok === false && typeof row.error === "string") {
      const error = row.error.toLowerCase();
      if (
        platform.startsWith("facebook") &&
        (error.includes("access token") ||
          error.includes("session has expired") ||
          error.includes("oauth"))
      ) {
        result.add(platform);
      }
    }
  }
  return result;
}

function retryPlatforms(item: QueueItem): string[] {
  const succeeded = successfulPlatforms(item.metadata);
  const blocked = authBlockedPlatforms(item.metadata);
  return item.target_platforms.filter(
    platform => !succeeded.has(platform) && !blocked.has(platform)
  );
}

async function triggerSocialWorker() {
  return dispatchGitHubWorkflow("publish-social.yml");
}

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok)
    return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const items = await supabaseServerAdminRequest<QueueItem[]>(
      "/rest/v1/social_publish_queue?select=id,content_type,content_id,title,target_platforms,status,scheduled_at,published_at,error_message,created_at,updated_at,metadata&order=created_at.desc&limit=250"
    );
    const rows = items ?? [];
    const counts = rows.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    }, {});
    const env = getServerEnv();
    const facebookHealth = await getFacebookPageConnectionHealth();
    const facebookAuthBlocked = rows.filter(
      item =>
        retryableStatuses.has(item.status) &&
        authBlockedPlatforms(item.metadata).size > 0
    ).length;
    const platformStats = rows.reduce<
      Record<string, { queued: number; published: number; failed: number }>
    >((acc, item) => {
      for (const platform of item.target_platforms) {
        acc[platform] ??= { queued: 0, published: 0, failed: 0 };
        if (item.status === "published") acc[platform].published += 1;
        else if (item.status === "failed" || item.status === "partial")
          acc[platform].failed += 1;
        else acc[platform].queued += 1;
      }
      return acc;
    }, {});
    const oldestQueuedAt =
      rows
        .filter(
          item => item.status === "queued" || item.status === "processing"
        )
        .map(item => item.scheduled_at ?? item.created_at)
        .sort()[0] ?? null;
    return NextResponse.json(
      {
        items: rows,
        counts,
        platformStats,
        oldestQueuedAt,
        health: {
          youtubeConfigured: Boolean(
            env.YOUTUBE_CLIENT_ID &&
            env.YOUTUBE_CLIENT_SECRET &&
            env.YOUTUBE_REFRESH_TOKEN
          ),
          ...facebookHealth,
          facebookAuthBlocked,
        },
        automation: {
          enabled: true,
          provider: "GitHub Actions",
          scheduleMinutes: 15,
          note: "النشر يعمل تلقائيًا كل 15 دقيقة؛ تشغيل العامل يدويًا خيار للتشغيل الفوري فقط.",
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[api/admin/social] GET:", error);
    return NextResponse.json(
      { error: "تعذر تحميل مركز النشر." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { action?: unknown; ids?: unknown } | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  const allowedActions = new Set([
    "test_facebook",
    "adopt_server_facebook_token",
    "run_worker",
    "retry",
    "retry_all_failed",
    "delete",
    "delete_failed",
  ]);
  if (!allowedActions.has(action)) {
    return NextResponse.json({ error: "إجراء غير صالح." }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.filter((id): id is string =>
        typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
      ))]
    : [];
  if ((action === "retry" || action === "delete") && (ids.length === 0 || ids.length > 100)) {
    return NextResponse.json({ error: "حدد من 1 إلى 100 عنصر صالح." }, { status: 400 });
  }

  const auth = action === "delete" || action === "delete_failed"
    ? await requireAdminStepUpApi("social.delete")
    : action === "adopt_server_facebook_token"
      ? await requireAdminStepUpApi("social.manage")
      : action === "test_facebook"
        ? await requireAdminApi("social.manage")
        : await requireAdminApi("social.publish");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const rateLimits: Record<string, { bucket: string; limit: number }> = {
    test_facebook: { bucket: "social.test_facebook", limit: 10 },
    adopt_server_facebook_token: { bucket: "social.adopt_facebook", limit: 3 },
    run_worker: { bucket: "social.run_worker", limit: 5 },
    retry: { bucket: "social.retry", limit: 10 },
    retry_all_failed: { bucket: "social.retry_all", limit: 3 },
    delete: { bucket: "social.delete", limit: 5 },
    delete_failed: { bucket: "social.delete_failed", limit: 2 },
  };

  try {
    const limit = rateLimits[action];
    await enforceAdminRateLimit(auth.profile, limit.bucket, limit.limit, 60);

    if (action === "test_facebook") {
      const health = await getFacebookPageConnectionHealth();
      return NextResponse.json({ ok: true, health }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "adopt_server_facebook_token") {
      const adopted = await adoptServerConfiguredFacebookPageToken();
      let released = 0;
      let queueUpdateFailed = false;
      try {
        released = await unblockFacebookAuthBlockedQueue();
      } catch {
        queueUpdateFailed = true;
      }

      let workerDispatched = false;
      if (released > 0) {
        try {
          await triggerSocialWorker();
          workerDispatched = true;
        } catch {
          // The scheduled publisher remains the fallback if manual dispatch is unavailable.
        }
      }

      const health = await getFacebookPageConnectionHealth();
      await recordAdminAuditEvent({
        action: "social.facebook_token.adopt",
        permission: "social.manage",
        resourceType: "social_platform_credentials",
        metadata: { pageName: adopted.pageName, released, queueUpdateFailed, workerDispatched },
      });
      return NextResponse.json({
        ok: true, adopted: true, pageName: adopted.pageName, released,
        queueUpdateFailed, workerDispatched, health,
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "run_worker") {
      const worker = await triggerSocialWorker();
      await recordAdminAuditEvent({
        action: "social.worker.dispatch",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { workflow: "publish-social.yml" },
      });
      return NextResponse.json({ ok: true, worker });
    }

    const retryItems = async (filter: string) => {
      const items = await supabaseServerAdminRequest<QueueItem[]>(
        `/rest/v1/social_publish_queue?${filter}&select=id,target_platforms,metadata,status,updated_at`
      );
      let affected = 0;
      for (const item of items ?? []) {
        if (!retryableStatuses.has(item.status)) continue;
        const platforms = retryPlatforms(item);
        const concurrencyFilter = item.updated_at
          ? `&updated_at=eq.${encodeURIComponent(item.updated_at)}`
          : "";
        if (platforms.length === 0) {
          const targets = item.target_platforms ?? [];
          const succeeded = successfulPlatforms(item.metadata);
          const allTargetsSucceeded = targets.length > 0 && targets.every(platform => succeeded.has(platform));
          if (allTargetsSucceeded) {
            const changed = await supabaseServerAdminRequest<Array<{ id: string }>>(
              `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=in.(failed,partial)${concurrencyFilter}&select=id`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Prefer: "return=representation" },
                body: JSON.stringify({
                  status: "published",
                  error_message: null,
                  published_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }),
              }
            );
            if (changed.length) affected += 1;
          }
          continue;
        }

        const changed = await supabaseServerAdminRequest<Array<{ id: string }>>(
          `/rest/v1/social_publish_queue?id=eq.${encodeURIComponent(item.id)}&status=in.(failed,partial)${concurrencyFilter}&select=id`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Prefer: "return=representation" },
            body: JSON.stringify({
              status: "queued",
              target_platforms: platforms,
              error_message: null,
              updated_at: new Date().toISOString(),
              scheduled_at: new Date().toISOString(),
              metadata: {
                ...(item.metadata ?? {}),
                authBlocked: false,
                attempts: 0,
                nextRetryAt: null,
              },
            }),
          }
        );
        if (changed.length) affected += 1;
      }
      return affected;
    };

    if (action === "retry_all_failed" || action === "retry") {
      const filter = action === "retry_all_failed"
        ? "status=in.(failed,partial)"
        : `id=in.(${ids.map(encodeURIComponent).join(",")})&status=in.(failed,partial)`;
      const affected = await retryItems(filter);
      const worker = affected > 0 ? await triggerSocialWorker() : null;
      await recordAdminAuditEvent({
        action: action === "retry_all_failed" ? "social.queue.retry_all" : "social.queue.retry",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: { requestedIds: action === "retry" ? ids : undefined, affected, workerDispatched: Boolean(worker) },
      });
      return NextResponse.json({ ok: true, affected, worker });
    }

    const deleteFilter = action === "delete"
      ? `id=in.(${ids.map(encodeURIComponent).join(",")})&status=in.(failed,partial)`
      : "status=in.(failed,partial)";
    const deleted = await supabaseServerAdminRequest<Array<{ id: string }>>(
      `/rest/v1/social_publish_queue?${deleteFilter}&select=id`,
      { method: "DELETE", headers: { Prefer: "return=representation" } }
    );
    const affected = deleted?.length ?? 0;
    await recordAdminAuditEvent({
      action: action === "delete" ? "social.queue.delete" : "social.queue.delete_failed",
      permission: "social.delete",
      resourceType: "social_publish_queue",
      metadata: { requestedIds: action === "delete" ? ids : undefined, affected },
    });
    return NextResponse.json({ ok: true, affected });
  } catch (error) {
    console.error("[api/admin/social] POST:", error);
    const message = error instanceof Error ? error.message : "تعذر تنفيذ إجراء مركز النشر.";
    return NextResponse.json(
      { error: message },
      { status: message.includes("تم تجاوز حد العمليات") ? 429 : 500 }
    );
  }
}
