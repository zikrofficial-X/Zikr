import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/features/admin/services/admin";
import { recordAdminAuditEvent } from "@/features/admin/services/audit";
import { runPostCommitAudit } from "@/features/admin/services/post-commit-audit";
import { createVideoGenerationRequest } from "@/features/videos/services/video-automation";
import {
  isVideoTemplateAssetAllowedForAudience,
  parseVideoTemplateConfig,
  type VideoTemplateAudience,
} from "@/features/videos/services/template-config";
import { versionedTemplateLabel } from "@/features/videos/services/video-template-version";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TemplateRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  audience: VideoTemplateAudience;
  asset_key: string;
};
type VersionRow = {
  id: string;
  template_id: string;
  version: number;
  config: unknown;
  status: "draft" | "approved" | "active" | "retired";
  is_system_seed: boolean;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  activated_by: string | null;
  activated_at: string | null;
  created_at: string;
};
type PreviewRow = {
  id: string;
  title: string;
  status: string;
  video_url: string | null;
  error_message: string | null;
  created_at: string;
  content: unknown;
};

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function uuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getTemplate(templateId: string) {
  const rows = await supabaseServerAdminRequest<TemplateRow[]>(
    `/rest/v1/video_templates?id=eq.${encodeURIComponent(templateId)}&select=id,slug,title,description,audience,asset_key&limit=1`,
  );
  return rows?.[0] ?? null;
}

