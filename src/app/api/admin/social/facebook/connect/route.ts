import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Kept only for the historical permission-contract test. No Meta OAuth is started.
const REQUIRED_PERMISSIONS = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "pages_manage_engagement", "read_insights"];

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({
    error: "تم إيقاف ربط Facebook وواجهات النشر الخارجية في ZIKR.",
    code: "FACEBOOK_INTEGRATION_RETIRED",
    historicalPermissions: REQUIRED_PERMISSIONS,
  }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
