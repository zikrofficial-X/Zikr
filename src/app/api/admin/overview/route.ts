import { NextResponse } from "next/server";
import { getAdminOverview } from "@/features/admin/services/platform";
import { requireAdminApi } from "@/features/admin/services/admin";
import { ADMIN_TABLE_PERMISSIONS, hasAdminPermission } from "@/features/admin/services/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi("dashboard.view");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const overview = await getAdminOverview();
    const role = auth.profile.role;
    const counts = Object.fromEntries(
      Object.entries(overview.counts).filter(([table]) =>
        ADMIN_TABLE_PERMISSIONS[table as keyof typeof ADMIN_TABLE_PERMISSIONS] && hasAdminPermission(role, ADMIN_TABLE_PERMISSIONS[table as keyof typeof ADMIN_TABLE_PERMISSIONS])
      ),
    );
    const unavailable = [...overview.unavailable];
    const canReadVideo = hasAdminPermission(role, "video.manage");
    const canReadSocial = hasAdminPermission(role, "social.manage");
    if (!canReadVideo && !unavailable.includes("video_generation_requests")) unavailable.push("video_generation_requests");
    if (!canReadSocial && !unavailable.includes("social_publish_queue")) unavailable.push("social_publish_queue");

    return NextResponse.json({
      ...overview,
      counts,
      videoGeneration: canReadVideo ? overview.videoGeneration : {},
      socialQueue: canReadSocial ? overview.socialQueue : {},
      unavailable,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[api/admin/overview] GET:", error);
    return NextResponse.json(
      { error: "تعذر تحميل ملخص لوحة الإدارة." },
      { status: 500 },
    );
  }
}
