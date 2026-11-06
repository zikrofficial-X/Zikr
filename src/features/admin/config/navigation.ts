import type { AdminPermission } from "@/features/admin/services/permissions";

export type AdminNavigationItem = {
  href: string;
  label: string;
  permission: AdminPermission;
};

export type AdminNavigationGroup = {
  key: string;
  label: string;
  items: readonly AdminNavigationItem[];
};

/**
 * البنية الموحدة للوحة الإدارة.
 *
 * القواعد:
 * - المسميات المعروضة للمستخدم عربية.
 * - كل مسار ظاهر هنا يمثل وحدة تشغيلية فعلية.
 * - المسارات القديمة/المكررة لا تظهر في التنقل؛ يتم تحويلها لمسارها الرسمي.
 * - الصلاحية على مستوى العنصر، والـlayout يفلتر العناصر حسب الدور.
 */
export const ADMIN_NAVIGATION: readonly AdminNavigationGroup[] = [
  {
    key: "operations",
    label: "التشغيل والمراقبة",
    items: [
      { href: "/admin", label: "لوحة التحكم", permission: "dashboard.view" },
      { href: "/admin/queues", label: "مركز الطوابير", permission: "dashboard.view" },
      { href: "/admin/automation", label: "التشغيل الآلي", permission: "system.manage" },
      { href: "/admin/health", label: "صحة النظام", permission: "system.manage" },
      { href: "/admin/notifications", label: "التنبيهات", permission: "notifications.manage" },
      { href: "/admin/audit", label: "سجل التدقيق", permission: ���q�^