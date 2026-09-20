import { NextResponse } from "next/server";
import { getAdminOverview } from "@/features/admin/services/platform";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminApi("dashboard.view");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    return NextResponse.json(await getAdminOverview(), {
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
