import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { LibraryAdminNav } from '@/components/admin/library-nav';
import { requireAdmin, getCurrentProfile } from '@/lib/services/admin';
import { hasAdminPermission, type AdminPermission } from '@/lib/services/admin-permissions';

export const metadata: Metadata = {
  title: 'لوحة التحكم | ذِكرٌ',
  description: 'لوحة تحكم الأدمن لإدارة الموقع بالكامل',
  robots: { index: false, follow: false },
};

const adminUtilityLinks = [
  { href: '/admin/control', label: 'مركز التحكم', permission: 'system.manage' as AdminPermission },
  { href: '/admin/search', label: 'بحث مركزي', permission: 'content.manage' as AdminPermission },
  { href: '/admin/editorial', label: 'سير التحرير', permission: 'knowledge.manage' as AdminPermission },
  { href: '/admin/sources', label: 'المصادر', permission: 'sources.manage' as AdminPermission },
  { href: '/admin/media', label: 'الوسائط والحقوق', permission: 'media.manage' as AdminPermission },
  { href: '/admin/social-ops', label: 'عمليات السوشيال', permission: 'social.manage' as AdminPermission },
  { href: '/admin/audit', label: 'سجل الإدارة', permission: 'audit.read' as AdminPermission },
  { href: '/admin/health', label: 'صحة النظام', permission: 'system.manage' as AdminPermission },
  { href: '/admin/notifications', label: 'التنبيهات', permission: 'notifications.manage' as AdminPermission },
  { href: '/admin/security', label: 'الأمن والصلاحيات', permission: 'security.manage' as AdminPermission },
  { href: '/admin/settings', label: 'إعدادات الإدارة', permission: 'settings.manage' as AdminPermission },
  { href: '/admin/seo', label: 'SEO/AdSense', permission: 'settings.manage' as AdminPermission },
  { href: '/admin/automation', label: 'الأتمتة', permission: 'system.manage' as AdminPermission },
  { href: '/admin/release', label: 'مركز الإصدار', permission: 'release.manage' as AdminPermission },
  { href: '/admin/ai-video', label: 'استوديو AI للفيديو', permission: 'video.manage' as AdminPermission },
] as const;

const existingAdminLinks = [
  { href: '/admin/library', label: 'المكتبة الإسلامية', permission: 'library.manage' as AdminPermission },
  { href: '/admin/content', label: 'المحتوى', permission: 'content.manage' as AdminPermission },
  { href: '/admin/knowledge', label: 'المعرفة الإسلامية', permission: 'knowledge.manage' as AdminPermission },
  { href: '/admin/sections', label: 'الأقسام', permission: 'sections.manage' as AdminPermission },
  { href: '/admin/users', label: 'المستخدمون', permission: 'users.read' as AdminPermission },
  { href: '/admin/videos', label: 'الفيديوهات', permission: 'video.manage' as AdminPermission },
  { href: '/admin/android', label: 'إصدار Android', permission: 'android.manage' as AdminPermission },
  { href: '/admin/social', label: 'النشر التلقائي', permission: 'social.manage' as AdminPermission },
  { href: '/admin/analytics', label: 'التحليلات', permission: 'analytics.read' as AdminPermission },
  { href: '/admin/kids', label: 'الأطفال', permission: 'kids.manage' as AdminPermission },
  { href: '/admin/prophets', label: 'الأنبياء', permission: 'prophets.manage' as AdminPermission },
  { href: '/admin/battles', label: 'الغزوات', permission: 'battles.manage' as AdminPermission },
  { href: '/admin/site-audio', label: 'مقاطع الأذان والتذكير', permission: 'audio.manage' as AdminPermission },
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const currentProfile = await getCurrentProfile();
  const role = currentProfile?.role ?? profile.role;
  const visibleUtilityLinks = adminUtilityLinks.filter(item => hasAdminPermission(role, item.permission));
  const visibleExistingLinks = existingAdminLinks.filter(item => hasAdminPermission(role, item.permission));

  return (
    <div className="flex min-h-screen bg-brand-emeraldDeep" dir="rtl">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-brand-gold/10 bg-black/15 px-4 py-2.5">
          <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {visibleUtilityLinks.map((item) => (
                <Link key={item.href} href={item.href} className="inline-flex items-center rounded-xl border border-brand-gold/15 bg-brand-gold/5 px-3 py-1.5 text-xs font-semibold text-brand-gold/90 transition hover:border-brand-gold/35 hover:bg-brand-gold/10">
                  {item.label}
                </Link>
              ))}
            </div>
            <span className="text-[11px] text-brand-cream/30">RBAC مركزي · تدقيق · حماية العمليات الحساسة · إدارة التشغيل</span>
          </div>
        </div>
        <LibraryAdminNav />
        <div className="lg:hidden border-b border-brand-gold/15 bg-black/25 sticky top-16 z-30">
          <nav aria-label="تنقل لوحة التحكم" className="flex flex-wrap items-center gap-1 px-4 py-2.5 overflow-x-auto">
            {[
              { href: '/admin', label: 'الرئيسية' },
              ...visibleUtilityLinks,
              ...visibleExistingLinks,
            ].map((item) => (
              <Link key={item.href} href={item.href} className="rounded-lg px-3 py-1.5 text-xs text-brand-cream/65 transition-colors hover:bg-brand-gold/10 hover:text-brand-gold whitespace-nowrap">
                {item.label}
              </Link>
            ))}
            <Link href="/" className="mr-auto rounded-lg border border-brand-gold/25 px-3 py-1.5 text-xs text-brand-gold/80 transition-colors hover:border-brand-gold hover:text-brand-gold whitespace-nowrap">عرض الموقع</Link>
          </nav>
        </div>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
