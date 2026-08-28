import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { requireAdmin } from '@/lib/services/admin';

export const metadata: Metadata = {
  title: 'لوحة التحكم | ذِكرٌ',
  description: 'لوحة تحكم الأدمن لإدارة الموقع بالكامل',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Enforce admin auth at the layout level so ALL admin routes — including
  // client-rendered pages that cannot call requireAdmin() themselves — are
  // protected. requireAdmin() redirects to /auth/login or /profile on failure.
  await requireAdmin();
  return (
    <div className="flex min-h-screen bg-brand-emeraldDeep" dir="rtl">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile nav fallback) */}
        <div className="lg:hidden border-b border-brand-gold/15 bg-black/25 sticky top-16 z-30">
          <nav
            aria-label="تنقل لوحة التحكم"
            className="flex flex-wrap items-center gap-1 px-4 py-2.5 overflow-x-auto"
          >
            {[
              { href: '/admin', label: 'الرئيسية' },
              { href: '/admin/content', label: 'المحتوى' },
              { href: '/admin/knowledge', label: 'المعرفة الإسلامية' },
              { href: '/admin/sections', label: 'الأقسام' },
              { href: '/admin/users', label: 'المستخدمون' },
              { href: '/admin/videos', label: 'الفيديوهات' },
              { href: '/admin/social', label: 'النشر التلقائي' },
              { href: '/admin/analytics', label: 'التحليلات' },
              { href: '/admin/kids', label: 'الأطفال' },
              { href: '/admin/prophets', label: 'الأنبياء' },
              { href: '/admin/battles', label: 'الغزوات' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-xs text-brand-cream/65 transition-colors hover:bg-brand-gold/10 hover:text-brand-gold whitespace-nowrap"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="mr-auto rounded-lg border border-brand-gold/25 px-3 py-1.5 text-xs text-brand-gold/80 transition-colors hover:border-brand-gold hover:text-brand-gold whitespace-nowrap"
            >
              عرض الموقع
            </Link>
          </nav>
        </div>

        {/* Page content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
