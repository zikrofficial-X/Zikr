import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { getAdminAnalytics } from "@/features/admin/services/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi("analytics.read");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await getAdminAnalytics();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[api/admin/analytics] GET:", error);
    return NextResponse.json(
      { error: "تعذر تحميل تحليلات الإدارة." },
      { status: 500 },
    );
  }
}
