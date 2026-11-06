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
 * - تسع وحدات تشغيلية واضحة بدل تجميع الوظائف غير المتجانسة.
 * - لا تُحذف المسارات القديمة من دون إثبات عدم استخدامها؛ التحويلات تبقى في ملفاتها.
 * - الصلاحية على مستوى العنصر، والـlayout يفلتر العناصر حسب الدور.
 * - كل مسار ظاهر هنا يمثل صفحة تشغيلية رسمية واحدة.
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
    ],
  },
  {
    key: "content",
    label: "إدارة المحتوى",
    items: [
      { href: "/admin/content", label: "إدارة المحتوى", permission: "content.manage" },
      { href: "/admin/library", label: "مكتبة المحتوى", permission: "library.manage" },
      { href: "/admin/editorial", label: "التحرير والنشر", permission: "knowledge.manage" },
      { href: "/admin/categories", label: "التصنيفات", permission: "content.manage" },
      { href: "/admin/sections", label: "الأقسام وترتيبها", permission: "sections.manage" },
      { href: "/admin/search", label: "البحث والفهرسة", permission: "content.manage" },
    ],
  },
  {
    key: "knowledge",
    label: "المصادر والمعرفة",
    items: [
      { href: "/admin/sources", label: "مصادر المحتوى", permission: "sources.manage" },
      { href: "/admin/knowledge", label: "المعرفة الإسلامية", permission: "knowledge.manage" },
      { href: "/admin/prophets", label: "الأنبياء", permission: "prophets.manage" },
      { href: "/admin/battles", label: "الغزوات", permission: "battles.manage" },
    ],
  },
  {
    key: "video-production",
    label: "مصنع الفيديوهات",
    items: [
      { href: "/admin/video", label: "مركز الفيديو والإنتاج", permission: "video.manage" },
      { href: "/admin/video/requests", label: "طلبات الفيديو والطابور", permission: "video.manage" },
      { href: "/admin/video/studio", label: "استوديو الفيديو", permission: "video.manage" },
      { href: "/admin/video/studio/curated", label: "المحتوى الموثق للفيديو", permission: "video.manage" },
      { href: "/admin/video/sources", label: "مصادر الفيديو", permission: "video.manage" },
      { href: "/admin/video/scripts", label: "نصوص السرد", permission: "video.manage" },
      { href: "/admin/video/voices", label: "الأصوات", permission: "video.manage" },
      { href: "/admin/video/visuals", label: "العناصر المرئية", permission: "video.manage" },
      { href: "/admin/video/templates", label: "استوديو القوالب", permission: "video.manage" },
      { href: "/admin/video/qa", label: "ضبط الجودة", permission: "video.manage" },
    ],
  },
  {
    key: "publishing",
    label: "النشر والتوزيع",
    items: [
      { href: "/admin/social", label: "مركز النشر الاجتماعي", permission: "social.manage" },
      { href: "/admin/social/written-studio", label: "مصنع المنشورات المكتوبة", permission: "social.manage" },
    ],
  },
  {
    key: "media-audio",
    label: "الوسائط والصوت",
    items: [
      { href: "/admin/media", label: "مكتبة الوسائط", permission: "media.manage" },
      { href: "/admin/audio", label: "مركز الصوت", permission: "audio.manage" },
      { href: "/admin/audio/quran", label: "تلاوات القرآن", permission: "audio.manage" },
      { href: "/admin/audio/adhan", label: "الأذان", permission: "audio.manage" },
      { href: "/admin/audio/tts", label: "تحويل النص إلى صوت", permission: "audio.manage" },
      { href: "/admin/site-audio", label: "صوت الموقع والتذكيرات", permission: "audio.manage" },
    ],
  },
  {
    key: "kids",
    label: "عالم الأطفال",
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
    key: "growth",
    label: "النمو والتحليلات",
    items: [
      { href: "/admin/analytics", label: "تحليلات المنصة", permission: "analytics.read" },
      { href: "/admin/seo", label: "تحسين الظهور", permission: "settings.manage" },
    ],
  },
  {
    key: "system-security",
    label: "النظام والأمان",
    items: [
      { href: "/admin/audit", label: "سجل التدقيق", permission: "audit.read" },
      { href: "/admin/release", label: "مركز الإصدار", permission: "release.manage" },
      { href: "/admin/users", label: "المستخدمون والأدوار", permission: "users.read" },
      { href: "/admin/security", label: "أمن لوحة الإدارة", permission: "security.manage" },
      { href: "/admin/android", label: "إصدار أندرويد", permission: "android.manage" },
      { href: "/admin/settings", label: "إعدادات الإدارة", permission: "settings.manage" },
    ],
  },
] as const;
