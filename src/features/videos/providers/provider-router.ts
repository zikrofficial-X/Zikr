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
      const candidates = [...preferred, ...fallbackCandidates.filter(
        (name) => name !== input.preferredProvider,
      )];
      let templateAttempted = false;
      const providerErrors: string[] = [];

      for (const name of candidates) {
        // Free-only mode permits public Hugging Face Spaces and the local FFmpeg renderer only.
        // Unknown/custom endpoints may have separate billing, so they require explicit opt-in.
        const isCustomFreeSpace = config.customSpaces.some((entry) => entry.name === name);
        if (config.freeOnly && !["hf_ltx_fast", "hf_wan", "template"].includes(name) && !isCustomFreeSpace) continue;
        if (name === "comfyui" && !config.comfyUiEnabled) continue;
        if (name === "free_api" && !config.freeApiEnabled) continue;
        if (name === "hf_wan" && !config.hfWanEnabled) continue;
        if (name === "hf_ltx_fast" && !config.hfLtxFastEnabled) continue;
        if (!config.aiEnabled && name !== "template") continue;

        const provider = providers[name];
        if (!provider) continue;
        let available = false;
        try {
          available = await provider.isAvailable();
        } catch (error) {
          console.warn(
            "[video-provider-router] Provider " + name + " availability check threw: " +
            (error instanceof Error ? error.message : String(error)),
          );
          continue;
        }
        if (!available) {
          const message = name + ": unavailable (disabled, missing gradio_client, or no runtime)";
          providerErrors.push(message);
          console.warn("[video-provider-router] " + message);
          continue;
        }

        if (name === "template") templateAttempted = true;
        try {
          const result = await provider.generate(input);
          if (result.ok) return result;
          const message = name + ": " + (result.error || "unknown error");
          providerErrors.push(message);
          console.warn("[video-provider-router] Provider " + name + " failed for " + input.requestId + ": " + (result.error || "unknown error"));
        } catch (error) {
          const message = name + ": " + (error instanceof Error ? error.message : String(error));
          providerErrors.push(message);
          console.warn("[video-provider-router] Provider " + name + " threw for " + input.requestId + ": " +
            (error instanceof Error ? error.message : String(error)));
        }
      }

      if (!templateAttempted && providers.template && (await providers.template.isAvailable())) {
        try {
          return await providers.template.generate(input);
        } catch (error) {
          return {
            ok: false,
            provider: "template",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }

      return {
        ok: false,
        provider: "template",
        error: providerErrors.length
          ? providerErrors.join(" | ").slice(0, 1800)
          : "All enabled video providers failed.",
      };
    },
  };
}
