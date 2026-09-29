import type { Metadata } from "next";
import Link from "next/link";
import { AdminMobileNav, AdminSidebar, type AdminNavGroup } from "@/features/admin/components/admin-sidebar";
import { getCurrentProfile, requireAdmin } from "@/features/admin/services/admin";
import { hasAdminPermission, type AdminPermission } from "@/features/admin/services/permissions";
import { ADMIN_NAVIGATION } from "@/features/admin/config/navigation";

export const metadata: Metadata = {
  title: "لوحة الإدارة | ذِكرٌ",
  description: "مركز إدارة وتشغيل منصة ذِكرٌ",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const currentProfile = await getCurrentProfile();
  const role = currentProfile?.role ?? profile.role;

  const visibleGroups: AdminNavGroup[] = ADMIN_NAVIGATION
    .map((group) => ({
      group: group.label,
      items: group.items
        .filter((item) => hasAdminPermission(role, item.permission as AdminPermission))
        .map(({ href, label }) => ({ href, label })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-screen bg-brand-emeraldDeep" dir="rtl">
      <AdminSidebar groups={visibleGroups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-brand-gold/10 bg-black/15 px-4 py-3">
          <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-brand-gold">مركز إدارة منصة ذِكرٌ</p>
              <p className="text-[11px] text-brand-cream/40">صلاحيات حسب الدور · بيانات مباشرة · سجل تدقيق مركزي</p>
            </div>
            <Link href="/" className="hidden rounded-lg border border-brand-gold/25 px-3 py-1.5 text-xs text-brand-gold/80 transition hover:bg-brand-gold/10 sm:inline-flex">
              عرض الموقع
            </Link>
          </div>
        </div>
        <AdminMobileNav groups={visibleGroups} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
