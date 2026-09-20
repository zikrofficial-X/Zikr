import { getAdminContentApi } from "@/features/admin/services/content";
import { requireAdminApi } from "@/features/admin/services/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await requireAdminApi("content.manage");
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status },
      );
    }

    const content = await getAdminContentApi();
    return NextResponse.json(content, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[api/admin/content] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 },
    );
  }
}
