import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import AdminAiVideoClient from "./ai-video-client";

export const dynamic = "force-dynamic";

export default async function AdminAiVideoPage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="py-8">
      <div className="mb-5 flex justify-end">
        <Link href="/admin/ai-video/curated" className="rounded-xl border border-brand-gold/20 px-4 py-2 text-sm text-brand-gold hover:bg-brand-gold/10">
          مكتبة المحتوى الموثق
        </Link>
      </div>
      <AdminAiVideoClient />
    </Container>
  );
}