async function getVersion(versionId: string) {
  const rows = await supabaseServerAdminRequest<VersionRow[]>(
    `/rest/v1/video_template_versions?id=eq.${encodeURIComponent(versionId)}&select=id,template_id,version,config,status,is_system_seed,created_by,reviewed_by,reviewed_at,activated_by,activated_at,created_at&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function GET() {
  const auth = await requireAdminApi("video.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const [templates, versions] = await Promise.all([
      supabaseServerAdminRequest<TemplateRow[]>(
        "/rest/v1/video_templates?select=id,slug,title,description,audience,asset_key&order=audience.asc,slug.asc",
      ),
      supabaseServerAdminRequest<VersionRow[]>(
        "/rest/v1/video_template_versions?select=id,template_id,version,config,status,is_system_seed,created_by,reviewed_by,reviewed_at,activated_by,activated_at,created_at&order=version.desc&limit=300",
      ),
    ]);
    let previews: PreviewRow[] = [];
    try {
      previews = await supabaseServerAdminRequest<PreviewRow[]>(
        "/rest/v1/video_generation_requests?content->>templatePreview=eq.true&select=id,title,status,video_url,error_message,created_at,content&order=created_at.desc&limit=30",
      ) ?? [];
    } catch (error) {
      console.warn("[admin/video/templates] preview history unavailable", error instanceof Error ? error.message : String(error));
    }
    return NextResponse.json(
      { templates: templates ?? [], versions: versions ?? [], previews },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[admin/video/templates] GET failed", error);
    return NextResponse.json({ error: "تعذر تحميل مكتبة القوالب وإصداراتها." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi("video.manage");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = object(await request.json().catch(() => null));
    if (!body || typeof body.action !== "string") {
      return NextResponse.json({ error: "طلب القالب غير صالح." }, { status: 400 });
    }

    if (body.action === "create-version") {
      if (!uuid(body.templateId)) return NextResponse.json({ error: "معرّف القالب غير صالح." }, { status: 400 });
      const template = await getTemplate(body.templateId);
      if (!template) return NextResponse.json({ error: "القالب غير موجود." }, { status: 404 });
      const config = parseVideoTemplateConfig(body.config);
      if (!config || !isVideoTemplateAssetAllowedForAudience(config.assetKey, template.audience)) {
        return NextResponse.json({ error: "إعدادات القالب أو الأصل المرئي لا تتوافق مع نوع الجمهور." }, { status: 400 });
      }
      const created = await supabaseServerAdminRequest<Array<{ id: string; version: number }>>(
        "/rest/v1/rpc/admin_create_video_template_version",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            p_template_id: template.id,
            p_config: config,
            p_actor_user_id: auth.profile.id,
          }),
        },
      );
      const version = created?.[0];
      if (!version) throw new Error("Template version RPC returned no version.");
      const auditRecorded = await runPostCommitAudit(
        () => recordAdminAuditEvent({
        action: "video_template.version.create",
        permission: "video.manage",
        resourceType: "video_template_versions",
        resourceId: version.id,
        metadata: { templateId: template.id, slug: template.slug, version: version.version, assetKey: config.assetKey },
        }),
        (auditError) => console.error("[api/admin/video/templates] audit event failed after committed mutation:", auditError),
      );
      return NextResponse.json({ ok: true, version, auditRecorded }, { status: 201 });
    }

    if (body.action === "approve-version") {
      if (!uuid(body.versionId)) return NextResponse.json({ error: "معرّف الإصدار غير صالح." }, { status: 400 });
      const version = await getVersion(body.versionId);
      if (!version) return NextResponse.json({ error: "الإصدار غير موجود." }, { status: 404 });
      if (version.status !== "draft") return NextResponse.json({ error: "يمكن اعتماد المسودات فقط." }, { status: 409 });
      if (version.created_by === auth.profile.id) {
        return NextResponse.json({ error: "يجب أن يراجع الإصدار مسؤول مختلف عن منشئه." }, { status: 409 });
      }
      const reviewedAt = new Date().toISOString();
      const updated = await supabaseServerAdminRequest<Array<{ id: string }>>(
        `/rest/v1/video_template_versions?id=eq.${encodeURIComponent(version.id)}&status=eq.draft`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ status: "approved", reviewed_by: auth.profile.id, reviewed_at: reviewedAt }),
        },
      );
      if (!updated?.[0]) return NextResponse.json({ error: "تغيرت حالة الإصدار قبل اكتمال المراجعة؛ حدّث الصفحة." }, { status: 409 });
      const auditRecorded = await runPostCommitAudit(
        () => recordAdminAuditEvent({
        action: "video_template.version.approve",
        permission: "video.manage",
        resourceType: "video_template_versions",
        resourceId: version.id,
        metadata: { templateId: version.template_id, version: version.version },
        }),
        (auditError) => console.error("[api/admin/video/templates] audit event failed after committed mutation:", auditError),
      );
      return NextResponse.json({ ok: true, id: version.id, auditRecorded });
    }

    if (body.action === "activate-version") {
      if (!uuid(body.versionId)) return NextResponse.json({ error: "معرّف الإصدار غير صالح." }, { status: 400 });
      const version = await getVersion(body.versionId);
      if (!version) return NextResponse.json({ error: "الإصدار غير موجود." }, { status: 404 });
      if (!version.is_system_seed && version.status !== "approved" && version.status !== "retired" && version.status !== "active") {
        return NextResponse.json({ error: "لا يمكن تفعيل إصدار قبل مراجعته واعتماده." }, { status: 409 });
      }
      await supabaseServerAdminRequest(
        "/rest/v1/rpc/activate_video_template_version",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ p_version_id: version.id, p_actor_user_id: auth.profile.id }),
        },
      );
      const auditRecorded = await runPostCommitAudit(
        () => recordAdminAuditEvent({
        action: "video_template.version.activate",
        permission: "video.manage",
        resourceType: "video_template_versions",
        resourceId: version.id,
        metadata: { templateId: version.template_id, version: version.version, previousStatus: version.status },
        }),
        (auditError) => console.error("[api/admin/video/templates] audit event failed after committed mutation:", auditError),
      );
      return NextResponse.json({ ok: true, id: version.id, auditRecorded });
    }

    if (body.action === "preview-version") {
      if (!uuid(body.versionId)) return NextResponse.json({ error: "معرّف الإصدار غير صالح." }, { status: 400 });
      const version = await getVersion(body.versionId);
      if (!version) return NextResponse.json({ error: "الإصدار غير موجود." }, { status: 404 });
      const template = await getTemplate(version.template_id);
      if (!template) return NextResponse.json({ error: "القالب المرتبط بالإصدار غير موجود." }, { status: 404 });
      const config = parseVideoTemplateConfig(version.config);
      if (!config || !isVideoTemplateAssetAllowedForAudience(config.assetKey, template.audience)) {
        return NextResponse.json({ error: "إعدادات الإصدار لا تجتاز عقد الرندر." }, { status: 422 });
      }
      const label = versionedTemplateLabel(template.slug, version.version);
      const sampleText = "هذه معاينة داخلية لقالب ذِكر. نختبر وضوح النص العربي، وتوازن الخلفية، ومقاس الفيديو، وحركة المشهد قبل اعتماد الإصدار.";
      const preview = await createVideoGenerationRequest({
        title: `معاينة ${template.title} — الإصدار ${version.version}`,
        description: `معاينة داخلية غير قابلة للنشر العام لقالب ${template.title}.`,
        category: "other",
        content: {
          renderer: "template",
          workflow: "admin-template-preview",
          templatePreview: true,
          skipSocialPublish: true,
          templateId: template.id,
          templateSlug: template.slug,
          templateVersionId: version.id,
          templateVersion: label,
          templateAssetKey: config.assetKey,
          templateMotion: config.motion,
          templateConfigSnapshot: config,
          audience: template.audience,
          videoFormat: config.defaultFormat,
          resolution: config.defaultFormat === "vertical" ? "1080x1920" : "1920x1080",
          language: "ar",
          textAr: sampleText,
          sourceLabel: "معاينة داخلية — لا تمثل محتوى دينيًا منشورًا",
        },
      });
      if (!preview) throw new Error("Could not create preview video request.");
      const auditRecorded = await runPostCommitAudit(
        () => recordAdminAuditEvent({
        action: "video_template.version.preview",
        permission: "video.manage",
        resourceType: "video_generation_requests",
        resourceId: preview.id,
        metadata: { templateId: template.id, templateVersionId: version.id, version: version.version, publicPublishingDisabled: true },
        }),
        (auditError) => console.error("[api/admin/video/templates] audit event failed after committed mutation:", auditError),
      );
      return NextResponse.json({ ok: true, preview, auditRecorded }, { status: 201 });
    }

    return NextResponse.json({ error: "إجراء القالب غير معروف." }, { status: 400 });
  } catch (error) {
    console.error("[admin/video/templates] POST failed", error);
    return NextResponse.json({ error: "تعذر تنفيذ عملية القالب." }, { status: 500 });
  }
}
