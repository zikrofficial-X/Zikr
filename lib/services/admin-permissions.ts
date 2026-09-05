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
  'video.delete': 'حذف عمليات توليد الفيديو',
  'social.manage': 'إدارة النشر الاجتماعي',
  'social.publish': 'تنفيذ النشر الاجتماعي',
  'sections.manage': 'إدارة ظهور وترتيب الأقسام',
  'users.read': 'عرض المستخدمين',
  'users.roles': 'إدارة أدوار المستخدمين',
  'analytics.read': 'عرض التحليلات',
  'audio.manage': 'إدارة المقاطع الصوتية',
  'android.manage': 'إدارة إصدارات Android',
  'settings.manage': 'إدارة إعدادات الموقع',
  'audit.read': 'عرض سجل الإدارة',
  'notifications.manage': 'إدارة إشعارات الإدارة',
  'security.manage': 'إدارة أمن لوحة الإدارة',
  'release.manage': 'إدارة مركز الإصدار',
  'system.manage': 'إدارة عمليات النظام والتشغيل',
} as const;

export type AdminPermission = keyof typeof ADMIN_PERMISSIONS;
export type AdminRole = 'user' | 'admin';

const ALL_ADMIN_PERMISSIONS = Object.keys(ADMIN_PERMISSIONS) as AdminPermission[];

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
