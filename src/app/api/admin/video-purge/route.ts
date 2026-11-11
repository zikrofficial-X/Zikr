import { createHash, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { createAdminClient, supabaseServerAdminRequest } from "@/lib/supabase/server";
import { getConfirmedYoutubeFallbackId, shouldKeepPublishedVideoAfterMediaPurge, wasPublishedBeforeMediaPurge } from "@/features/videos/services/video-media-contract";
import { isGeneratedCloudinaryVideoUrl } from "@/features/videos/services/video-media-url";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const CONFIRMATION_PHRASE = "امسح الفيديوهات المولّدة فقط";
const MAX_AUTOMATED_STORAGE_OBJECTS = 5000;


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
  const paths = new Set<string>();

  const walk = async (prefix: string): Promise<void> => {
    let fullyEnumerated = false;
    for (let offset = 0; offset <= MAX_AUTOMATED_STORAGE_OBJECTS; offset += 1000) {
      const { data, error } = await bucket.list(prefix, {
        limit: offset === MAX_AUTOMATED_STORAGE_OBJECTS ? 1 : 1000,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Supabase video Storage inventory failed: ${error.message}`);
      const objects = data ?? [];
      if (offset === MAX_AUTOMATED_STORAGE_OBJECTS) {
        if (objects.length > 0) {
          throw new Error("Automated video Storage inventory exceeded the safe pagination limit.");
        }
        fullyEnumerated = true;
        break;
      }
      for (const object of objects) {
        if (!object.name || object.name === "." || object.name === "..") continue;
        const path = `${prefix}/${object.name}`;
        if (object.id || object.metadata) {
          paths.add(path);
          if (paths.size > MAX_AUTOMATED_STORAGE_OBJECTS) {
            throw new Error("Automated video Storage inventory exceeded the safe 5,000-object limit.");
          }
        } else await walk(path);
      }
      if (objects.length < 1000) {
        fullyEnumerated = true;
        break;
      }
    }
    if (!fullyEnumerated) {
      throw new Error("Automated video Storage inventory exceeded the safe pagination limit.");
    }
  };

  await walk("automated");
  return [...paths].filter(path =>
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

const PURGE_LOCK_DESCRIPTION = "Temporary lock preventing internal video generation while ZIKR-owned generated media is being purged.";

async function acquirePurgeLock(token: string): Promise<boolean> {
  const description = `${PURGE_LOCK_DESCRIPTION} ${token}`;
  const updated = await supabaseServerAdminRequest<Array<{ key: string }>>(
    "/rest/v1/admin_settings?key=eq.video_purge_in_progress&value=eq.false&select=key",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({ value: true, description, updated_at: new Date().toISOString() }),
    },
  );
  if ((updated ?? []).length > 0) return true;

  // If the row does not exist, insert it without overwriting a concurrent
  // request. The unique key plus ignore-duplicates makes this a compare-and-set.
  const inserted = await supabaseServerAdminRequest<Array<{ key: string }>>(
    "/rest/v1/admin_settings?on_conflict=key&select=key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=representation" },
      body: JSON.stringify({
        key: "video_purge_in_progress",
        value: true,
        description,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  return (inserted ?? []).length > 0;
}

async function releasePurgeLock(token: string): Promise<void> {
  const description = `${PURGE_LOCK_DESCRIPTION} ${token}`;
  const released = await supabaseServerAdminRequest<Array<{ key: string }>>(
    `/rest/v1/admin_settings?key=eq.video_purge_in_progress&description=eq.${encodeURIComponent(description)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        value: false,
        description: PURGE_LOCK_DESCRIPTION,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if ((released ?? []).length === 0) {
    throw new Error("Purge lock ownership changed before release; leaving the worker lock enabled.");
  }
}

async function getVideoAutomationEnabled(): Promise<boolean> {
  const rows = await supabaseServerAdminRequest<Array<{ value: unknown }>>(
    "/rest/v1/admin_settings?key=eq.video_automation_enabled&select=value&limit=1",
  );
  return rows?.[0]?.value !== false;
}

async function restoreVideoAutomation(enabled: boolean): Promise<void> {
  await supabaseServerAdminRequest(
    "/rest/v1/admin_settings?key=eq.video_automation_enabled",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ value: enabled, updated_at: new Date().toISOString() }),
    },
  );
}

async function pauseVideoAutomation(): Promise<void> {
  await supabaseServerAdminRequest(
    "/rest/v1/admin_settings?key=eq.video_automation_enabled",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ value: false, updated_at: new Date().toISOString() }),
    },
  );
}

