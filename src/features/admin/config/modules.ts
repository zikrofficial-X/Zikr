import type { AdminPermission } from "@/features/admin/services/permissions";

export type AdminModuleStatus = "active" | "transition" | "retired";

export type AdminModuleDefinition = {
  key: string;
  label: string;
  description: string;
  basePath: string;
  routes: readonly string[];
  permission: AdminPermission;
  sourceTables: readonly string[];
  ownerRole: string;
  status: AdminModuleStatus;
};

export const ADMIN_MODULES: readonly AdminModuleDefinition[] = [
  {
    key: "operations",
    label: "التشغيل والمراقبة",
    description: "لوحة التحكم والطوابير والأتمتة والتنبيهات ومتابعة صحة النظام.",
    basePath: "/admin",
    routes: ["/admin", "/admin/queues", "/admin/automation", "/admin/health", "/admin/notifications"],
    permission: "dashboard.view",
    sourceTables: ["admin_audit_events", "admin_queue_alert_deliveries", "admin_queue_alert_rules"],
    ownerRole: "super_admin",
    status: "active",
  },
  {
    key: "content",
    label: "إدارة المحتوى",
    description: "المكتبة والتحرير والتصنيفات والأقسام والبحث.",
    basePath: "/admin/content",
    routes: ["/admin/content", "/admin/library", "/admin/editorial", "/admin/categories", "/admin/sections", "/admin/search"],
    permission: "content.manage",
    sourceTables: ["content_library", "articles", "stories", "content_publish_queue", "content_translation_queue"],
    ownerRole: "content_manager",
    status: "active",
  },
  {
    key: "knowledge",
    label: "المصادر والمعرفة",
    description: "مصادر المحتوى والمعرفة الإسلامية والأنبياء والغزوات.",
    basePath: "/admin/sources",
    routes: ["/admin/sources", "/admin/knowledge", "/admin/prophets", "/admin/battles"],
    permission: "sources.manage",
    sourceTables: ["content_sources", "hadiths", "duas", "prophets", "companions", "scholars"],
    ownerRole: "content_manager",
    status: "active",
  },
  {
    key: "video-production",
    label: "مصنع الفيديوهات",
    description: "الطلبات والاستوديو والمصادر والنصوص والأصوات والقوالب والجودة.",
    basePath: "/admin/video",
    routes: ["/admin/video", "/admin/video/requests", "/admin/video/studio", "/admin/video/studio/curated", "/admin/video/sources", "/admin/video/scripts", "/admin/video/voices", "/admin/video/visuals", "/admin/video/templates", "/admin/video/qa"],
    permission: "video.manage",
    sourceTables: ["video_generation_requests", "videos", "video_templates", "video_template_versions"],
    ownerRole: "video_manager",
    status: "active",
  },
  {
    key: "publishing",
    label: "النشر والتوزيع",
    description: "مركز النشر الاجتماعي ومصنع المنشورات المكتوبة.",
    basePath: "/admin/social",
    routes: ["/admin/social", "/admin/social/written-studio"],
    permission: "social.manage",
    sourceTables: ["social_publish_queue", "social_platform_credentials", "social_platform_profiles"],
    ownerRole: "social_manager",
    status: "active",
  },
  {
    key: "media-audio",
    label: "الوسائط والصوت",
    description: "مكتبة الوسائط والتلاوات والأذان وتحويل النص إلى صوت والتذكيرات.",
    basePath: "/admin/media",
    routes: ["/admin/media", "/admin/audio", "/admin/audio/quran", "/admin/audio/adhan", "/admin/audio/tts", "/admin/site-audio"],
    permission: "media.manage",
    sourceTables: ["media_assets", "quran_audio", "site_audio_assets", "tawasheeh"],
    ownerRole: "video_manager",
    status: "active",
  },
  {
    key: "kids",
    label: "عالم الأطفال",
    description: "محتوى الأطفال والألعاب والمستويات والأصول والتحليلات.",
    basePath: "/admin/kids",
    routes: ["/admin/kids", "/admin/kids/content", "/admin/kids/games", "/admin/kids/levels", "/admin/kids/assets", "/admin/kids/analytics"],
    permission: "kids.manage",
    sourceTables: ["kexport function getAdminModule(pathname: string) {
  const matches = ADMIN_MODULES.map((module) => ({
    module,
    route: module.routes
      .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
      .sort((a, b) => b.length - a.length)[0],
  })).filter((entry): entry is { module: AdminModuleDefinition; route: string } => Boolean(entry.route));

  return matches.sort((a, b) => b.route.length - a.route.length)[0]?.module ?? null;
}
