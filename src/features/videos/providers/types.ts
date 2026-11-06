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
  staleAfterMinutes: num¶»§q«^