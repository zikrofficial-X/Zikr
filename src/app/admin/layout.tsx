import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminMobileNav, AdminSidebar, type AdminNavGroup } from '@/features/admin/components/admin-sidebar';
import { requireAdmin, getCurrentProfile } from '@/features/admin/services/admin';
import { hasAdminPermission, type AdminPermission } from '@/features/admin/services/permissions';

export const metadata: Metadata = {
  title: 'لوحة التحكم | ذِكرٌ',
  description: 'لوحة تحكم الأدمن لإدارة الموقع بالكامل',
  robots: { index: false, follow: false },
};

type PermissionLink = { href: string; label: string; permission: AdminPermission };

type PermissionGroup = { group: string; items: PermissionLink[] };

const navigation: PermissionGroup[] = [
  { group: 'مركز التشغيل', items: [
    { href: '/admin', label: 'الرئيسية', permission: 'system.manage' },
    { href: '/admin/control', label: 'مركز التحكم', permission: 'system.manage' },
    { href: '/admin/analytics', label: 'التحليلات', permission: 'analytics.read' },
    { href: '/admin/health', label: 'صحة النظام', permission: 'system.manage' },
    { href: '/admin/audit', label: 'سجل الإدارة', permission: 'audit.read' },
    { href: '/admin/notifications', label: 'التنبيهات', permission: 'notifications.manage' },
  ] },
  { group: 'المحتوى والمراجعة', items: [
    { href: '/admin/library', label: 'المكتبة الإسلامية', permission: 'library.manage' },
    { href: '/admin/content', label: 'المحتوى', permission: 'content.manage' },
    { href: '/admin/knowledge', label: 'المعرفة الإسلامية', permission: 'knowledge.manage' },
    { href: '/admin/editorial', label: 'سير التحرير', permission: 'knowledge.manage' },
    { href: '/admin/sections', label: 'الأقسام', permission: 'sections.manage' },
    { href: '/admin/sources', label: 'المصادر والتوثيق', permission: 'sources.manage' },
    { href: '/admin/search', label: 'البحث المركزي', permission: 'content.manage' },
    { href: '/admin/prophets', label: 'قصص الأنبياء', permission: 'prophets.manage' },
    { href: '/admin/battles', label: 'الغزوات', permission: 'battles.manage' },
    { href: '/admin/kids', label: 'محتوى الأطفال', permission: 'kids.manage' },
  ] },
  { group: 'الوسائط والفيديو', items: [
    { href: '/admin/media', label: 'الوسائط والحقوق', permission: 'media.manage' },
    { href: '/admin/videos', label: 'الفيديوهات', permission: 'video.manage' },
    { href: '/admin/ai-video', label: 'استوديو توليد الفيديو', permission: 'video.manage' },
    { href: '/admin/site-audio', label: 'الأذان والتذكير', permission: 'audio.manage' },
  ] },
  { group: 'النشر والتطبيق', items: [
    { href: '/admin/social', label: 'النشر التلقائي', permission: 'social.manage' },
    { href: '/admin/social-ops', label: 'عمليات السوشيال', permission: 'social.manage' },
    { href: '/admin/android', label: 'إصدار Android', permission: 'android.manage' },
    { href: '/admin/release', label: 'مركز الإصدار', permission: 'release.manage' },
  ] },
  { group: 'المستخدمون والإعدادات', items: [
    { href: '/admin/users', label: 'المستخدمون', permission: 'users.read' },
    { href: '/admin/security', label: 'الأمن والصلاحيات', permission: 'security.manage' },
    { href: '/admin/settings', label: 'إعدادات الإدارة', permission: 'settings.manage' },
    { href: '/admin/seo', label: 'SEO وAdSense', permission: 'settings.manage' },
    { href: '/admin/automation', label: 'الأتمتة', permission: 'system.manage' },
  ] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const currentProfile = await getCurrentProfile();
  const role = currentProfile?.role ?? profile.role;
  const visibleGroups: AdminNavGroup[] = navigation.map((group) => ({
    group: group.group,
    items: group.items.filter((item) => hasAdminPermission(role, item.permission)).map(({ href, label }) => ({ href, label })),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex min-h-screen bg-brand-emeraldDeep" dir="rtl">
      <AdminSidebar groups={visibleGroups} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-brand-gold/10 bg-black/15 px-4 py-3">
          <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3">
            <div><p className="text-sm font-bold text-brand-gold">مركز إدارة منصة ذِكرٌ</p><p className="text-[11px] text-brand-cream/40">تنقل موحد · صلاحيات حسب الدور · سجل تدقيق مركزي</p></div>
            <Link href="/" className="hidden rounded-lg border border-brand-gold/25 px-3 py-1.5 text-xs text-brand-gold/80 transition hover:bg-brand-gold/10 sm:inline-flex">عرض الموقع</Link>
          </div>
        </div>
        <AdminMobileNav groups={visibleGroups} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
