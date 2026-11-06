import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({
    ok: false,
    code: "FACEBOOK_INTEGRATION_RETIRED",
    error: "تم إيقاف ربط Facebook في ZIKR.",
  }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
