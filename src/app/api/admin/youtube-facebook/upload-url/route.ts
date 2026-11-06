import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminApi("media.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({
    ok: false,
    code: "EXTERNAL_VIDEO_IMPORT_RETIRED",
    error: "استيراد الوسائط المخصص لمزامنة YouTube وFacebook متوقف. استخدم ملفات الفيديو المنتجة داخليًا في مكتبة ZIKR.",
  }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
