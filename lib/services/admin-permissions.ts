export const ADMIN_PERMISSIONS = {
  'admin.access': 'الوصول إلى لوحة الإدارة',
  'dashboard.view': 'عرض لوحة التحكم',
  'content.manage': 'إدارة المحتوى التحريري',
  'content.publish': 'نشر وإلغاء نشر المحتوى',
  'content.delete': 'حذف المحتوى',
  'library.manage': 'إدارة مكتبة المحتوى',
  'sources.manage': 'إدارة مصادر المحتوى',
  'knowledge.manage': 'إدارة المعرفة الإسلامية',
  'kids.manage': 'إدارة محتوى الأطفال',
  'prophets.manage': 'إدارة قصص الأنبياء',
  'battles.manage': 'إدارة الغزوات والبيانات التاريخية',
  'media.manage': 'إدارة الوسائط',
  'video.manage': 'إدارة الفيديوهات والتوليد',
  'social.manage': 'إدارة النشر الاجتماعي',
  'sections.manage': 'إدارة ظهور وترتيب الأقسام',
  'users.read': 'عرض المستخدمين',
  'users.roles': 'إدارة أدوار المستخدمين',
  'analytics.read': 'عرض التحليلات',
  'audio.manage': 'إدارة المقاطع الصوتية',
  'android.manage': 'إدارة إصدارات Android',
  'settings.manage': 'إدارة إعدادات الموقع',
  'audit.read': 'عرض سجل الإدارة',
  'system.manage': 'إدارة عمليات النظام والتشغيل',
} as const;

export type AdminPermission = keyof typeof ADMIN_PERMISSIONS;
export type AdminRole = 'user' | 'admin';

const ALL_ADMIN_PERMISSIONS = Object.keys(ADMIN_PERMISSIONS) as AdminPermission[];

/**
 * First-stage RBAC matrix.
 * `admin` keeps the current full-access behavior while permissions become
 * explicit and can later be assigned to additional roles without changing
 * every action again. Regular users intentionally receive no admin grants.
 */
export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  user: [],
  admin: ALL_ADMIN_PERMISSIONS,
};

export function hasAdminPermission(role: AdminRole, permission: AdminPermission): boolean {
  return ADMIN_ROLE_PERMISSIONS[role].includes(permission);
}

export function getAdminPermissions(role: AdminRole): readonly AdminPermission[] {
  return ADMIN_ROLE_PERMISSIONS[role];
}
