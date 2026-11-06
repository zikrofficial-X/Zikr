export const CURRENT_VIDEO_RENDERER_VERSION = "2026-11-06-composition-sync-v8";

export function versionedTemplateLabel(slug: string, version: number): string {
  return `${slug}@${version}+renderer:${CURRENT_VIDEO_RENDERER_VERSION}`;
}
