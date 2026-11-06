import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { createAdminClient, supabaseServerAdminRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const CONFIRMATION_PHRASE = "امسح الفيديوهات المولّدة فقط";
const VIDEO_CONTENT_TYPES = [
  "adhkar_video",
  "dua_video",
  "hadith_video",
  "other_video",
  "quran_video",
  "story_video",
] as const;

type CloudinaryAsset = {
  asset_id?: string;
  public_id?: string;
  resource_type?: string;
  type?: string;
  format?: string;
  bytes?: number;
  tags?: string[];
};

type CloudinarySearchPage = {
  resources?: CloudinaryAsset[];
  next_cursor?: string;
  total_count?: number;
};

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim() ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim() ?? "";
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary video storage is not configured on the server.");
  }
  return { cloudName, apiKey, apiSecret };
}

function isGeneratedZikrVideo(asset: CloudinaryAsset): boolean {
  const tags = new Set(Array.isArray(asset.tags) ? asset.tags : []);
  const isGenerated = tags.has("zikr-generated") ||
    (tags.has("zikr") && tags.has("cloudinary-migration"));
  return asset.resource_type === "video" &&
    asset.type === "upload" &&
    asset.format === "mp4" &&
    typeof asset.public_id === "string" &&
    asset.public_id.startsWith("auto-") &&
    isGenerated &&
    tags.has("automated");
}

async function listGeneratedVideos(): Promise<CloudinaryAsset[]> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/resources/search`;
  const authorization = "Basic " + Buffer.from(apiKey + ":" + apiSecret).toString("base64");
  const assets: CloudinaryAsset[] = [];
  let nextCursor: string | undefined;

  for (let pageNumber = 0; pageNumber < 20; pageNumber += 1) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expression: "resource_type:video AND tags=automated",
        max_results: 500,
        with_field: ["tags"],
        ...(nextCursor ? { next_cursor: nextCursor } : {}),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    const payload = await response.json().catch(() => ({})) as CloudinarySearchPage & {
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(payload.error?.message || "Cloudinary generated-video inventory lookup failed.");
    }
    assets.push(...(payload.resources ?? []).filter(isGeneratedZikrVideo));
    nextCursor = payload.next_cursor;
    if (!nextCursor) return assets;
  }

  throw new Error("Cloudinary generated-video inventory exceeded the safe pagination limit.");
}

async function deleteCloudinaryVideo(publicId: string): Promise<void> {
  const { cloudName, apiKey, apiSecret } = cloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signatureBase = `invalidate=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
  const signature = createHash("sha1").update(signatureBase).digest("hex");
  const form = new URLSearchParams({
    public_id: publicId,
    timestamp,
    invalidate: "true",
    api_key: apiKey,
    signature,
  });
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/video/destroy`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  );
  const result = await response.json().catch(() => ({})) as {
    result?: string;
    error?: { message?: string };
  };
  if (!response.ok || (result.result !== "ok" && result.result !== "not found")) {
    throw new Error(result.error?.message || `Cloudinary could not delete generated video ${publicId}.`);
  }
}

async function mapWithConcurrency<T>(
  values: T[],
  concurrency: number,
  task: (value: T) => Promise<void>,
): Promise<string[]> {
  const errors: string[] = [];
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= values.length) return;
      try {
        await task(values[current]);
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  });
  await Promise.all(workers);
  return errors;
}

async function listAutomatedStorageObjects(): Promise<string[]> {
  const supabase = createAdminClient();
  const bucket = supabase.storage.from("videos");
  const paths: string[] = [];

  const walk = async (prefix: string): Promise<void> => {
    for (let offset = 0; offset < 5000; offset += 1000) {
      const { data, error } = await bucket.list(prefix, {
        limit: 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Supabase video Storage inventory failed: ${error.message}`);
      const objects = data ?? [];
      for (const object of objects) {
        if (!object.name || object.name === "." || object.name === "..") continue;
        const path = `${prefix}/${object.name}`;
        if (object.id || object.metadata) paths.push(path);
        else await walk(path);
      }
      if (objects.length < 1000) break;
    }
  };

  await walk("automated");
  return [...new Set(paths)].filter(path =>
    path.startsWith("automated/") &&
    !path.split("/").some(part => part === "." || part === ".."),
  );
}

async function deleteAutomatedStorageObjects(paths: string[]): Promise<number> {
  if (!paths.length) return 0;
  const bucket = createAdminClient().storage.from("videos");
  let removed = 0;
  for (let offset = 0; offset < paths.length; offset += 100) {
    const batch = paths.slice(offset, offset + 100);
    const { data, error } = await bucket.remove(batch);
    if (error) throw new Error(`Supabase video Storage deletion failed: ${error.message}`);
    removed += data?.length ?? batch.length;
  }
  return removed;
}

