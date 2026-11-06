export type VideoProviderName =
  | "template"
  | "comfyui"
  | "free_api"
  | "hf_wan"
  | "hf_ltx_fast"
  | "hf_custom_1"
  | "hf_custom_2"
  | "hf_custom_3"
  | "hf_custom_4"
  | "hf_custom_5";

export type VideoGenerationInput = {
  requestId: string;
  title: string;
  description: string;
  category: string;
  text: string;
  audience?: "general" | "kids";
  seriesTitle?: string;
  episodeNumber?: number;
  learningObjective?: string;
  sourceId?: string;
  sourceUrl?: string;
  format: "vertical" | "horizontal";
  durationSeconds?: number;
  language: "ar";
  style?: string;
  preferredProvider?: VideoProviderName;
};

export type VideoGenerationResult = {
  ok: boolean;
  provider: VideoProviderName;
  localPath?: string;
  videoUrl?: string;
  providerJobId?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  audioPresent?: boolean;
  error?: string;
};

export interface VideoProvider {
  readonly name: VideoProviderName;
  isAvailable(): Promise<boolean>;
  generate(input: VideoGenerationInput): Promise<VideoGenerationResult>;
}

export type VideoEngineConfig = {
  order: VideoProviderName[];
  freeOnly: boolean;
  aiEnabled: boolean;
  comfyUiEnabled: boolean;
  freeApiEnabled: boolean;
  hfWanEnabled: boolean;
  hfLtxFastEnabled: boolean;
  customSpaces: Array<{ name: Extract<VideoProviderName, `hf_custom_${number}`>; space: string; variant: "wan2_2_fast" | "ltx_fast" }>;
  dailyLimit: number;
  maxRetries: number;
  staleAfterMinutes: number;
  defaultFormat: "vertical" | "horizontal";
  defaultDuration: number;
  dryRun: boolean;
  autoPublishEnabled: boolean;
  requiresApproval: boolean;
};

const PROVIDERS: VideoProviderName[] = [
  "hf_ltx_fast",
  "hf_wan",
  "comfyui",
  "free_api",
  "template",
  "hf_custom_1",
  "hf_custom_2",
  "hf_custom_3",
  "hf_custom_4",
  "hf_custom_5",
];

function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

export function parseCustomVideoSpaces(value: string | undefined): VideoEngineConfig["customSpaces"] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 5).flatMap((item, index) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const space = typeof row.space === "string" ? row.space.trim() : "";
      const variant = row.variant === "wan2_2_fast" || row.variant === "ltx_fast" ? row.variant : null;
      if (!space || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(space) || !variant || row.enabled !== true) return [];
      return [{ name: (`hf_custom_${index + 1}`) as Extract<VideoProviderName, `hf_custom_${number}`>, space, variant }];
    });
  } catch {
    return [];
  }
}

export function getVideoEngineConfig(env = process.env): VideoEngineConfig {
  const customSpaces = parseCustomVideoSpaces(env.HF_VIDEO_CUSTOM_SPACES);
  const availableProviders = new Set<VideoProviderName>([
    "hf_ltx_fast", "hf_wan", "comfyui", "free_api", "template",
    ...customSpaces.map((entry) => entry.name),
  ]);
  const order = (env.VIDEO_PROVIDER_ORDER ?? "hf_ltx_fast,hf_wan,comfyui,free_api")
    .split(",")
    .map((value) => value.trim() as VideoProviderName)
    .filter(
      (value, index, values) =>
        PROVIDERS.includes(value) && availableProviders.has(value) && values.indexOf(value) === index,
    );

  return {
    order: [...(order.length ? order : ["hf_ltx_fast", "hf_wan", "comfyui", "free_api"] as VideoProviderName[]), ...customSpaces.map((entry) => entry.name)].filter((value, index, values) => values.indexOf(value) === index),
    // Free-only mode is the safe default. Non-free/custom endpoints need an explicit opt-out.
    freeOnly: bool(env.VIDEO_FREE_ONLY, true),
    aiEnabled: bool(env.VIDEO_AI_ENABLED, false),
    comfyUiEnabled: bool(env.COMFYUI_ENABLED, false),
    freeApiEnabled: bool(env.FREE_VIDEO_PROVIDER_ENABLED, false),
    hfWanEnabled: bool(env.HF_WAN_VIDEO_ENABLED, false),
    hfLtxFastEnabled: bool(env.HF_LTX_FAST_VIDEO_ENABLED, false),
    customSpaces,
    dailyLimit: Math.max(1, Number(env.VIDEO_DAILY_LIMIT ?? 10) || 10),
    maxRetries: Math.min(8, Math.max(1, Number(env.VIDEO_MAX_RETRIES ?? 3) || 3)),
    staleAfterMinutes: Math.max(
      5,
      Number(env.VIDEO_STALE_AFTER_MINUTES ?? 30) || 30,
    ),
    defaultFormat:
      env.VIDEO_DEFAULT_FORMAT === "horizontal" ? "horizontal" : "vertical",
    defaultDuration: Math.min(
      45,
      Math.max(5, Number(env.VIDEO_DEFAULT_DURATION ?? 8) || 8),
    ),
    dryRun: bool(env.VIDEO_AUTOMATION_DRY_RUN, true),
    autoPublishEnabled: bool(env.AUTO_VIDEO_PUBLISH_ENABLED, false),
    requiresApproval: bool(env.AUTO_VIDEO_PUBLISH_REQUIRES_APPROVAL, true),
  };
}
