import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

const retired = {
  error: "تم إيقاف مصنع المنشورات الموجهة للمنصات الخارجية. استخدم مولّد المقالات الداخلي في ZIKR.",
  code: "EXTERNAL_WRITTEN_PUBLISHING_RETIRED",
};

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json(retired, { status: 410, headers: { "Cache-Control": "no-store" } });
}

export async function POST() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const publishAuth = await requireAdminApi("social.publish");
  if (!publishAuth.ok) return NextResponse.json({ error: publishAuth.error }, { status: publishAuth.status });
  return NextResponse.json(retired, { status: 410, headers: { "Cache-Control": "no-store" } });
}
