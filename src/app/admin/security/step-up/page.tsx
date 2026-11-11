import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { AdminStepUp } from "@/features/admin/components/admin-step-up";
import { sanitizeInternalPath } from "@/lib/safe-redirect";

export const metadata: Metadata = { title: "تحقق إضافي | الأدمن" };

export default async function AdminStepUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await requireAdminPermission("admin.access");
  const params = await searchParams;
  const candidate = sanitizeInternalPath(params.next);
  const nextPath = candidate === "/admin" || candidate.startsWith("/admin/") ? candidate : "/admin";

  return (
    <Container className="py-16 max-w-xl" dir="rtl">
      <section className="rounded-3xl border border-brand-gold/15 bg-black/20 p-6 md:p-8">
        <p className="text-xs tracking-[0.2em] text-brand-cream/30">STEP-UP AUTHENTICATION</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-gold">تحقق إضافي مطلوب</h1>
        <p className="mt-2 mb-5 text-sm leading-7 text-brand-cream/50">هذا الإجراء حساس وتم تفعيل MFA للعمليات المدمرة. أكمل رمز تطبيق المصادقة ثم سيعود النظام للصفحة المطلوبة.</p>
        <AdminStepUp nextPath={nextPath} />
      </section>
    </Container>
  );
}
