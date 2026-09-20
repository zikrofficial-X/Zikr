import { NextResponse } from "next/server";
import { getStories } from "@/features/stories/services/stories";

export async function GET() {
  try {
    return NextResponse.json(await getStories());
  } catch (error) {
    console.error("[api/content/stories] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 },
    );
  }
}
