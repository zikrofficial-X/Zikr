import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { createAdminClient, supabaseServerAdminRequest } from "@/lib/supabase/server";

const KINDS = new Set(["adhan", "salawat", "dhikr"]);
const select = "id,kind,title,storage_path,mime_type,size_bytes,is_primary,created_at,updated_at";

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
  if (!storagePath.startsWith(guard.profile.id.toLowerCase() + "/")) {
    return NextResponse.json({ error: "مسار الملف غير صالح." }, { status: 400 });
  }

  const { data, error } = await createAdminClient()
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
  await recordAdminAuditEvent({
    action: "site_audio.asset.create",
    permission: "audio.manage",
    resourceType: "site_audio_assets",
    resourceId: data.id,
    metadata: { kind, mimeType, sizeBytes },
  });
  return NextResponse.json({ asset: data }, { status: 201 });
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
  return NextResponse.json({ asset: data });
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdminApi("audio.manage");
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف المقطع مطلوب." }, { status: 400 });

  const db = createAdminClient();
  const { data: asset, error: findError } = await db
    .from("site_audio_assets")
    .select("id,kind,storage_path")
    .eq("id", id)
    .single();
  if (findError) return NextResponse.json({ error: findError.message }, { status: 404 });

  const { data: deleted, error } = await db
    .from("site_audio_assets")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!deleted?.length) {
    return NextResponse.json({ error: "تم حذف المقطع أو تغييره بواسطة مستخدم آخر." }, { status: 409 });
  }

  let storageCleanupPending = false;
  if (!asset.storage_path.startsWith("curated:") && !/^https?:\/\//i.test(asset.storage_path)) {
    const { error: storageError } = await db.storage.from("site-audio").remove([asset.storage_path]);
    if (storageError) {
      storageCleanupPending = true;
      console.error("[site-audio] orphaned storage object:", storageError.message);
    }
  }

  await recordAdminAuditEvent({
    action: "site_audio.asset.delete",
    permission: "audio.manage",
    resourceType: "site_audio_assets",
    resourceId: id,
    metadata: { kind: asset.kind, storageCleanupPending },
  });
  return NextResponse.json({ ok: true, storageCleanupPending });
}
