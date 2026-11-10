import { ADMIN_NAVIGATION } from "@/features/admin/config/navigation";
import type { AdminPermission } from "@/features/admin/services/permissions";

export type AdminModuleStatus = "active" | "transition" | "retired";
export type AdminModuleDefinition = {
  key: string;
  label: string;
  description: string;
  basePath: string;
  routes: readonly string[];
  permission: AdminPermission;
  permissions: readonly AdminPermission[];
  sourceTables: readonly string[];
  ownerRole: string;
  status: AdminModuleStatus;
};

const routesFor = (key: string) =>
  ADMIN_NAVIGATION.find((group) => group.key === key)?.items.map((item) => item.href) ?? [];

/**
 * بيانات ملكية الوحدات ومصادرها. المسارات نفسها لا تُنسخ هنا؛ تُقرأ من
 * ADMIN_NAVIGATION حتى لا ينفصل سجل الوحدات عن القائمة أو تتكرر المسارات.
 */
export const ADMIN_MODULES: readonly AdminModuleDefinition[] = [
  {
    key: "operations",
    label: "التشغيل والمراقبة",
    description: "لوحة التحكم والطوابير والأتمتة والتنبيهات ومتابعة صحة النظام.",
    basePath: "/admin",
    routes: routesFor("operations"),
    permission: "dashboard.view",
    permissions: ["dashboard.view", "system.manage", "notifications.manage"],
    sourceTables: ["admin_audit_events", "admin_queue_alert_deliveries", "admin_queue_alert_rules"],
    ownerRole: "super_admin",
    status: "active",
  },
  {
    key: "content",
    label: "إدارة المحتوى",
    description: "المكتبة والتحرير والتصنيفات والأقسام والبحث.",
    basePath: "/admin/content",
    routes: routesFor("content"),
    permission: "content.manage",
    permissions: ["content.manage", "library.manage", "knowledge.manage", "sections.manage"],
    sourceTables: ["content_library", "articles", "stories", "content_publish_queue", "content_translation_queue"],
    ownerRole: "content_manager",
    status: "active",
  },
  {
    key: "knowledge",
    label: "المصادر والمعرفة",
    description: "مصادر المحتوى والمعرفة الإسلامية والأنبياء والغزوات.",
    basePath: "/admin/sources",
    routes: routesFor("knowledge"),
    permission: "sources.manage",
    permissions: ["sources.manage", "knowledge.manage", "prophets.manage", "battles.manage"],
    sourceTables: ["content_sources", "hadiths", "duas", "prophets", "companions", "scholars"],
    ownerRole: "content_manager",
    status: "active",
  },
  {
    key: "video-production",
    label: "مصنع الفيديوهات",
    description: "الطلبات والاستوديو والمصادر والنصوص والأصوات والقوالب والجودة.",
    basePath: "/admin/video",
    routes: routesFor("video-production"),
    permission: "video.manage",
    permissions: ["video.manage"],
    sourceTables: ["video_generation_requests", "videos", "video_templates", "video_template_versions"],
    ownerRole: "video_manager",
    status: "active",
  },
  {
    key: "memory",
    label: "الذاكرة والمكتبة",
    description: "ملفات الوسائط وذاكرة المحتوى الداخلية ومخرجات التوليد.",
    basePath: "/admin/memory",
    routes: routesFor("memory"),
    permission: "media.manage",
    permissions: ["media.manage"],
    sourceTables: ["media_assets", "video_generation_requests", "videos"],
    ownerRole: "video_manager",
    status: "active",
  },
  {
    key: "media-audio",
    label: "الوسائط والصوت",
    description: "مكتبة الوسائط والتلاوات والأذان وتحويل النص إلى صوت والتذكيرات.",
    basePath: "/admin/media",
    routes: routesFor("media-audio"),
    permission: "media.manage",
    permissions: ["media.manage", "audio.manage"],
    sourceTables: ["media_assets", "quran_audio", "site_audio_assets", "tawasheeh"],
    ownerRole: "video_manager",
    status: "active",
  },
  {
    key: "social-publishing",
    label: "النشر والتواصل الاجتماعي",
    description: "إدارة القنوات والنشر والجدولة وحالة المزامنة والتحليلات الاجتماعية.",
    basePath: "/admin/social",
    routes: routesFor("social-publishing"),
    permission: "social.manage",
    permissions: ["social.manage", "social.publish"],
    sourceTables: ["social_publish_queue", "social_sync_jobs", "social_platform_credentials"],
    ownerRole: "social_manager",
    status: "active",
  },
  {
    key: "kids",
    label: "عالم الأطفال",
    description: "محتوى الأطفال والألعاب والمستويات والأصول والتحليلات.",
    basePath: "/admin/kids",
    routes: routesFor("kids"),
    permission: "kids.manage",
    permissions: ["kids.manage"],
    sourceTables: ["kids_content", "kids_games", "kids_game_levels", "kids_game_results"],
    ownerRole: "moderator",
    status: "active",
  },
  {
    key: "growth",
    label: "النمو والتحليلات",
    description: "تحليلات المنصة وتحسين الظهور.",
    basePath: "/admin/analytics",
    routes: routesFor("growth"),
    permission: "analytics.read",
    permissions: ["analytics.read", "settings.manage"],
    sourceTables: ["articles", "videos", "video_generation_requests", "content_publish_queue"],
    ownerRole: "analyst",
    status: "active",
  },
  {
    key: "system-security",
    label: "النظام والأمان",
    description: "التدقيق والإصدار والمستخدمون والأمن وإعدادات النظام وأندرويد.",
    basePath: "/admin/audit",
    routes: routesFor("system-security"),
    permission: "audit.read",
    permissions: ["audit.read", "release.manage", "users.read", "users.roles", "security.manage", "android.manage", "settings.manage"],
    sourceTables: ["profiles", "admin_role_assignments", "admin_settings", "admin_audit_events"],
    ownerRole: "super_admin",
    status: "active",
  },
] as const;

