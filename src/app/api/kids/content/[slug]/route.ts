import { NextResponse } from "next/server";
import { getKidsContentBySlug } from "@/features/kids/services/kids-content";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const item = await getKidsContentBySlug(slug);
    if (!item) {
      return NextResponse.json(
        { error: "Kids content not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(item, {
      headers: {
        "Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=1800",
      },
    });
  } catch (error) {
    console.error("[api/kids/content/[slug]] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch kids content" },
      { status: 500 },
    );
  }
}