async function setPurgeLock(enabled: boolean): Promise<void> {
  await supabaseServerAdminRequest(
    "/rest/v1/admin_settings?on_conflict=key",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        key: "video_purge_in_progress",
        value: enabled,
        description: "Temporary lock preventing workers from publishing video queue items during a full generated-video purge.",
        updated_at: new Date().toISOString(),
      }),
    },
  );
}

async function pauseVideoAutomation(): Promise<void> {
  await supabaseServerAdminRequest(
    "/rest/v1/admin_settings?key=in.(video_automation_enabled,video_automation_auto_publish)",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ value: false, updated_at: new Date().toISOString() }),
    },
  );
  await supabaseServerAdminRequest(
    "/rest/v1/admin_settings?key=eq.video_automation_run_now",
    { method: "DELETE", headers: { Prefer: "return=minimal" } },
  );
}

async function getActiveVideoWork(): Promise<{ queue: number; generation: number }> {
  const [queueRows, generationRows] = await Promise.all([
    supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/social_publish_queue?content_type=in.(" +
        VIDEO_CONTENT_TYPES.join(",") +
        ")&status=eq.processing&select=id&limit=100",
    ),
    supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/video_generation_requests?status=eq.processing&select=id&limit=100",
    ),
  ]);
  return {
    queue: queueRows?.length ?? 0,
    generation: generationRows?.length ?? 0,
  };
}

async function getUnresolvedVideoDeliveries(): Promise<number> {
  const rows = await supabaseServerAdminRequest<Array<{
    status: string;
    published_at: string | null;
    metadata?: Record<string, unknown> | null;
  }>>(
    "/rest/v1/social_publish_queue?content_type=in.(" +
      VIDEO_CONTENT_TYPES.join(",") +
      ")&status=in.(queued,partial,failed)&select=status,published_at,metadata&limit=1000",
  );
  const candidates = rows ?? [];
  if (candidates.length >= 1000) {
    throw new Error("Unresolved video delivery inventory exceeded the safe preflight limit.");
  }
  return candidates.filter(row =>
    Boolean(row.published_at) || hasSuccessfulRemotePublication(row.metadata),
  ).length;
}

type SocialQueuePurgeCandidate = {
  id: string;
  published_at: string | null;
  metadata?: Record<string, unknown> | null;
};

function hasSuccessfulRemotePublication(metadata: Record<string, unknown> | null | undefined): boolean {
  const raw = metadata?.platformResults;
  const results = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.values(raw)
      : [];
  return results.some(value => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const row = value as Record<string, unknown>;
    return row.ok === true && typeof row.remoteId === "string" && row.remoteId.trim().length > 0;
  });
}

/**
 * Remove only video queue rows that have never been published. Published,
 * partially delivered, failed, or remotely identified items remain as the
 * delivery ledger so YouTube/Facebook IDs and analytics are not lost.
 */
async function deleteUnpublishedVideoQueueRows(): Promise<number> {
  const candidates: SocialQueuePurgeCandidate[] = [];
  for (let offset = 0; offset < 5000; offset += 1000) {
    const rows = await supabaseServerAdminRequest<SocialQueuePurgeCandidate[]>(
      "/rest/v1/social_publish_queue?content_type=in.(" +
        VIDEO_CONTENT_TYPES.join(",") +
        ")&status=eq.queued&published_at=is.null&select=id,published_at,metadata&order=created_at.asc&limit=1000&offset=" +
        offset,
    );
    const page = rows ?? [];
    candidates.push(...page);
    if (page.length < 1000) break;
    if (offset === 4000) {
      throw new Error("Video publish queue inventory exceeded the safe purge pagination limit.");
    }
  }

  const safeIds = candidates
    .filter(row => !row.published_at && !hasSuccessfulRemotePublication(row.metadata))
    .map(row => row.id);

  let deleted = 0;
  for (let offset = 0; offset < safeIds.length; offset += 100) {
    const batch = safeIds.slice(offset, offset + 100);
    const ids = batch.map(encodeURIComponent).join(",");
    const rows = await supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/social_publish_queue?id=in.(" + ids + ")&status=eq.queued&published_at=is.null&select=id",
      { method: "DELETE", headers: { Prefer: "return=representation" } },
    );
    deleted += rows?.length ?? 0;
  }
  return deleted;
}

