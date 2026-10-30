import Link from "next/link";
import { Container } from "@/components/ui/container";
import AdminAiVideoClient from "@/app/admin/ai-video/ai-video-client";
import { AdminBreadcrumbs } from "@/features/admin/components/admin-breadcrumbs";
import { requireAdminPermission } from "@/features/admin/services/admin";

export const dynamic = "force-dynamic";

export default async function AdminVideoStudioPage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="py-8">
      <AdminBreadcrumbs current="استوديو الفيديو" />
      <div className="mb-5 flex justify-end">
        <Link href="/admin/video/studio/curated" className="rounded-xl border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
          مكتبة المحتوى الموثق
        </Link>
      </div>
      <AdminAiVideoClient />
    </Container>
  );
}
