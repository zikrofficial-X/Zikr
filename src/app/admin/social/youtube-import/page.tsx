export const dynamic = "force-dynamic";

import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { supabaseServerAdminRequest } from "@/lib/supabase/server";
import YoutubeMediaImporter from "./YoutubeMediaImporter";

type Job = {
  id: string;
  source_video_id: string;
  title: string;
  status: string;
  source_media_url: string | null;
  source_media_path: string | null;
  facebook_post_id: string | null;
};

export default async function YoutubeFacebookImportPage() {
  await requireAdminPermission("social.manage");
  let jobs: Job[] = [];

  try {
    jobs =
      (await supabaseServerAdminRequest<Job[]>(
        "/rest/v1/social_sync_jobs?select=id,source_video_id,title,status,source_media_url,source_media_path,facebook_post_id&order=source_published_at.asc.nullslast"
      )) || [];
  } catch (error) {
    console.error("[admin/youtube-import] Failed to load jobs:", error);
  }

  return (
    <Container className="space-y-8 py-10 text-right">
      <section className="space-y-2">
        <div className="text-sm text-brand-cream/45">النشر التلقائي / YouTube → Facebook</div>
        <h1 className="text-3xl font-bold text-brand-gold">استيراد ملفات فيديو YouTube</h1>
        <p className="max-w-3xl text-sm leading-7 text-brand-cream/60">
          ارفع النسخ الأصلية للفيديوهات القديمة إلى ZIKR. بعد الرفع يتم ربط الملف بالفيديو،
          ووضعه في Queue تلقائيًا ليقوم نظام النشر الحالي بإرساله إلى Facebook مع منع التكرار.
        </p>
      </section>
      <YoutubeMediaImporter initialJobs={jobs} />
    </Container>
  );
}
