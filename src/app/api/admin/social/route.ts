import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

function retiredResponse() {
  return NextResponse.json(
    {
      code: "SOCIAL_PUBLISHING_RETIRED",
      error: "النشر الاجتماعي الخارجي متوقف. المحتوى والفيديوهات والنشر الداخلي للموقع ما زالت متاحة.",
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return retiredResponse();
}

export async function POST() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const publishAuth = await requireAdminApi("social.publish");
  if (!publishAuth.ok) {
    return NextResponse.json({ error: publishAuth.error }, { status: publishAuth.status });
  }
  return retiredResponse();
}
