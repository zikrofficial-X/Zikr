import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

const RETIRED_RESPONSE = {
  ok: false,
  code: "SOCIAL_PUBLISHING_RETIRED",
  error: "تم إيقاف إدارة ونشر المنصات الخارجية. تُدار مكتبة الفيديو والمحتوى من داخل ZIKR فقط.",
};

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(RETIRED_RESPONSE, {
    status: 410,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const publishAuth = await requireAdminApi("social.publish");
  if (!publishAuth.ok) return NextResponse.json({ error: publishAuth.error }, { status: publishAuth.status });
  return NextResponse.json(RETIRED_RESPONSE, {
    status: 410,
    headers: { "Cache-Control": "no-store" },
  });
}
