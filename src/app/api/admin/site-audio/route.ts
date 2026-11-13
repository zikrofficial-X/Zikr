import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { createAdminClient, supabaseServerAdminRequest } from "@/lib/supabase/server";
import { validateSiteAudioStorageObject, validateSiteAudioUploadPath } from "@/features/audio/services/site-audio-upload-contract";

const KINDS = new Set(["adhan", "salawat", "dhikr"]);
const select = "id,kind,title,storage_path,mime_type,size_bytes,is_primary,created_at,updated_at";

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
  const body = await request.json().catch(() => null);
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
  return NextResponse.json({ asset: data, auditRecorded }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdminApi("audio.manage");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const body = await request.json().catch(() => null);
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
  const auditRecorded = await recordAuditSafely({
    action: "site_audio.asset.set_primary",
    permission: "audio.manage",
    resourceType: "site_audio_assets",
    resourceId: data.id,
    metadata: { kind, isPrimary: data.is_primary === true },
  }, "primary asset update");
  return NextResponse.json({ asset: data, auditRecorded });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminStepUpApi("audio.manage", "/admin/site-audio");
  if (!guard.ok) return NextResponse.json({ error: guard.error, nextPath: "nextPath" in guard ? guard.nextPath : undefined }, { status: guard.status, headers: { "Cache-Control": "no-store" } });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف المقطع مطلوب." }, { status: 400 });

  const db = createAdminClient();
  const { data: asset, error: findError } = await db
    .from("site_audio_assets")
    .select("id,kind,storage_path")
    .eq("id", id)
    .single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 404 });

  if (asset.storage_path.startsWith("curated:")) {
    return NextResponse.json({ error: "المقاطع المنتمية إلى المكتبة الموثوقة للقراءة فقط ولا يمكن حذفها من هذه الواجهة." }, { status: 409 });
  }

  if (!/^https?:\/\//i.test(asset.storage_path)) {
    const { error: storageError } = await db.storage.from("site-audio").remove([asset.storage_path]);
    if (storageError) {
      console.error("[site-audio] storage removal failed; database row retained for retry:", storageError.message);
      return NextResponse.json({ error: "تعذر حذف الملف من التخزين؛ لم يُحذف سجل المقطع حتى يمكن إعادة المحاولة.", storageCleanupPending: true }, { status: 502 });
    }
  }

  const { data: deleted, error } = await db
    .from("site_audio_assets")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted?.length) {
    return NextResponse.json({ error: "تم حذف المقطع أو تغييره بواسطة مستخدم آخر. تحقّق من التخزين قبل إعادة المحاولة." }, { status: 409 });
  }
  const storageCleanupPending = false;

  const auditRecorded = await recordAuditSafely({
    action: "site_audio.asset.delete",
    permission: "audio.manage",
    resourceType: "site_audio_assets",
    resourceId: id,
    metadata: { kind: asset.kind, storageCleanupPending },
  }, "asset deletion");
  return NextResponse.json({ ok: true, storageCleanupPending, auditRecorded });
}
