import type { AdminPermission } from "@/features/admin/services/permissions";

export type AdminNavigationItem = {
  href: string;
  label: string;
  permission: AdminPermission;
  /** Stable icon key resolved by the admin shell; keeps presentation out of route logic. */
  icon: string;
};

export type AdminNavigationGroup = {
  key: string;
  label: string;
  icon: string;
  items: readonly AdminNavigationItem[];
};

/**
 * المصدر الوحيد لمسارات لوحة الإدارة الظاهرة.
 *
 * كل صفحة تشغيلية لها مالك واضح وصلاحية وأيقونة موحدة. المسارات القديمة لا
 * تُكرر هنا؛ تبقى كتحويلات توافقية فقط في سجل ADMIN_ROUTE_ALIASES.
 */
export const ADMIN_NAVIGATION: readonly AdminNavigationGroup[] = [
  {
    key: "operations",
    label: "التشغيل والمراقبة",
    icon: "activity",
    items: [
      { href: "/admin", label: "لوحة التحكم", permission: "dashboard.view", icon: "layout-dashboard" },
      { href: "/admin/queues", label: "مركز الطوابير", permission: "dashboard.view", icon: "list-checks" },
      { href: "/admin/automation", label: "التشغيل الآلي", permission: "system.manage", icon: "refresh-cw" },
      { href: "/admin/health", label: "صحة النظام", permission: "system.manage", icon: "heart-pulse" },
      { href: "/admin/notifications", label: "التنبيهات", permission: "notifications.manage", icon: "bell" },
    ],
  },
  {
    key: "content",
    label: "إدارة المحتوى",
    icon: "file-text",
    items: [
      { href: "/admin/content", label: "إدارة المحتوى", permission: "content.manage", icon: "file-text" },
      { href: "/admin/library", label: "مكتبة المحتوى", permission: "library.manage", icon: "library" },
      { href: "/admin/editorial", label: "التحرير والنشر", permission: "knowledge.manage", icon: "pen-line" },
      { href: "/admin/categories", label: "التصنيفات", permission: "content.manage", icon: "tags" },
      { href: "/admin/sections", label: "الأقسام وترتيبها", permission: "sections.manage", icon: "panels-top-left" },
      { href: "/admin/search", label: "البحث والفهرسة", permission: "content.manage", icon: "search" },
    ],
  },
  {
    key: "knowledge",
    label: "المصادر والمعرفة",
    icon: "book-open",
    items: [
      { href: "/admin/sources", label: "مصادر المحتوى", permission: "sources.manage", icon: "bookmark" },
      { href: "/admin/knowledge", label: "المعرفة الإسلامية", permission: "knowledge.manage", icon: "book-open" },
      { href: "/admin/prophets", label: "الأنبياء", permission: "prophets.manage", icon: "users" },
      { href: "/admin/battles", label: "الغزوات", permission: "battles.manage", icon: "swords" },
    ],
  },
  {
    key: "video-production",
    label: "مصنع الفيديوهات",
    icon: "clapperboard",
    items: [
      { href: "/admin/video", label: "مركز الفيديو والإنتاج", permission: "video.manage", icon: "clapperboard" },
      { href: "/admin/video/requests", label: "طلبات الفيديو والطابور", permission: "video.manage", icon: "list-todo" },
      { href: "/admin/video/studio", label: "استوديو الفيديو", permission: "video.manage", icon: "wand-sparkles" },
      { href: "/admin/video/studio/curated", label: "المحتوى الموثق للفيديو", permission: "video.manage", icon: "badge-check" },
      { href: "/admin/video/sources", label: "مصادر الفيديو", permission: "video.manage", icon: "database" },
      { href: "/admin/video/scripts", label: "نصوص السرد", permission: "video.manage", icon: "file-text" },
      { href: "/admin/video/voices", label: "الأصوات", permission: "video.manage", icon: "mic-2" },
      { href: "/admin/video/visuals", label: "العناصر المرئية", permission: "video.manage", icon: "image" },
      { href: "/admin/video/templates", label: "استوديو القوالب", permission: "video.manage", icon: "layout-template" },
      { href: "/admin/video/qa", label: "ضبط الجودة", permission: "video.manage", icon: "shield-check" },
    ],
  },
  {
    key: "memory",
    label: "الوسائط والذاكرة",
    icon: "database",
    items: [
      { href: "/admin/memory", label: "مكتبة الوسائط والذاكرة", permission: "media.manage", icon: "database" },
    ],
  },
  {
    key: "media-audio",
    label: "الوسائط والصوت",
    icon: "folder-open",
    items: [
      { href: "/admin/audio", label: "مركز الصوت", permission: "audio.manage", icon: "volume-2" },
      { href: "/admin/audio/quran", label: "تلاوات القرآن", permission: "audio.manage", icon: "headphones" },
      { href: "/admin/audio/adhan", label: "الأذان", permission: "audio.manage", icon: "radio" },
      { href: "/admin/audio/tts", label: "تحويل النص إلى صوت", permission: "audio.manage", icon: "mic-2" },
      { href: "/admin/site-audio", label: "صوت الموقع والتذكيرات", permission: "audio.manage", icon: "bell" },
    ],
  },
  {
    key: "social-publishing",
    label: "النشر والتواصل الاجتماعي",
    icon: "send",
    items: [
      { href: "/admin/social", label: "مركز النشر الاجتماعي", permission: "social.manage", icon: "send" },
      { href: "/admin/social/written-studio", label: "مصنع المنشورات المكتوبة", permission: "social.manage", icon: "file-text" },
    ],
  },
  {
    key: "kids",
    label: "عالم الأطفال",
    icon: "baby",
    items: [
      { href: "/admin/kids", label: "لوحة الأطفال", permission: "kids.manage", icon: "baby" },
      { href: "/admin/kids/content", label: "محتوى الأطفال", permission: "kids.manage", icon: "file-text" },
      { href: "/admin/kids/games", label: "الألعاب", permission: "kids.manage", icon: "gamepad-2" },
      { href: "/admin/kids/levels", label: "المستويات", permission: "kids.manage", icon: "layers" },
      { href: "/admin/kids/assets", label: "الأصول", permission: "kids.manage", icon: "image" },
      { href: "/admin/kids/analytics", label: "تحليلات الأطفال", permission: "kids.manage", icon: "bar-chart-3" },
    ],
  },
  {
    key: "growth",
    label: "النمو والتحليلات",
    icon: "bar-chart-3",
    items: [
      { href: "/admin/analytics", label: "تحليلات المنصة", permission: "analytics.read", icon: "bar-chart-3" },
      { href: "/admin/seo", label: "تحسين الظهور", permission: "site.metadata.manage", icon: "search-check" },
    ],
  },
  {
    key: "system-security",
    label: "النظام والأمان",
    icon: "shield",
    items: [
      { href: "/admin/audit", label: "سجل التدقيق", permission: "audit.read", icon: "scroll-text" },
      { href: "/admin/release", label: "مركز الإصدار", permission: "release.manage", icon: "rocket" },
      { href: "/admin/users", label: "المستخدمون والأدوار", permission: "users.read", icon: "users-round" },
      { href: "/admin/security", label: "أمن لوحة الإدارة", permission: "security.manage", icon: "shield-check" },
      { href: "/admin/android", label: "إصدار أندرويد", permission: "android.manage", icon: "smartphone" },
      { href: "/admin/settings", label: "إعدادات الإدارة", permission: "settings.manage", icon: "settings-2" },
    ],
  },
] as const;