async function getActiveVideoWork(): Promise<{ generation: number; publications: number }> {
  const [generationRows, publicationRows] = await Promise.all([
    supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/video_generation_requests?status=eq.processing&select=id&limit=100",
    ),
    supabaseServerAdminRequest<Array<{ id: string }>>(
      "/rest/v1/content_publish_queue?content_table=eq.videos&status=in.(queued,processing)&select=id&limit=100",
    ),
  ]);
  return {
    generation: generationRows?.length ?? 0,
    publications: publicationRows?.length ?? 0,
  };
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
  const auth = await requireAdminStepUpApi("video.delete", "/admin/media");
  if (!auth.ok) return NextResponse.json({ error: auth.error, nextPath: "nextPath" in auth ? auth.nextPath : undefined }, { status: auth.status, headers: { "Cache-Control": "no-store" } });

  let automationWasEnabled: boolean | undefined;
  let purgeLockToken: string | null = null;
  let destructiveWorkStarted = false;
  let dataCleanupFinished = false;
  try {
    const body = await request.json().catch(() => ({})) as { confirmation?: unknown; scope?: unknown };
    if (body.confirmation !== CONFIRMATION_PHRASE) {
      return NextResponse.json(
        { error: `اكتب العبارة التالية حرفيًا للتأكيد: ${CONFIRMATION_PHRASE}` },
        { status: 400 },
      );
    }
    const scope = body.scope;
    if (scope !== "files" && scope !== "memory" && scope !== "both") {
      return NextResponse.json(
        { error: "Invalid purge scope. Choose files, memory, or both." },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    const includeFiles = scope === "files" || scope === "both";
    const includeMemory = scope === "memory" || scope === "both";

    // File deletion is deliberately disabled until this endpoint has a complete,
    // bounded cross-table reference inventory for both Cloudinary and Supabase
    // Storage. The separate retention workflow has a stronger inventory contract;
    // this admin endpoint must not infer that an asset is unreferenced from tags
    // or the social queue alone.
    if (includeFiles) {
      return NextResponse.json(
        {
          error: "File purge is disabled until a complete cross-table reference inventory proves that every Cloudinary and Supabase Storage asset is unreferenced. No files or project data were changed.",
          deletionStarted: false,
          filesPurgeAvailable: false,
          retryRequired: false,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Memory cleanup also deletes generation-request rows. Their IDs are soft
    // references in video catalog metadata and historical social queue rows;
    // preserve those relationships until a complete archival/detachment
    // contract has been implemented and verified across every consumer.
    if (includeMemory) {
      return NextResponse.json(
        {
          error: "Project-memory purge is disabled until generation-request, video-catalog metadata, social-queue, automation-run, and audit-event references are inventoried and safely preserved or detached. No database rows were changed.",
          deletionStarted: false,
          memoryPurgeAvailable: false,
          retryRequired: false,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const cloudinary = includeFiles ? cloudinaryConfig() : null;
    const lockToken = randomUUID();
    const lockAcquired = await acquirePurgeLock(lockToken);
    if (!lockAcquired) {
      return NextResponse.json(
        { error: "يوجد تنظيف آخر قيد التنفيذ. لم يبدأ أي حذف؛ أعد المحاولة بعد انتهائه.", deletionStarted: false, retryRequired: true },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    purgeLockToken = lockToken;
    automationWasEnabled = await getVideoAutomationEnabled();
    await pauseVideoAutomation();

    const processing = await getActiveVideoWork();
    if (processing.generation > 0 || processing.publications > 0) {
      // No destructive work started; restore the prior setting and release our lock.
      await restoreVideoAutomation(automationWasEnabled);
      if (purgeLockToken) {
        await releasePurgeLock(purgeLockToken);
        purgeLockToken = null;
      }
      return NextResponse.json(
        {
          error: `يوجد ${processing.generation} طلب توليد و${processing.publications} عملية نشر فيديو مجدولة أو قيد التنفيذ. لم يبدأ الحذف؛ أكمل النشر أو ألغِه ثم أعد المحاولة.`,
          processing,
          paused: false,
          automationMustBeReenabled: false,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const pendingSocialQueueMedia = includeFiles
      ? await supabaseServerAdminRequest<Array<{ video_url: string | null }>>(
          "/rest/v1/social_publish_queue?status=neq.published&video_url=not.is.null&select=video_url&limit=1000",
        )
      : [];
    if (includeFiles && (pendingSocialQueueMedia ?? []).length >= 1000) {
      await restoreVideoAutomation(automationWasEnabled);
      if (purgeLockToken) {
        await releasePurgeLock(purgeLockToken);
        purgeLockToken = null;
      }
      return NextResponse.json(
        {
          error: "تعذر التحقق من جميع عناصر طابور النشر بأمان. لم يبدأ الحذف؛ قلّص الطابور أو عالج العناصر ثم أعد المحاولة.",
          protectedSocialQueueItems: null,
          deletionStarted: false,
          paused: false,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    const protectedSocialQueueMedia = new Set(
      (pendingSocialQueueMedia ?? [])
        .map((row) => row.video_url)
        .filter((value): value is string => isGeneratedCloudinaryVideoUrl(value, cloudinary?.cloudName ?? "")),
    );
    if (includeFiles && protectedSocialQueueMedia.size > 0) {
      await restoreVideoAutomation(automationWasEnabled);
      if (purgeLockToken) {
        await releasePurgeLock(purgeLockToken);
        purgeLockToken = null;
      }
      return NextResponse.json(
        {
          error: `يوجد ${protectedSocialQueueMedia.size} فيديو مرتبط بعناصر نشر لم تكتمل بعد. لم يبدأ حذف أي ملف؛ أعد محاولة النشر أو عالج العناصر أولًا.`,
          protectedSocialQueueItems: protectedSocialQueueMedia.size,
          deletionStarted: false,
          paused: false,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const pendingSocialGenerationRefs = (includeFiles || includeMemory)
      ? await supabaseServerAdminRequest<Array<{ id: string }>>(
          "/rest/v1/social_publish_queue?status=neq.published&or=(content_type.like.*video*,video_url.not.is.null)&select=id&limit=1000",
        )
      : [];
    if ((includeFiles || includeMemory) && (pendingSocialGenerationRefs ?? []).length >= 1000) {
      await restoreVideoAutomation(automationWasEnabled);
      if (purgeLockToken) {
        await releasePurgeLock(purgeLockToken);
        purgeLockToken = null;
      }
      return NextResponse.json(
        {
          error: "تعذر التحقق من جميع مراجع طلبات الفيديو في طابور النشر. لم يبدأ حذف سجل التوليد.",
          protectedGenerationRequestCount: null,
          deletionStarted: false,
          paused: false,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    if ((includeFiles || includeMemory) && (pendingSocialGenerationRefs ?? []).length > 0) {
      await restoreVideoAutomation(automationWasEnabled);
      if (purgeLockToken) {
        await releasePurgeLock(purgeLockToken);
        purgeLockToken = null;
      }
      return NextResponse.json(
        {
          error: `يوجد ${pendingSocialGenerationRefs.length} عنصر نشر اجتماعي غير مكتمل مرتبط بوسيط فيديو. تم الحفاظ على سجل التوليد ولم يبدأ الحذف.`,
          protectedGenerationRequestCount: pendingSocialGenerationRefs.length,
          deletionStarted: false,
          paused: false,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    // Complete every bounded database inventory before the first external or
    // database deletion. A limit hit must never leave a partially purged library.
    const generatedCatalogRows = await supabaseServerAdminRequest<Array<{
      id: string;
      metadata: Record<string, unknown> | null;
      published: boolean | null;
      youtube_id: string | null;
    }>>(
      "/rest/v1/videos?metadata->>generator=eq.zikr_internal_video_factory&select=id,metadata,published,youtube_id&limit=1000",
    );
    if ((generatedCatalogRows ?? []).length >= 1000) {
      throw new Error("Generated video catalog exceeded the safe purge batch; no files or catalog rows were changed.");
    }
    const generatedRequests = includeMemory
      ? await supabaseServerAdminRequest<Array<{ id: string }>>(
          "/rest/v1/video_generation_requests?automation_key=not.is.null&select=id&limit=1000",
        )
      : [];
    if (includeMemory && (generatedRequests ?? []).length >= 1000) {
      throw new Error("Automated generation history exceeded the safe purge batch; no files or catalog rows were changed.");
    }
    const automationRuns = includeMemory
      ? await supabaseServerAdminRequest<Array<{ id: string }>>(
          "/rest/v1/video_automation_runs?metadata->>generator=eq.multi-provider-free-ai&select=id&limit=1000",
        )
      : [];
    if (includeMemory && (automationRuns ?? []).length >= 1000) {
      throw new Error("Internal video automation history exceeded the safe purge batch; no files or catalog rows were changed.");
    }

    const assets = includeFiles ? await listGeneratedVideos() : [];
    const storagePaths = includeFiles ? await listAutomatedStorageObjects() : [];
    const processingAfterPreflight = await getActiveVideoWork();
    if (processingAfterPreflight.generation > 0 || processingAfterPreflight.publications > 0) {
      throw new Error(
        `Video generation or scheduled publication became active during purge preflight (${processingAfterPreflight.generation} generation request(s), ${processingAfterPreflight.publications} publication(s)); no deletion started.`,
      );
    }
    if (includeFiles && assets.length > 0) destructiveWorkStarted = true;
    const cloudinaryErrors = includeFiles
      ? await mapWithConcurrency(assets, 6, async asset => {
          if (!asset.public_id) throw new Error("Generated video asset is missing its public ID.");
          await deleteCloudinaryVideo(asset.public_id);
        })
      : [];
    if (cloudinaryErrors.length > 0) {
      throw new Error(
        `تعذر حذف ${cloudinaryErrors.length} ملفًا من Cloudinary. لم تُحذف سجلات الفيديو من قاعدة البيانات حتى يمكن إعادة المحاولة بأمان. ${cloudinaryErrors.slice(0, 3).join(" | ")}`,
      );
    }

    if (includeFiles && storagePaths.length > 0) destructiveWorkStarted = true;
    const storageObjectsDeleted = includeFiles ? await deleteAutomatedStorageObjects(storagePaths) : 0;
    // Remove Cloudinary masters without hiding videos that already have a
    // verified YouTube publication fallback. Unconfirmed IDs are never treated
    // as a playback fallback, and unpublished records remain unpublished.
    if ((generatedCatalogRows ?? []).length > 0) destructiveWorkStarted = true;
    let catalogRecordsHidden = 0;
    let catalogFallbackRowsKeptPublished = 0;
    const catalogUpdateErrors = await mapWithConcurrency(generatedCatalogRows ?? [], 6, async row => {
      const previousMetadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
      const fallbackId = includeFiles ? getConfirmedYoutubeFallbackId(row) : null;
      const keepPublishedFallback = shouldKeepPublishedVideoAfterMediaPurge(row, includeFiles);
      if (keepPublishedFallback) catalogFallbackRowsKeptPublished += 1;
      else catalogRecordsHidden += 1;
      const nextMetadata = {
        ...previousMetadata,
        ...(includeFiles
          ? {
              generatedVideoUrl: null,
              videoUrl: null,
              mediaState: "purged",
              mediaFallbackAvailable: fallbackId !== null,
              mediaPurgedFromPublished: wasPublishedBeforeMediaPurge(row),
            }
          : { mediaState: "unlinked" }),
        mediaPurgedAt: includeFiles ? new Date().toISOString() : previousMetadata.mediaPurgedAt ?? null,
        memoryUnlinkedAt: new Date().toISOString(),
      };
      await supabaseServerAdminRequest("/rest/v1/videos?id=eq." + encodeURIComponent(row.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          published: keepPublishedFallback,
          ...(keepPublishedFallback && fallbackId ? { youtube_id: fallbackId } : {}),
          metadata: nextMetadata,
          updated_at: new Date().toISOString(),
        }),
      });
      await supabaseServerAdminRequest(
        "/rest/v1/content_publish_queue?content_table=eq.videos&content_id=eq." +
          encodeURIComponent(row.id) + "&status=in.(queued,processing)",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({
            status: "failed",
            error_message: keepPublishedFallback
              ? "No internal upload is required; the already-published YouTube fallback remains public."
              : "Internal video publication was stopped by the administrator project-memory cleanup.",
            updated_at: new Date().toISOString(),
          }),
        },
      );
    });
    if (catalogUpdateErrors.length) {
      throw new Error("Some internal catalog records or scheduled publication entries could not be safely unlinked: " + catalogUpdateErrors.slice(0, 3).join(" | "));
    }
        // Historical external platform queue records are never read or modified.
    const socialQueueRowsPreserved = true;
    let generationRowsDeleted = 0;
    if ((generatedRequests ?? []).length > 0) destructiveWorkStarted = true;
    for (const generatedRequest of generatedRequests ?? []) {
      generationRowsDeleted += await deleteRows(
        "video_generation_requests",
        "id=eq." + encodeURIComponent(generatedRequest.id),
      );
    }
    let automationRunsDeleted = 0;
    if ((automationRuns ?? []).length > 0) destructiveWorkStarted = true;
    for (const run of automationRuns ?? []) {
      automationRunsDeleted += await deleteRows(
        "video_automation_runs",
        "id=eq." + encodeURIComponent(run.id),
      );
    }

    dataCleanupFinished = true;
    await restoreVideoAutomation(automationWasEnabled);
    if (purgeLockToken) {
      await releasePurgeLock(purgeLockToken);
      purgeLockToken = null;
    }
    await recordAdminAuditEvent({
      action: "video.library.purge",
      permission: "video.delete",
      resourceType: "generated_video_library",
      metadata: {
        scope,
        cloudinaryAssetsDeleted: assets.length,
        cloudinaryBytesDeleted: assets.reduce((sum, asset) => sum + Number(asset.bytes ?? 0), 0),
        storageObjectsDeleted,
        socialQueueRowsPreserved,
        publicVideoCatalogPreserved: true,
        manualPublicVideoCatalogPreserved: true,
        catalogRecordsRetained: true,
        generatedCatalogRecordsHidden: catalogRecordsHidden,
        catalogRecordsHidden,
        catalogFallbackRowsKeptPublished,
        generationMemoryDeleted: includeMemory,
        physicalFilesDeleted: includeFiles,
        generationRowsDeleted,
        automationRunsDeleted,
        externalSocialPostsDeleted: false,
      },
    });

    for (const path of ["/videos", "/admin/media", "/admin/memory", "/admin/video/requests", "/admin/videos"]) {
      revalidatePath(path);
    }

    return NextResponse.json(
      {
        ok: true,
        paused: !automationWasEnabled,
        automationRemainsDisabled: !automationWasEnabled,
        automationResumed: automationWasEnabled,
        scope,
        cloudinaryAssetsDeleted: assets.length,
        cloudinaryBytesDeleted: assets.reduce((sum, asset) => sum + Number(asset.bytes ?? 0), 0),
        storageObjectsDeleted,
        socialQueueRowsPreserved,
        publicVideoCatalogPreserved: true,
        manualPublicVideoCatalogPreserved: true,
        catalogRecordsRetained: true,
        generatedCatalogRecordsHidden: catalogRecordsHidden,
        catalogRecordsHidden,
        catalogFallbackRowsKeptPublished,
        generationMemoryDeleted: includeMemory,
        physicalFilesDeleted: includeFiles,
        generationRowsDeleted,
        automationRunsDeleted,
        externalSocialPostsDeleted: false,
        note: includeFiles && includeMemory
          ? "تم حذف ملفات التوليد ورفعها من الذاكرة الداخلية، مع إبقاء سجل التدقيق والعناوين الأساسية. سجلات المنصات الخارجية لم تُعدّل."
          : includeFiles
            ? "تم حذف ملفات الفيديو فقط، مع إبقاء سجل التوليد ومعلومات المصادر كذاكرة تاريخية. سجلات المنصات الخارجية لم تُعدّل."
            : "تم فك ربط ذاكرة الفيديوهات وإخفاؤها من الموقع مع إبقاء ملفات Cloudinary كما هي. سجلات المنصات الخارجية لم تُعدّل.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/video-purge] POST:", error);
    const recoveryErrors: string[] = [];
    if (automationWasEnabled !== undefined &&
      (!destructiveWorkStarted || dataCleanupFinished)) {
      try {
        await restoreVideoAutomation(automationWasEnabled);
      } catch (recoveryError) {
        recoveryErrors.push("automation state: " + (recoveryError instanceof Error ? recoveryError.message : String(recoveryError)));
      }
    }
    let purgeLockCleared = !purgeLockToken;
    if (purgeLockToken) {
      try {
        await releasePurgeLock(purgeLockToken);
        purgeLockToken = null;
        purgeLockCleared = true;
      } catch (recoveryError) {
        recoveryErrors.push("purge lock: " + (recoveryError instanceof Error ? recoveryError.message : String(recoveryError)));
      }
    }
    const automationRemainsDisabled =
      automationWasEnabled === false ||
      (automationWasEnabled === true &&
        (recoveryErrors.some(message => message.startsWith("automation state:")) ||
          (destructiveWorkStarted && !dataCleanupFinished))) ||
      !purgeLockCleared;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "تعذر إتمام تصفير الفيديوهات.",
        paused: automationRemainsDisabled,
        automationRemainsDisabled,
        purgeLockCleared,
        partialPurge: destructiveWorkStarted && !dataCleanupFinished,
        retryRequired: true,
        ...(recoveryErrors.length ? { recoveryErrors } : {}),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
