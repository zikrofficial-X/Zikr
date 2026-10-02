import Link from "next/link";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { Container } from "@/components/ui/container";

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  await requireAdminPermission("notifications.manage");
  return (
    <Container className="space-y-6 py-10" dir="rtl">
      <header>
        <p className="text-xs tracking-[0.22em] text-brand-cream/30">OPERATIONS / ALERTS</p>
        <h1 className="mt-2 text-3xl font-bold text-brand-gold">Alerts</h1>
        <p className="mt-2 text-sm leading-7 text-brand-cream/55">نقطة الدخول الرسمية لتنبيهات الإدارة. التنفيذ الحالي محفوظ في مركز التنبيهات القائم لضمان عدم تكرار منطق الإشعارات.</p>
      </header>
      <Link href="/admin/notifications" className="inline-flex rounded-xl border border-brand-gold/25 px-4 py-2 text-sm text-brand-gold">فتح مركز التنبيهات ←</Link>
    </Container>
  );
}
