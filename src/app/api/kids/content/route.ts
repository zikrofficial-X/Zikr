import { NextResponse } from "next/server";
import { getKidsContent } from "@/features/kids/services/kids-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getKidsContent(), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("[api/kids/content] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch kids content" }, { status: 500 });
  }
}
