export const VIDEO_TEMPLATE_ASSETS = [
  "calm", "dawn", "emerald", "gold", "night", "paper", "rose",
  "kids-garden", "kids-nature", "kids-neighborhood", "kids-workshop",
] as const;

export type VideoTemplateAsset = (typeof VIDEO_TEMPLATE_ASSETS)[number];
export type VideoTemplateAudience = "general" | "kids";
export type VideoTemplateConfig = {
  assetKey: VideoTemplateAsset;
  defaultFormat: "vertical" | "horizontal";
  motion: "slow" | "fade";
};

const GENERAL_ASSETS = new Set<VideoTemplateAsset>([
  "calm", "dawn", "emerald", "gold", "night", "paper", "rose",
]);
const KIDS_ASSETS = new Set<VideoTemplateAsset>([
  "kids-garden", "kids-nature", "kids-neighborhood", "kids-workshop",
]);

export function parseVideoTemplateConfig(value: unknown): VideoTemplateConfig | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (!VIDEO_TEMPLATE_ASSETS.includes(candidate.assetKey as VideoTemplateAsset)) return null;
  if (candidate.defaultFormat !== "vertical" && candidate.defaultFormat !== "horizontal") return null;
  if (candidate.motion !== "slow" && candidate.motion !== "fade") return null;
  return {
    assetKey: candidate.assetKey as VideoTemplateAsset,
    defaultFormat: candidate.defaultFormat,
    motion: candidate.motion,
  };
}

export function isVideoTemplateAssetAllowedForAudience(
  assetKey: VideoTemplateAsset,
  audience: VideoTemplateAudience,
): boolean {
  return audience === "kids" ? KIDS_ASSETS.has(assetKey) : GENERAL_ASSETS.has(assetKey);
}

export function videoTemplateAssetPath(
  assetKey: VideoTemplateAsset,
  audience: VideoTemplateAudience,
): string | null {
  if (!isVideoTemplateAssetAllowedForAudience(assetKey, audience)) return null;
  return `public/video/templates/${assetKey}.svg`;
}

export function videoTemplateScene(assetKey: VideoTemplateAsset): "calm" | "dawn" | "emerald" | "gold" | "night" | "paper" | "rose" {
  return GENERAL_ASSETS.has(assetKey) ? assetKey as ReturnType<typeof videoTemplateScene> : "calm";
}
