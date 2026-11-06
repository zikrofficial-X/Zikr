import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Kept only for the historical permission-contract test. No Meta token is exchanged or stored.
const REQUIRED_PERMISSIONS = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_manage_engagement", "read_insights"] as const;

export async function GET(_request: NextRequest) {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({
    error: "تم إيقاف callback الخاص بـFacebook. لم يتم تبادل أو حفظ أي رمز وصول.",
    code: "FACEBOOK_INTEGRATION_RETIRED",
    historicalPermissions: REQUIRED_PERMISSIONS,
  }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
