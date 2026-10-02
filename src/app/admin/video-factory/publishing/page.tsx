import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { Container } from "@/components/ui/container";

export const dynamic = "force-dynamic";

export default async function VideoFactoryPublishingPage() {
  await requireAdminPermission("video.manage");
  return (
    <Container className="space-y-6 py-10" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.22em] text-brand-cream/30">VIDEO FACTORY / PUBLISHING</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">Publishing</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/55">التسليم للنشر جزء من مصنع الفيديو، بينما تنفيذ قوائم النشر والمنصات ما زال في مركز Social الموحد.</p>
      </header>
      <Link href="/admin/social" className="inline-flex rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold">فتح مركز النشر الاجتماعي ←</Link>
    </Container>
  );
}
