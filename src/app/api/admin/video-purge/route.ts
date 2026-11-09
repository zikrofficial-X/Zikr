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
        description: "Temporary lock preventing internal video generation while ZIKR-owned generated media is being purged.",
        updated_at: new Date().toISOString(),
      }),
    },
  );
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

async function getActiveVideoWork(): Promise<{ generation: number }> {
  const generationRows = await supabaseServerAdminRequest<Array<{ id: string }>>(
    "/rest/v1/video_generation_requests?status=eq.processing&select=id&limit=100",
  );
  return { generation: generationRows?.length ?? 0 };
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

  let automationWasEnabled: boolean | undefined;
  let purgeLockAttempted = false;
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
    const scope = body.scope === "files" || body.scope === "memory" || body.scope === "both"
      ? body.scope
      : "both";
    const includeFiles = scope === "files" || scope === "both";
    const includeMemory = scope === "memory" || scope === "both";

    if (includeFiles) cloudinaryConfig();
    automationWasEnabled = await getVideoAutomationEnabled();

    await pauseVideoAutomation();
    purgeLockAttempted = true;
    await setPurgeLock(true);

    const processing = await getActiveVideoWork();
    if (processing.generation > 0) {
      // Current claims may finish, but the automation settings remain disabled.
      // Release the claim lock so an administrator can resume/settle them safely.
      await restoreVideoAutomation(automationWasEnabled);
      await setPurgeLock(false);
      purgeLockAttempted = false;
      return NextResponse.json(
        {
          error: `يوجد ${processing.generation} طلب توليد قيد التنفيذ. لم يبدأ الحذف؛ استمر التشغيل التلقائي، وأعد المحاولة بعد انتهاء العامل الحالي.`,
          processing,
          paused: false,
          automationMustBeReenabled: false,
          retryRequired: true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const assets = includeFiles ? await listGeneratedVideos() : [];
    const storagePaths = includeFiles ? await listAutomatedStorageObjects() : [];
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
    // The site catalog is treated as project memory. It is always hidden during
    // a purge; links are cleared only when the physical generated files are removed.
    const generatedCatalogRows = await supabaseServerAdminRequest<Array<{
      id: string;
      metadata: Record<string, unknown> | null;
    }>>(
      "/rest/v1/videos?metadata->>generator=eq.zikr_internal_video_factory&select=id,metadata&limit=1000",
    );
    if ((generatedCatalogRows ?? []).length >= 1000) {
      throw new Error("Generated video catalog exceeded the safe purge batch; no catalog rows were changed.");
    }
    if ((generatedCatalogRows ?? []).length > 0) destructiveWorkStarted = true;
    const catalogUpdateErrors = await mapWithConcurrency(generatedCatalogRows ?? [], 6, async row => {
      const previousMetadata = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
      const nextMetadata = {
        ...previousMetadata,
        ...(includeFiles ? { generatedVideoUrl: null, videoUrl: null, mediaState: "purged" } : { mediaState: "unlinked" }),
        mediaPurgedAt: includeFiles ? new Date().toISOString() : previousMetadata.mediaPurgedAt ?? null,
        memoryUnlinkedAt: new Date().toISOString(),
      };
      await supabaseServerAdminRequest("/rest/v1/videos?id=eq." + encodeURIComponent(row.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          published: false,
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
            error_message: "Internal video publication was stopped by the administrator's project-memory cleanup.",
            updated_at: new Date().toISOString(),
          }),
        },
      );
    });
    if (catalogUpdateErrors.length) {
      throw new Error("Some internal catalog records or scheduled publication entries could not be safely unlinked: " + catalogUpdateErrors.slice(0, 3).join(" | "));
    }
    const catalogRecordsHidden = generatedCatalogRows?.length ?? 0;
    // Historical external platform queue records are never read or modified.
    const socialQueueRowsPreserved = true;
    const generatedRequests = includeMemory
      ? await supabaseServerAdminRequest<Array<{ id: string }>>(
          "/rest/v1/video_generation_requests?automation_key=not.is.null&select=id&limit=1000",
        )
      : [];
    if (includeMemory && (generatedRequests ?? []).length >= 1000) {
      throw new Error("Automated generation history exceeded the safe purge batch.");
    }
    let generationRowsDeleted = 0;
    if ((generatedRequests ?? []).length > 0) destructiveWorkStarted = true;
    for (const generatedRequest of generatedRequests ?? []) {
      generationRowsDeleted += await deleteRows(
        "video_generation_requests",
        "id=eq." + encodeURIComponent(generatedRequest.id),
      );
    }
    const automationRuns = includeMemory
      ? await supabaseServerAdminRequest<Array<{ id: string }>>(
          "/rest/v1/video_automation_runs?metadata->>generator=eq.multi-provider-free-ai&select=id&limit=1000",
        )
      : [];
    if (includeMemory && (automationRuns ?? []).length >= 1000) {
      throw new Error("Internal video automation history exceeded the safe purge batch.");
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
    await setPurgeLock(false);
    purgeLockAttempted = false;
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
        catalogRecordsHidden,
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
        catalogRecordsHidden,
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
    let purgeLockCleared = !purgeLockAttempted;
    if (purgeLockAttempted) {
      try {
        await setPurgeLock(false);
        purgeLockCleared = true;
      } catch (recoveryError) {
        recoveryErrors.push("purge lock: " + (recoveryError instanceof Error ? recoveryError.message : String(recoveryError)));
      }
    }
    const automationRemainsDisabled = automationWasEnabled === true &&
      (recoveryErrors.some(message => message.startsWith("automation state:")) ||
        (destructiveWorkStarted && !dataCleanupFinished));
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
