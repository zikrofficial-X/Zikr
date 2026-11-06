import { ComfyUIVideoProvider } from "./comfyui-provider";
import { FreeApiVideoProvider } from "./free-api-provider";
import { HuggingFaceSpaceVideoProvider } from "./hf-space-provider";
import {
  getVideoEngineConfig,
  type VideoGenerationInput,
  type VideoGenerationResult,
  type VideoProvider,
} from "./types";
import { TemplateVideoProvider } from "./template-provider";

export function createVideoProviderRouter(
  templateRenderer: (
    input: VideoGenerationInput,
  ) => Promise<VideoGenerationResult>,
  env = process.env,
) {
  const config = getVideoEngineConfig(env);
  const providers: Partial<Record<string, VideoProvider>> = {
    template: new TemplateVideoProvider(templateRenderer),
    comfyui: new ComfyUIVideoProvider(env.COMFYUI_BASE_URL),
    free_api: new FreeApiVideoProvider(),
    hf_wan: new HuggingFaceSpaceVideoProvider("wan2_2_fast"),
    hf_ltx_fast: new HuggingFaceSpaceVideoProvider("ltx_fast"),
    ...Object.fromEntries(config.customSpaces.map((entry) => [
      entry.name,
      new HuggingFaceSpaceVideoProvider(entry.variant, { name: entry.name, space: entry.space, enabled: true }),
    ])),
  };

  return {
    config,
    async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
      const fallbackCandidates = config.order;
      const preferred =
        input.preferredProvider && fallbackCandidates.includes(input.preferredProvider)
          ? [input.preferredProvider]
          : [];
      const candidates = [...prefer¶»§q«^