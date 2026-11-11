import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { requireAdminStepUpApi } from "@/features/admin/services/security";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { dispatchGitHubWorkflow } from "@/lib/github/dispatch-workflow";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import { parseWrittenGenerationRequest } from "@/features/social/services/written-content";

export const dynamic = "force-dynamic";

type WrittenQueueItem = {
  id: string;
  title: string;
  body: string | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  published_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
};

function queueCutoff() {
  const cutoff = new Date(process.env.SOCIAL_PUBLISH_AFTER ?? "2026-11-06T20:00:00Z");
  if (!Number.isFinite(cutoff.getTime())) throw new Error("Invalid social publishing cutoff.");
  return encodeURIComponent(cutoff.toISOString());
}

export async function GET() {
  const auth = await requireAdminApi("social.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const rows = await supabaseServerAdminRequest<WrittenQueueItem[]>(
      "/rest/v1/social_publish_queue?content_type=eq.written_post&created_at=gte." +
        queueCutoff() +
        "&select=id,title,body,status,created_at,scheduled_at,published_at,error_message,metadata" +
        "&order=created_at.desc&limit=100",
    );
    return NextResponse.json(
      { items: rows ?? [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/social/written] GET:", error);
    return NextResponse.json(
      { error: "تعذر تحميل منشورات فيسبوك المكتوبة." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: NextRequest) {
  const manageAuth = await requireAdminApi("social.manage");
  if (!manageAuth.ok) return NextResponse.json({ error: manageAuth.error }, { status: manageAuth.status });
  const publishAuth = await requireAdminStepUpApi("social.publish", "/admin/social/written-studio");
  if (!publishAuth.ok) return NextResponse.json({ error: publishAuth.error, nextPath: "nextPath" in publishAuth ? publishAuth.nextPath : undefined }, { status: publishAuth.status, headers: { "Cache-Control": "no-store" } });

  try {
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
    }
    const parsedRequest = parseWrittenGenerationRequest(requestBody);
    if (!parsedRequest.ok) {
      const message = parsedRequest.reason === "invalid_category"
        ? "تصنيف المحتوى غير صالح."
        : parsedRequest.reason === "invalid_batch_size"
          ? "عدد المنشورات يجب أن يكون من 1 إلى 3."
          : "بيانات الطلب غير صالحة.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { category, batchSize: requestedBatchSize } = parsedRequest.value;

    const dispatch = await dispatchGitHubWorkflow("generate-written-content.yml", {
      category,
      batch_size: String(requestedBatchSize),
    });

    try {
      await recordAdminAuditEvent({
        action: "social.written.generate",
        permission: "social.publish",
        resourceType: "social_publish_queue",
        metadata: {
          category,
          batchSize: requestedBatchSize,
          workflowFile: dispatch.workflowFile,
          repository: dispatch.repository,
        },
      });
    } catch (auditError) {
      console.warn("[api/admin/social/written] audit event unavailable:", auditError);
    }

    return NextResponse.json(
      {
        ok: true,
        workflow: dispatch.workflowFile,
        message: "تم إرسال طلب إنشاء منشورات فيسبوك المكتوبة.",
      },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/admin/social/written] POST:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تعذر تشغيل مولّد منشورات فيسبوك." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
