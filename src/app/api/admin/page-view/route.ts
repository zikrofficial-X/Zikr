import { NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { readBoundedJsonBody } from "@/lib/request/bounded-json-body";
import { recordAdminPageView } from "@/features/admin/services/analytics";

export async function POST(request: Request) {
  const auth = await requireAdminApi("analytics.read");
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  const bodyResult = await readBoundedJsonBody(request, 4 * 1024);
  if (!bodyResult.ok) {
    return NextResponse.json(
      { error: bodyResult.error },
      { status: bodyResult.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  const body = bodyResult.value && typeof bodyResult.value === "object" && !Array.isArray(bodyResult.value)
    ? bodyResult.value as Record<string, unknown>
    : {};
  const route = typeof body.route === "string" ? body.route : "/admin";
  await recordAdminPageView(route, auth.profile.id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
