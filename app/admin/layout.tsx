import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { LibraryAdminNav } from '@/components/admin/library-nav';
import { requireAdmin } from '@/lib/services/admin';

export const metadata: Metadata = {
  title: 'لوحة التحكم | ذِكرٌ',
  description: 'لوحة تحكم الأدمن لإدارة الموقع بالكامل',
  robots: { index: false, follow: false },
};

const adminUtilityLinks = [
  { href: '/admin/control', label: 'مركز التحكم' },
  { href: '/admin/search', label: 'بحث مركزي' },
  { href: '/admin/audit', label: 'سجل الإدارة' },
  { href: '/admin/health', label: 'صحة النظام' },
  { href: '/admin/notifications', label: 'التنبيهات' },
  { href: '/admin/security', label: 'الأمن والصلاحيات' },
  { href: '/admin/settings', label: 'إعدادات الإدارة' },
  { href: '/admin/release', label: 'مركز الإصدار' },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen bg-brand-emeraldDeep" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-brand-gold/10 bg-black/15 px-4 py-2.5">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {adminUtilityLinks.map((item) => (
                <Link key={item.href} href={item.href} className="inline-flex items-center rounded-xl border border-brand-gold/15 bg-brand-gold/5 px-3 py-1.5 text-xs font-semibold text-brand-gold/90 transition hover:border-brand-gold/35 hover:bg-brand-gold/10">
                  {item.label}
                </Link>
              ))}
            </div>
            <span className="text-[11px] text-brand-cream/30">الوصول والتنفيذ يخضعان لمصفوفة RBAC المركزية.</span>
          </div>
        </div>
        <LibraryAdminNav />
        <div className="lg:hidden border-b border-brand-gold/15 bg-black/25 sticky top-16 z-30">
          <nav aria-label="تنقل لوحة التحكم" className="flex flex-wrap items-center gap-1 px-4 py-2.5 overflow-x-auto">
            {[
              { href: '/admin', label: 'الرئيسية' },
              ...adminUtilityLinks,
              { href: '/admin/library', label: 'المكتبة الإسلامية' },
              { href: '/admin/content', label: 'المحتوى' },
              { href: '/admin/knowledge', label: 'المعرفة الإسلامية' },
              { href: '/admin/sections', label: 'الأقسام' },
              { href: '/admin/users', label: 'المستخدمون' },
              { href: '/admin/videos', label: 'الفيديوهات' },
              { href: '/admin/android', label: 'إصدار Android' },
              { href: '/admin/social', label: 'النشر التلقائي' },
              { href: '/admin/analytics', label: 'التحليلات' },
              { href: '/admin/kids', label: 'الأطفال' },
              { href: '/admin/prophets', label: 'الأنبياء' },
              { href: '/admin/battles', label: 'الغزوات' },
              { href: '/admin/site-audio', label: 'مقاطع الأذان والتذكير' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-xs text-brand-cream/65 transition-colors hover:bg-brand-gold/10 hover:text-brand-gold whitespace-nowrap">
                {item.label}
              </Link>
            ))}
            <Link href="/" className="mr-auto rounded-lg border border-brand-gold/25 px-3 py-1.5 text-xs text-brand-gold/80 transition-colors hover:border-brand-gold hover:text-brand-gold whitespace-nowrap">
              عرض الموقع
            </Link>
          </nav>
        </div>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