async function deleteRows(table: string, filter: string): Promise<number> {
  const rows = await supabaseServerAdminRequest<Array<{ id: string }>>(
    `/rest/v1/${table}?${filter}&select=id`,
    { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  return rows?.length ?? 0;
}

export async function GET() {
  const auth = await requireAdminApi("video.delete");
  if (!auth.ok) return NextResponse.json({ allowed: false }, { status: auth.status });
  return NextResponse.json({ allowed: true }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi("video.delete");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json().catch(() => ({})) as { confirmation?: unknown };
    if (body.confirmation !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        { error: `اكتب العبارة التالية حرفيًا للتأكيد: ${CONFIRMATION_PHRASE}` },
        { status: 400 },
      );
    }

    cloudinaryConfig();

    // Do not delete source media while a social item still needs another
    // platform delivery. This read-only preflight leaves automation untouched.
    const unresolvedDeliveries = await getUnresolvedVideoDeliveries();
    if (unresolvedDeliveries > 0) {
      return NextResponse.json(
        {
          error: `يوجد ${unresolvedDeliveries} عنصر فيديو له نشر جزئي أو معرّف نشر خارجي ولم يكتمل بعد. أكمل النشر أو عالج هذه العناصر أولًا، ثم أعد التصفير. لم يتم إيقاف التشغيل أو حذف أي ملف.`,
          unresolvedDeliveries,
          paused: false,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    await pauseVideoAutomation();
    await setPurgeLock(true);

    const processing = await getActiveVideoWork();
    if (processing.queue > 0 || processing.generation > 0) {
      return NextResponse.json(
        {
          error: `يوجد ${processing.generation} طلب توليد و${processing.queue} عملية نشر فيديو قيد التنفيذ. أوقفت التوليد وحجزت النشر مؤقتًا؛ أعد تنفيذ التصفير بعد انتهاء العامل.`,
          processing,
          paused: true,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Close the race where a worker completed a first-platform delivery after
    // preflight but before the purge lock became visible.
    const unresolvedAfterLock = await getUnresolvedVideoDeliveries();
    if (unresolvedAfterLock > 0) {
      await setPurgeLock(false);
      return NextResponse.json(
        {
          error: `ظهر ${unresolvedAfterLock} عنصر نشر جزئي أثناء تفعيل الحماية. لم يبدأ الحذف؛ إعدادات الفيديو التلقائية متوقفة، ويمكن إعادة تفعيل النشر لمعالجة العناصر ثم إعادة المحاولة.`,
          unresolvedDeliveries: unresolvedAfterLock,
          paused: true,
          automationMustBeReenabled: true,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const assets = await listGeneratedVideos();
    const storagePaths = await listAutomatedStorageObjects();
    const cloudinaryErrors = await mapWithConcurrency(assets, 6, async asset => {
      if (!asset.public_id) throw new Error("Generated video asset is missing its public ID.");
      await deleteCloudinaryVideo(asset.public_id);
    });
    if (cloudinaryErrors.length > 0) {
      throw new Error(
        `تعذر حذف ${cloudinaryErrors.length} ملفًا من Cloudinary. لم تُحذف سجلات الفيديو من قاعدة البيانات حتى يمكن إعادة المحاولة بأمان. ${cloudinaryErrors.slice(0, 3).join(" | ")}`,
      );
    }

    const storageObjectsDeleted = await deleteAutomatedStorageObjects(storagePaths);
    const queueRowsDeleted = await deleteUnpublishedVideoQueueRows();
    // public.videos is the site's external/manual video catalogue, not the
    // generated-video store. Preserve every row because it has no reliable
    // generated-source discriminator.
    const generationRowsDeleted = await deleteRows("video_generation_requests", "id=not.is.null");
    const automationRunsDeleted = await deleteRows("video_automation_runs", "id=not.is.null");

    await setPurgeLock(false);
    await recordAdminAuditEvent({
      action: "video.library.purge",
      permission: "video.delete",
      resourceType: "generated_video_library",
      metadata: {
        cloudinaryAssetsDeleted: assets.length,
        cloudinaryBytesDeleted: assets.reduce((sum, asset) => sum + Number(asset.bytes ?? 0), 0),
        storageObjectsDeleted,
        queueRowsDeleted,
        publicVideoCatalogPreserved: true,
        generationRowsDeleted,
        automationRunsDeleted,
        externalSocialPostsDeleted: false,
      },
    });

    for (const path of ["/videos", "/admin/social", "/admin/video/requests", "/admin/videos"]) {
      revalidatePath(path);
    }

    return NextResponse.json(
      {
        ok: true,
        paused: true,
        automationRemainsDisabled: true,
        cloudinaryAssetsDeleted: assets.length,
        cloudinaryBytesDeleted: assets.reduce((sum, asset) => sum + Number(asset.bytes ?? 0), 0),
        storageObjectsDeleted,
        queueRowsDeleted,
        publicVideoCatalogPreserved: true,
        generationRowsDeleted,
        automationRunsDeleted,
        externalSocialPostsDeleted: false,
        note: "تم حذف مخرجات الفيديو المولّدة غير المنشورة وسجلات التوليد. كتالوج الفيديوهات العامة وسجل النشر ذي المعرّفات الخارجية محفوظان؛ المنشورات الموجودة داخل YouTube وFacebook لم تُحذف.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/video-purge] POST:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "تعذر إتمام تصفير الفيديوهات.",
        paused: true,
        retryRequired: true,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
