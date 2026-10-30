import type { Metadata } from "next";
import Link from "next/link";
import { AdminMobileNav, AdminSidebar, type AdminNavGroup } from "@/features/admin/components/admin-sidebar";
import { requireAdmin } from "@/features/admin/services/admin";
import { hasAdminPermission, type AdminPermission } from "@/features/admin/services/permissions";
import { ADMIN_NAVIGATION } from "@/features/admin/config/navigation";
import { AdminPageViewTracker } from "@/features/admin/components/admin-page-view-tracker";
import { AdminCommandPalette } from "@/features/admin/components/admin-command-palette";

export const metadata: Metadata = {
  title: "لوحة الإدارة | ذِكرٌ",
  description: "مركز إدارة وتشغيل منصة ذِكرٌ",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const role = profile.role;

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
      <AdminPageViewTracker />
      <AdminSidebar groups={visibleGroups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 border-b border-brand-gold/10 bg-brand-emeraldDeep/95 px-4 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-brand-gold">مركز إدارة منصة ذِكرٌ</p>
              <p className="text-[11px] text-brand-cream/40">تنقل موحّد · صلاحيات حسب الدور</p>
            </div>
            <div className="flex items-center gap-2">
              <AdminCommandPalette groups={visibleGroups} />
              <div className="hidden rounded-lg border border-brand-gold/10 bg-black/10 px-3 py-1.5 text-right sm:block">
                <p className="text-[10px] text-brand-cream/30">{profile.email ?? "حساب الإدارة"}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-brand-gold">{String(role).replaceAll("_", " ")}</p>
              </div>
              <Link href="/" className="hidden rounded-lg border border-brand-gold/25 px-3 py-1.5 text-xs text-brand-gold/80 transition hover:bg-brand-gold/10 sm:inline-flex">
                عرض الموقع
              </Link>
            </div>
          </div>
        </div>
        <AdminMobileNav groups={visibleGroups} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
