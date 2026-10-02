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
 * Canonical Admin information architecture.
 *
 * Keep this list intentionally aligned with the product's final Admin tree.
 * Functional legacy routes may continue to exist for compatibility, but they
 * are not part of the primary navigation once a canonical module route exists.
 */
export const ADMIN_NAVIGATION: readonly AdminNavigationGroup[] = [
  {
    key: "operations",
    label: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", permission: "dashboard.view" },
      { href: "/admin/health", label: "Health", permission: "system.manage" },
      { href: "/admin/alerts", label: "Alerts", permission: "notifications.manage" },
      { href: "/admin/audit", label: "Audit", permission: "audit.read" },
    ],
  },
  {
    key: "content",
    label: "Content",
    items: [
      { href: "/admin/library", label: "Library", permission: "library.manage" },
      { href: "/admin/sources", label: "Sources", permission: "sources.manage" },
      { href: "/admin/editorial", label: "Editorial", permission: "knowledge.manage" },
      { href: "/admin/categories", label: "Categories", permission: "content.manage" },
      { href: "/admin/search", label: "Search", permission: "content.manage" },
    ],
  },
  {
    key: "video-factory",
    label: "Video Factory",
    items: [
      { href: "/admin/video-factory", label: "Dashboard", permission: "video.manage" },
      { href: "/admin/video-factory/sources", label: "Sources", permission: "video.manage" },
      { href: "/admin/video-factory/scripts", label: "Scripts", permission: "video.manage" },
      { href: "/admin/video-factory/voices", label: "Voices", permission: "video.manage" },
      { href: "/admin/video-factory/visuals", label: "Visuals", permission: "video.manage" },
      { href: "/admin/video-factory/templates", label: "Templates", permission: "video.manage" },
      { href: "/admin/video-factory/queue", label: "Queue", permission: "video.manage" },
      { href: "/admin/video-factory/qa", label: "QA", permission: "video.manage" },
      { href: "/admin/video-factory/scheduler", label: "Scheduler", permission: "video.manage" },
      { href: "/admin/video-factory/publishing", label: "Publishing", permission: "video.manage" },
    ],
  },
  {
    key: "social",
    label: "Social",
    items: [
      { href: "/admin/social", label: "Social", permission: "social.manage" },
    ],
  },
  {
    key: "kids",
    label: "Kids",
    items: [
      { href: "/admin/kids/content", label: "Content", permission: "kids.manage" },
      { href: "/admin/kids/games", label: "Games", permission: "kids.manage" },
      { href: "/admin/kids/levels", label: "Levels", permission: "kids.manage" },
      { href: "/admin/kids/assets", label: "Assets", permission: "kids.manage" },
      { href: "/admin/kids/analytics", label: "Analytics", permission: "kids.manage" },
    ],
  },
  {
    key: "audio",
    label: "Audio",
    items: [
      { href: "/admin/audio/quran", label: "Quran", permission: "audio.manage" },
      { href: "/admin/audio/adhan", label: "Adhan", permission: "audio.manage" },
      { href: "/admin/audio/tts", label: "TTS", permission: "audio.manage" },
      { href: "/admin/audio/site-audio", label: "Site Audio", permission: "audio.manage" },
    ],
  },
  {
    key: "users",
    label: "Users",
    items: [
      { href: "/admin/users", label: "Users", permission: "users.read" },
    ],
  },
  {
    key: "security",
    label: "Security",
    items: [
      { href: "/admin/security", label: "Security", permission: "security.manage" },
    ],
  },
  {
    key: "seo",
    label: "SEO",
    items: [
      { href: "/admin/seo", label: "SEO", permission: "settings.manage" },
    ],
  },
  {
    key: "android",
    label: "Android",
    items: [
      { href: "/admin/android", label: "Android", permission: "android.manage" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    items: [
      { href: "/admin/settings", label: "Settings", permission: "settings.manage" },
    ],
  },
] as const;
