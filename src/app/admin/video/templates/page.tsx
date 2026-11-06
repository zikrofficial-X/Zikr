import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import TemplateStudioClient from "@/features/admin/video-templates/components/template-studio-client";

export const dynamic = "force-dynamic";

export default async function VideoFactoryTemplatesPage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="space-y-8 py-10 text-right" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/video" className="text-xs text-brand-gold/60 hover:text-brand-gold">← العودة إلى مصنع الفيديو</Link>
        <Link href="/admin/video/qa" className="text-xs text-brand-cream/50 hover:text-brand-gold">مركز الجودة</Link>
      </div>
      <TemplateStudioClient />
    </Container>
  );
}
