import type { AdminPermission } from "@/features/admin/services/permissions";

export type AdminModuleStatus = "active" | "transition" | "retired";

export type AdminModuleDefinition = {
  key: string;
  label: string;
  description: string;
  basePath: string;
  permission: AdminPermission;
  sourceTables: readonly string[];
  ownerRole: string;
  status: AdminModuleStatus;
};

export const ADMIN_MODULES: readonly AdminModuleDefinition[] = [
  { key: "operations", label: "العمليات الآن", description: "الصحة والطوابير والتنبيهات والإصدار.", basePath: "/admin", permission: "dashboard.view", sourceTables: ["admin_audit_events", "admin_queue_alert_deliveries"], ownerRole: "super_admin", status: "active" },
  { key: "content", label: "المحتوى والتحرير", description: "المحتوى والمصادر والمراجعة والنشر.", basePath: "/admin/content", permission: "content.manage", sourceTables: ["content_library", "articles", "stories", "content_publish_queue", "content_translation_queue"], ownerRole: "content_manager", status: "active" },
  { key: "video", label: "الوسائط والإنتاج", description: "الفيديو والصوت والجودة والنشر.", basePath: "/admin/video", permission: "video.manage", sourceTables: ["video_generation_requests", "videos", "media_assets", "social_publish_queue"], ownerRole: "video_manager", status: "active" },
  { key: "audio", label: "الصوت", description: "التلاوات والأذان والصوت العام.", basePath: "/admin/audio", permission: "audio.manage", sourceTables: ["quran_audio", "site_audio_assets", "tawasheeh"], ownerRole: "video_manager", status: "active" },
  { key: "kids", label: "الأطفال", description: "المحتوى والألعاب والأصول والسلامة.", basePath: "/admin/kids", permission: "kids.manage", sourceTables: ["kids_content", "kids_games", "kids_game_levels"], ownerRole: "moderator", status: "active" },
  { key: "growth-system", label: "النمو والنظام", description: "التحليلات وSEO والمستخدمون والأمن.", basePath: "/admin/analytics", permission: "analytics.read", sourceTables: ["profiles", "admin_role_assignments", "admin_settings"], ownerRole: "super_admin", status: "active" },
] as const;

export const ADMIN_ROUTE_ALIASES = [
  { from: "/admin/videos", to: "/admin/video/requests", reason: "مسار فيديو رسمي موحد" },
  { from: "/admin/video-factory", to: "/admin/video", reason: "دمج مصنع الفيديو في مركز واحد" },
  { from: "/admin/ai-video", to: "/admin/video/studio", reason: "دمج الاستوديو في مركز الفيديو" },
  { from: "/admin/video-factory/publishing", to: "/admin/social", reason: "النشر الاجتماعي وحدة مستقلة" },
  { from: "/admin/alerts", to: "/admin/notifications", reason: "توحيد التنبيهات" },
  { from: "/admin/control", to: "/admin", reason: "اختصار قديم لمركز العمليات" },
  { from: "/admin/audio/site-audio", to: "/admin/site-audio", reason: "مسار صوت الموقع الرسمي" },
] as const;

export function getAdminModule(pathname: string) {
  return ADMIN_MODULES
    .filter((module) => pathname === module.basePath || pathname.startsWith(`${module.basePath}/`))
    .sort((a, b) => b.basePath.length - a.basePath.length)[0] ?? null;
}
