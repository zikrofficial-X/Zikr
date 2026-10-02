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
      { href: "/admin/automation", label: "التشغيل الآلي", permission: "system.manage" },
      { href: "/admin/health", label: "صحة النظام", permission: "system.manage" },
      { href: "/admin/notifications", label: "التنبيهات", permission: "notifications.manage" },
      { href: "/admin/audit", label: "سجل التدقيق", permission: "audit.read" },
      { href: "/admin/release", label: "مركز الإصدار", permission: "release.manage" },
    ],
  },
  {
    key: "content",
    label: "المحتوى والمعرفة",
    items: [
      { href: "/admin/content", label: "إدارة المحتوى", permission: "content.manage" },
      { href: "/admin/library", label: "مكتبة المحتوى", permission: "library.manage" },
      { href: "/admin/sources", label: "مصادر المحتوى", permission: "sources.manage" },
      { href: "/admin/editorial", label: "التحرير والنشر", permission: "knowledge.manage" },
      { href: "/admin/knowledge", label: "المعرفة الإسلامية", permission: "knowledge.manage" },
      { href: "/admin/prophets", label: "الأنبياء", permission: "prophets.manage" },
      { href: "/admin/battles", label: "الغزوات", permission: "battles.manage" },
      { href: "/admin/categories", label: "التصنيفات", permission: "content.manage" },
      { href: "/admin/sections", label: "الأقسام وترتيبها", permission: "sections.manage" },
      { href: "/admin/search", label: "البحث والفهرسة", permission: "content.manage" },
    ],
  },
  {
    key: "video-media",
    label: "الفيديو والوسائط",
    items: [
      { href: "/admin/video-factory", label: "مصنع الفيديو", permission: "video.manage" },
      { href: "/admin/ai-video", label: "استوديو إنشاء الفيديو", permission: "video.manage" },
      { href: "/admin/ai-video/curated", label: "المحتوى الموثق للفيديو", permission: "video.manage" },
      { href: "/admin/videos", label: "طابور توليد الفيديو", permission: "video.manage" },
      { href: "/admin/video-factory/sources", label: "مصادر الفيديو", permission: "video.manage" },
      { href: "/admin/video-factory/scripts", label: "نصوص السرد", permission: "video.manage" },
      { href: "/admin/video-factory/voices", label: "الأصوات", permission: "video.manage" },
      { href: "/admin/video-factory/visuals", label: "العناصر المرئية", permission: "video.manage" },
      { href: "/admin/video-factory/templates", label: "القوالب", permission: "video.manage" },
      { href: "/admin/video-factory/qa", label: "ضبط الجودة", permission: "video.manage" },
      { href: "/admin/media", label: "مكتبة الوسائط", permission: "media.manage" },
    ],
  },
  {
    key: "audio",
    label: "الصوت",
    items: [
      { href: "/admin/audio", label: "مركز الصوت", permission: "audio.manage" },
      { href: "/admin/audio/quran", label: "تلاوات القرآن", permission: "audio.manage" },
      { href: "/admin/audio/adhan", label: "الأذان", permission: "audio.manage" },
      { href: "/admin/audio/tts", label: "تحويل النص إلى صوت", permission: "audio.manage" },
      { href: "/admin/site-audio", label: "صوت الموقع والتذكيرات", permission: "audio.manage" },
    ],
  },
  {
    key: "social",
    label: "النشر الاجتماعي",
    items: [
      { href: "/admin/social", label: "مركز النشر الاجتماعي", permission: "social.manage" },
    ],
  },
  {
    key: "kids",
    label: "قسم الأطفال",
    items: [
      { href: "/admin/kids", label: "لوحة الأطفال", permission: "kids.manage" },
      { href: "/admin/kids/content", label: "محتوى الأطفال", permission: "kids.manage" },
      { href: "/admin/kids/games", label: "الألعاب", permission: "kids.manage" },
      { href: "/admin/kids/levels", label: "المستويات", permission: "kids.manage" },
      { href: "/admin/kids/assets", label: "الأصول", permission: "kids.manage" },
      { href: "/admin/kids/analytics", label: "تحليلات الأطفال", permission: "kids.manage" },
    ],
  },
  {
    key: "users-analytics",
    label: "المستخدمون والتحليلات",
    items: [
      { href: "/admin/users", label: "المستخدمون والأدوار", permission: "users.read" },
      { href: "/admin/analytics", label: "تحليلات المنصة", permission: "analytics.read" },
    ],
  },
  {
    key: "system",
    label: "الأمن والإعدادات",
    items: [
      { href: "/admin/security", label: "أمن لوحة الإدارة", permission: "security.manage" },
      { href: "/admin/seo", label: "تحسين الظهور", permission: "settings.manage" },
      { href: "/admin/android", label: "إصدار أندرويد", permission: "android.manage" },
      { href: "/admin/settings", label: "إعدادات الإدارة", permission: "settings.manage" },
    ],
  },
] as const;
