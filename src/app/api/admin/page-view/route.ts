import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { recordAdminPageView } from "@/features/admin/services/analytics";

export async function POST(request: Request) {
  const profile = await requireAdminPermission("analytics.read");
  const body = await request.json().catch(() => ({}));
  const route = typeof body.route === "string" ? body.route : "/admin";
  await recordAdminPageView(route, profile.id);
  return NextResponse.json({ ok: true });
}
