import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { Container } from "@/components/ui/container";

export const dynamic = "force-dynamic";

export default async function KidsContentPage() {
  await requireAdminPermission("kids.manage");
  return (
    <Container className="space-y-6 py-10" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.22em] text-brand-cream/30">KIDS / CONTENT</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">Content</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/55">نقطة الدخول الرسمية لمحتوى الأطفال. التنفيذ الحالي ما زال في صفحة Kids الحالية للحفاظ على الاستقرار أثناء إعادة التنظيم.</p>
      </header>
      <Link href="/admin/kids" className="inline-flex rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold">فتح مركز محتوى الأطفال ←</Link>
    </Container>
  );
}