/** المسارات القديمة محفوظة كتحويلات فقط؛ لا توجد لها نسخ تشغيلية ثانية. */
export const ADMIN_ROUTE_ALIASES = [
  { from: "/admin/videos", to: "/admin/video/requests", reason: "مسار فيديو رسمي موحد" },
  { from: "/admin/video-factory", to: "/admin/video", reason: "دمج مصنع الفيديو في مركز واحد" },
  { from: "/admin/video-factory/sources", to: "/admin/video/sources", reason: "نقل المصادر إلى المركز الموحد" },
  { from: "/admin/video-factory/scripts", to: "/admin/video/scripts", reason: "نقل النصوص إلى المركز الموحد" },
  { from: "/admin/video-factory/voices", to: "/admin/video/voices", reason: "نقل الأصوات إلى المركز الموحد" },
  { from: "/admin/video-factory/visuals", to: "/admin/video/visuals", reason: "نقل المرئيات إلى المركز الموحد" },
  { from: "/admin/video-factory/templates", to: "/admin/video/templates", reason: "نقل القوالب إلى المركز الموحد" },
  { from: "/admin/video-factory/qa", to: "/admin/video/qa", reason: "نقل الجودة إلى المركز الموحد" },
  { from: "/admin/video-factory/queue", to: "/admin/video/requests", reason: "توحيد طابور الفيديو" },
  { from: "/admin/video-factory/scheduler", to: "/admin/automation", reason: "الجدولة تحت مركز الأتمتة" },
  { from: "/admin/ai-video", to: "/admin/video/studio", reason: "دمج الاستوديو في مركز الفيديو" },
  { from: "/admin/ai-video/curated", to: "/admin/video/studio/curated", reason: "نقل المحتوى الموثق إلى الاستوديو الرسمي" },
  { from: "/admin/video-factory/publishing", to: "/admin/memory", reason: "تحويل مساحة الوسائط والذاكرة الداخلية" },
  { from: "/admin/alerts", to: "/admin/notifications", reason: "توحيد التنبيهات" },
  { from: "/admin/control", to: "/admin", reason: "اختصار قديم لمركز العمليات" },
  { from: "/admin/audio/site-audio", to: "/admin/site-audio", reason: "مسار صوت الموقع الرسمي" },
] as const;

export function getAdminModule(pathname: string) {
  const matches = ADMIN_MODULES.map((module) => ({
    module,
    route: module.routes
      .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
      .sort((a, b) => b.length - a.length)[0],
  })).filter((entry): entry is { module: AdminModuleDefinition; route: string } => Boolean(entry.route));
  return matches.sort((a, b) => b.route.length - a.route.length)[0]?.module ?? null;
}
