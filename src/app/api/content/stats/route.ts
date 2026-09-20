import { getContentStats } from "@/features/content/services/stats";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getContentStats();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load library statistics" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
