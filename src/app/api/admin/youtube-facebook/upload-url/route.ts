import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminApi("media.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({
    error: "تم إيقاف رفع ملفات الوسائط الموجهة إلى منصات خارجية داخل ZIKR.",
    code: "EXTERNAL_SOCIAL_MEDIA_IMPORT_RETIRED",
  }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
