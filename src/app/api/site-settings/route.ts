import { NextResponse } from "next/server";
import { getSiteSetting } from "@/lib/services/site-content";

export const dynamic = "force-dynamic";

/**
 * Public, read-only homepage settings. Sensitive admin configuration is never
 * stored in this response; only the public homepage value is returned.
 */
export async function GET() {
  const setting = await getSiteSetting("homepage");
  return NextResponse.json(
    { data: setting },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}
