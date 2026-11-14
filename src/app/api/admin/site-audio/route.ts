import { NextRequest, NextResponse } from "next/server";
import { readBoundedJsonBody } from "@/lib/request/bounded-json-body";
import { requireAdminApi } from "@/features/admin/services/admin";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { createAdminClient, supabaseServerAdminRequest } from "@/lib/supabase/server";
import { validateSiteAudioStorageObject, validateSiteAudioUploadPath } from "@/features/audio/services/site-audio-upload-contract";

const KINDS = new Set(["adhan", "salawat", "dhikr"]);
const select = "id,kind,title,storage_path,mime_type,size_bytes,is_primary,created_at,updated_at";

type SiteAudioUploadIntent = {
  storage_path: string;
  owner_user_id: string;
  mime_type: string;
  size_bytes: number;
  upload_expires_at: string;
  cleanup_after: string;
  status: "pending" | "registered" | "cleaned";
  asset_id: string | null;
};

async function recordAuditSafely(
  event: Parameters<typeof recordAdminAuditEvent>[0],
  context: string,
): Promise<boolean> {
  try {
    await recordAdminAuditEvent(event);
    return true;
  } catch (error) {
    console.error(`[api/admin/site-audio] audit event failed after ${context}:`, error);
    return false;
  }
}

