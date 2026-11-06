export const CURRENT_VIDEO_RENDERER_VERSION = "2026-11-07-template-controls-v10";

export function versionedTemplateLabel(slug: string, version: number): string {
  return `${slug}@${version}+renderer:${CURRENT_VIDEO_RENDERER_VERSION}`;
}
