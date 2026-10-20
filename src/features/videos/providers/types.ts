export type VideoProviderName =
  | "template"
  | "comfyui"
  | "free_api"
  | "hf_wan"
  | "hf_ltx_fast";

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
];

function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}

export function getVideoEngineConfig(env = process.env): VideoEngineConfig {
  const order = (env.VIDEO_PROVIDER_ORDER ?? "hf_ltx_fast,hf_wan,comfyui,free_api")
    .split(",")
    .map((value) => value.trim() as VideoProviderName)
    .filter(
      (value, index, values) =>
        PROVIDERS.includes(value) && values.indexOf(value) === index,
    );

  return {
    order: order.length ? order : ["hf_ltx_fast", "hf_wan", "comfyui", "free_api"],
    // Free-only mode is the safe default. Non-free/custom endpoints need an explicit opt-out.
    freeOnly: bool(env.VIDEO_FREE_ONLY, true),
    aiEnabled: bool(env.VIDEO_AI_ENABLED, false),
    comfyUiEnabled: bool(env.COMFYUI_ENABLED, false),
    freeApiEnabled: bool(env.FREE_VIDEO_PROVIDER_ENABLED, false),
    hfWanEnabled: bool(env.HF_WAN_VIDEO_ENABLED, false),
    hfLtxFastEnabled: bool(env.HF_LTX_FAST_VIDEO_ENABLED, false),
    dailyLimit: Math.max(1, Number(env.VIDEO_DAILY_LIMIT ?? 10) || 10),
    maxRetries: Math.max(1, Number(env.VIDEO_MAX_RETRIES ?? 3) || 3),
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