export async function GET() {
  const guard = await requireAdminApi("audio.manage");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const { data, error } = await createAdminClient()
    .from("site_audio_assets")
    .select(select)
    .order("kind")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ assets: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdminApi("audio.manage");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const parsedBody = await readBoundedJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = parsedBody.value && typeof parsedBody.value === "object" && !Array.isArray(parsedBody.value)
    ? parsedBody.value as Record<string, unknown>
    : null;
  const kind = typeof body?.kind === "string" ? body.kind : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const storagePath = typeof body?.storagePath === "string" ? body.storagePath.trim() : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim() : "";
  const sizeBytes = Number(body?.sizeBytes);

  if (!KINDS.has(kind) || !title || title.length > 120 || !storagePath || !mimeType || !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    return NextResponse.json({ error: "بيانات المقطع غير صالحة." }, { status: 400 });
  }

  const pathValidation = validateSiteAudioUploadPath({
    ownerId: guard.profile.id,
    storagePath,
    mimeType,
    sizeBytes,
  });
  if (!pathValidation.ok) {
    const error = pathValidation.reason === "invalid_path"
      ? "مسار الملف غير صالح."
      : pathValidation.reason === "invalid_mime_type"
        ? "نوع ملف الصوت غير مدعوم."
        : "حجم ملف الصوت غير صالح.";
    return NextResponse.json({ error }, { status: 400 });
  }

  const intentPath = `/rest/v1/site_audio_upload_intents?storage_path=eq.${encodeURIComponent(storagePath)}&owner_user_id=eq.${encodeURIComponent(guard.profile.id)}&select=storage_path,owner_user_id,mime_type,size_bytes,upload_expires_at,cleanup_after,status,asset_id&limit=1`;
  let intents: SiteAudioUploadIntent[];
  try {
    intents = await supabaseServerAdminRequest<SiteAudioUploadIntent[]>(intentPath);
  } catch (intentError) {
    console.error("[api/admin/site-audio] upload intent lookup failed:", intentError);
    return NextResponse.json({ error: "تعذر التحقق من جلسة الرفع الآمنة." }, { status: 503 });
  }
  const uploadIntent = Array.isArray(intents) ? intents[0] : null;
  if (
    !uploadIntent ||
    uploadIntent.owner_user_id !== guard.profile.id ||
    uploadIntent.status !== "pending"
  ) {
    return NextResponse.json({ error: "جلسة الرفع غير موجودة أو لم تعد صالحة." }, { status: 409 });
  }
  const uploadExpiresAt = Date.parse(uploadIntent.upload_expires_at);
  if (!Number.isFinite(uploadExpiresAt) || uploadExpiresAt <= Date.now()) {
    return NextResponse.json({ error: "انتهت صلاحية جلسة الرفع. ابدأ رفعًا جديدًا." }, { status: 409 });
  }
  if (
    uploadIntent.mime_type.trim().toLowerCase() !== mimeType.trim().toLowerCase() ||
    uploadIntent.size_bytes !== sizeBytes
  ) {
    return NextResponse.json({ error: "بيانات الملف لا تطابق جلسة الرفع." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: objects, error: storageListError } = await db.storage
    .from("site-audio")
    .list(pathValidation.directory, { search: pathValidation.fileName, limit: 10 });
  if (storageListError) {
    console.error("[api/admin/site-audio] upload verification failed:", storageListError);
    return NextResponse.json({ error: "تعذر التحقق من الملف المرفوع. أعد المحاولة." }, { status: 503 });
  }
  const objectValidation = validateSiteAudioStorageObject({
    fileName: pathValidation.fileName,
    mimeType,
    sizeBytes,
    objects: objects ?? [],
  });
  if (!objectValidation.ok) {
    const error = objectValidation.reason === "missing_object"
      ? "لم يكتمل رفع الملف إلى التخزين بعد."
      : objectValidation.reason === "size_mismatch"
        ? "حجم الملف المخزن لا يطابق الحجم المرسل."
        : objectValidation.reason === "mime_mismatch"
          ? "نوع الملف المخزن لا يطابق نوع الصوت المرسل."
          : "بيانات الملف المخزن غير مكتملة.";
    return NextResponse.json({ error }, { status: objectValidation.reason === "missing_object" ? 409 : 400 });
  }

  const { data, error } = await db
    .from("site_audio_assets")
    .insert({
      kind,
      title,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      created_by: guard.profile.id,
    })
    .select(select)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const auditRecorded = await recordAuditSafely({
    action: "site_audio.asset.create",
    permission: "audio.manage",
    resourceType: "site_audio_assets",
    resourceId: data.id,
    metadata: { kind, mimeType, sizeBytes },
  }, "asset creation");
  let uploadIntentFinalized = true;
  try {
    await supabaseServerAdminRequest(
      `/rest/v1/site_audio_upload_intents?storage_path=eq.${encodeURIComponent(storagePath)}&owner_user_id=eq.${encodeURIComponent(guard.profile.id)}&status=eq.pending`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "registered",
          asset_id: data.id,
          updated_at: new Date().toISOString(),
        }),
      },
    );
  } catch (intentUpdateError) {
    // The asset row is already the authoritative reference. The guarded
    // retention command will reconcile this intent instead of deleting it.
    uploadIntentFinalized = false;
    console.error("[api/admin/site-audio] upload intent finalization deferred:", intentUpdateError);
  }

  return NextResponse.json({ asset: data, auditRecorded, uploadIntentFinalized }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("audio.manage");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const parsedBody = await readBoundedJsonBody(request);
  if (!parsedBody.ok) {
    return NextResponse.json({ error: parsedBody.error }, { status: parsedBody.status });
  }
  const body = parsedBody.value && typeof parsedBody.value === "object" && !Array.isArray(parsedBody.value)
    ? parsedBody.value as Record<string, unknown>
    : null;
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const kind = typeof body?.kind === "string" ? body.kind : "";
  if (!id || !KINDS.has(kind)) return NextResponse.json({ error: "بيانات المقطع غير صالحة." }, { status: 400 });

  try {
    await supabaseServerAdminRequest("/rest/v1/rpc/admin_set_primary_site_audio_asset", {
      method: "POST",
      headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        p_asset_id: id,
        p_kind: kind,
        p_actor_user_id: guard.profile.id,
      }),
    });
  } catch (error) {
    console.error("[api/admin/site-audio] PATCH error:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: message.includes("site audio asset not found") ? "المقطع غير موجود ضمن هذا النوع." : "تعذر تعيين المقطع الأساسي." },
      { status: message.includes("site audio asset not found") ? 404 : 500 },
    );
  }

  const { data, error } = await createAdminClient()
    .from("site_audio_assets")
    .select(select)
    .eq("id", id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // The database RPC commits the primary switch and its audit event atomically.
  // Do not append a second API-level event for the same action.
  return NextResponse.json({ asset: data, auditRecorded: true });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminStepUpApi("audio.manage", "/admin/site-audio");
  if (!guard.ok) return NextResponse.json({ error: guard.error, nextPath: "nextPath" in guard ? guard.nextPath : undefined }, { status: guard.status, headers: { "Cache-Control": "no-store" } });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف المقطع مطلوب." }, { status: 400 });

  const db = createAdminClient();
  const { data: asset, error: findError } = await db
    .from("site_audio_assets")
    .select("id,kind,storage_path,is_primary,created_by,mime_type,size_bytes")
    .eq("id", id)
    .single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 404 });

  if (asset.storage_path.startsWith("curated:")) {
    return NextResponse.json({ error: "المقاطع المنتمية إلى المكتبة الموثوقة للقراءة فقط ولا يمكن حذفها من هذه الواجهة." }, { status: 409 });
  }
  if (asset.is_primary === true) {
    return NextResponse.json({ error: "لا يمكن حذف المقطع الأساسي. عيّن مقطعًا آخر كأساسي أولًا." }, { status: 409 });
  }

  const isRemoteUrl = /^https?:\/\//i.test(asset.storage_path);
  let storageDirectory = "";
  let storageFileName = "";
  if (!isRemoteUrl) {
    const pathOwnerId = asset.storage_path.split("/")[0] ?? "";
    const ownerId = (typeof asset.created_by === "string" && asset.created_by.trim()
      ? asset.created_by.trim()
      : pathOwnerId).toLowerCase();
    if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(ownerId)) {
      return NextResponse.json({ error: "تعذر تحديد مالك مسار التخزين بأمان؛ راجع مسؤول النظام." }, { status: 409 });
    }
    const pathValidation = validateSiteAudioUploadPath({
      ownerId,
      storagePath: asset.storage_path,
      mimeType: asset.mime_type,
      sizeBytes: Number(asset.size_bytes),
    });
    if (!pathValidation.ok) {
      return NextResponse.json({ error: "مسار التخزين لا يملك سجل تنظيف آمنًا؛ راجع مسؤول النظام قبل الحذف." }, { status: 409 });
    }
    storageDirectory = pathValidation.directory;
    storageFileName = pathValidation.fileName;

    const now = new Date();
    const { error: intentError } = await db.from("site_audio_upload_intents").upsert({
      storage_path: asset.storage_path,
      owner_user_id: ownerId,
      mime_type: asset.mime_type.trim().toLowerCase(),
      size_bytes: asset.size_bytes,
      upload_expires_at: new Date(now.getTime() - 1_000).toISOString(),
      cleanup_after: new Date(now.getTime() + 24 * 60 * 60 * 1_000).toISOString(),
      status: "pending",
      asset_id: asset.id,
      updated_at: now.toISOString(),
    }, { onConflict: "storage_path" });
    if (intentError) {
      console.error("[api/admin/site-audio] could not create a safe deletion intent:", intentError);
      return NextResponse.json({ error: "تعذر تجهيز سجل تنظيف آمن؛ لم يُحذف المقطع." }, { status: 503 });
    }
  }

  // Delete only if the asset is still non-primary. The intent is already durable,
  // so a failed Storage removal can be retried after the 24-hour retention window.
  const { data: deleted, error } = await db
    .from("site_audio_assets")
    .delete()
    .eq("id", id)
    .eq("is_primary", false)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted?.length) {
    return NextResponse.json({ error: "تم تغيير المقطع أو تفعيله كأساسي بواسطة مستخدم آخر. حدّث القائمة قبل إعادة المحاولة." }, { status: 409 });
  }

  let storageCleanupPending = false;
  let intentFinalizationPending = false;
  if (!isRemoteUrl) {
    const { error: storageError } = await db.storage.from("site-audio").remove([asset.storage_path]);
    if (storageError) {
      storageCleanupPending = true;
      console.error("[api/admin/site-audio] Storage cleanup deferred to the guarded retention worker:", storageError.message);
    } else {
      const { data: remainingObjects, error: verificationError } = await db.storage
        .from("site-audio")
        .list(storageDirectory, { search: storageFileName, limit: 10 });
      const objectStillPresent = Array.isArray(remainingObjects) &&
        remainingObjects.some((object) => object.name === storageFileName);
      if (verificationError || !Array.isArray(remainingObjects) || objectStillPresent) {
        storageCleanupPending = true;
        console.error("[api/admin/site-audio] Storage removal could not be verified; retention worker will retry:", verificationError?.message ?? "object remains or inventory is incomplete");
      } else {
        const { error: intentUpdateError } = await db
          .from("site_audio_upload_intents")
          .update({ status: "cleaned", asset_id: null, updated_at: new Date().toISOString() })
          .eq("storage_path", asset.storage_path)
          .eq("status", "pending");
        if (intentUpdateError) {
          intentFinalizationPending = true;
          console.error("[api/admin/site-audio] Storage intent finalization deferred:", intentUpdateError.message);
        }
      }
    }
  }

  const auditRecorded = await recordAuditSafely({
    action: "site_audio.asset.delete",
    permission: "audio.manage",
    resourceType: "site_audio_assets",
    resourceId: id,
    metadata: { kind: asset.kind, storageCleanupPending, intentFinalizationPending },
  }, "asset deletion");
  return NextResponse.json({ ok: true, storageCleanupPending, intentFinalizationPending, auditRecorded });
}
