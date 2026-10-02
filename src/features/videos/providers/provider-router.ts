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
    hf_ltx25: new HuggingFaceSpaceVideoProvider("ltx2_5"),
  };

  return {
    config,
    async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
      const fallbackCandidates = config.order;
      const preferred =
        input.preferredProvider && fallbackCandidates.includes(input.preferredProvider)
          ? [input.preferredProvider]
          : [];
      const candidates = [...preferred, ...fallbackCandidates.filter(
        (name) => name !== input.preferredProvider,
      )];

      for (const name of candidates) {
        if (name === "comfyui" && !config.comfyUiEnabled) continue;
        if (name === "free_api" && !config.freeApiEnabled) continue;
        if (name === "hf_wan" && !config.hfWanEnabled) continue;
        if (name === "hf_ltx25" && !config.hfLtx25Enabled) continue;
        if (!config.aiEnabled && name !== "template") continue;

        const provider = providers[name];
        if (!provider) continue;\n        const available = await provider.isAvailable();\n        if (!available) {\n          console.warn("[video-provider-router] Provider unavailable: " + name);\n          continue;\n        }

        const result = await provider.generate(input);
        if (result.ok) return result;
        console.warn(
          "[video-provider-router] Provider " + name + " failed for " + input.requestId + ": " + (result.error || "unknown error"),
        );
      }

      if (providers.template && (await providers.template.isAvailable())) {
        return providers.template.generate(input);
      }

      return {
        ok: false,
        provider: "template",
        error: "All enabled video providers failed.",
      };
    },
  };
}
