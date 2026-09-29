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

export const ADMIN_NAVIGATION: readonly AdminNavigationGroup[] = [
  {
    key: "operations",
    label: "مركز التشغيل",
    items: [
      { href: "/admin", label: "لوحة العمليات", permission: "dashboard.view" },
      { href: "/admin/analytics", label: "التحليلات", permission: "analytics.read" },
      { href: "/admin/health", label: "صحة النظام", permission: "system.manage" },
      { href: "/admin/audit", label: "سجل الإدارة", permission: "audit.read" },
      { href: "/admin/notifications", label: "التنبيهات", permission: "notifications.manage" },
      { href: "/admin/automation", label: "الأتمتة", permission: "system.manage" },
    ],
  },
  {
    key: "content",
    label: "المحتوى والمراجعة",
    items: [
      { href: "/admin/library", label: "المكتبة", permission: "library.manage" },
      { href: "/admin/content", label: "المحتوى التحريري", permission: "content.manage" },
      { href: "/admin/knowledge", label: "المعرفة الإسلامية", permission: "knowledge.manage" },
      { href: "/admin/editorial", label: "سير التحرير", permission: "knowledge.manage" },
      { href: "/admin/sections", label: "أقسام الموقع", permission: "sections.manage" },
      { href: "/admin/sources", label: "المصادر والتوثيق", permission: "sources.manage" },
      { href: "/admin/search", label: "البحث المركزي", permission: "content.manage" },
      { href: "/admin/prophets", label: "قصص الأنبياء", permission: "prophets.manage" },
      { href: "/admin/battles", label: "الغزوات", permission: "battles.manage" },
      { href: "/admin/kids", label: "محتوى الأطفال", permission: "kids.manage" },
    ],
  },
  {
    key: "media",
    label: "الوسائط والفيديو",
    items: [
      { href: "/admin/media", label: "الوسائط والحقوق", permission: "media.manage" },
      { href: "/admin/videos", label: "طابور الفيديو", permission: "video.manage" },
      { href: "/admin/ai-video", label: "استوديو الفيديو", permission: "video.manage" },
      { href: "/admin/site-audio", label: "الصوت والأذان", permission: "audio.manage" },
    ],
  },
  {
    key: "publishing",
    label: "النشر والإصدار",
    items: [
      { href: "/admin/social", label: "النشر الاجتماعي", permission: "social.manage" },
      { href: "/admin/android", label: "إصدارات Android", permission: "android.manage" },
      { href: "/admin/release", label: "بوابة الإصدار", permission: "release.manage" },
    ],
  },
  {
    key: "access",
    label: "المستخدمون والأمن",
    items: [
      { href: "/admin/users", label: "المستخدمون", permission: "users.read" },
      { href: "/admin/security", label: "الأمن والصلاحيات", permission: "security.manage" },
      { href: "/admin/settings", label: "إعدادات الإدارة", permission: "settings.manage" },
      { href: "/admin/seo", label: "SEO وAdSense", permission: "settings.manage" },
    ],
  },
] as const;
