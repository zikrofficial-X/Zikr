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
export type AdminAssignedRole =
  | 'super_admin'
  | 'content_manager'
  | 'editor'
  | 'video_manager'
  | 'social_manager'
  | 'moderator'
  | 'seo_manager'
  | 'analyst'
  | 'support';
export type AdminRole = 'user' | 'admin' | AdminAssignedRole;

const ALL_ADMIN_PERMISSIONS = Object.keys(ADMIN_PERMISSIONS) as AdminPermission[];

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, readonly AdminPermission[]> = {
  user: [],
  admin: ALL_ADMIN_PERMISSIONS,
  super_admin: ALL_ADMIN_PERMISSIONS,
  content_manager: [
    'admin.access', 'dashboard.view', 'content.manage', 'content.publish', 'content.delete',
    'library.manage', 'sources.manage', 'knowledge.manage', 'kids.manage', 'prophets.manage',
    'battles.manage', 'media.manage', 'sections.manage', 'analytics.read', 'audit.read',
  ],
  editor: [
    'admin.access', 'dashboard.view', 'content.manage', 'content.publish', 'library.manage',
    'sources.manage', 'knowledge.manage', 'kids.manage', 'prophets.manage', 'battles.manage',
    'media.manage', 'sections.manage', 'analytics.read',
  ],
  video_manager: [
    'admin.access', 'dashboard.view', 'media.manage', 'video.manage', 'video.delete',
    'analytics.read', 'audit.read',
  ],
  social_manager: [
    'admin.access', 'dashboard.view', 'media.manage', 'video.manage', 'social.manage',
    'social.publish', 'analytics.read', 'audit.read', 'notifications.manage',
  ],
  moderator: [
    'admin.access', 'dashboard.view', 'content.manage', 'library.manage', 'kids.manage',
    'analytics.read', 'audit.read',
  ],
  seo_manager: [
    'admin.access', 'dashboard.view', 'content.manage', 'analytics.read', 'settings.manage',
    'audit.read',
  ],
  analyst: [
    'admin.access', 'dashboard.view', 'analytics.read', 'audit.read',
  ],
  support: [
    'admin.access', 'dashboard.view', 'users.read', 'analytics.read', 'notifications.manage',
  ],
};

export function hasAdminPermission(role: AdminRole, permission: AdminPermission): boolean {
  return Boolean(ADMIN_ROLE_PERMISSIONS[role]?.includes(permission));
}

export function getAdminPermissions(role: AdminRole): readonly AdminPermission[] {
  return ADMIN_ROLE_PERMISSIONS[role] ?? [];
}
