import { NextResponse } from "next/server";
import { getPrimarySiteAudioAssets } from "@/features/audio/services/site-audio";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const assets = await getPrimarySiteAudioAssets();
    return NextResponse.json(
      { assets },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      },
    );
  } catch (error) {
    console.error("[api/site-audio] GET error:", error);
    return NextResponse.json(
      { assets: {} },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
