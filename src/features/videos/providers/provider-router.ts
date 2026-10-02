import { ComfyUIVideoProvider } from "./comfyui-provider";
import { FreeApiVideoProvider } from "./free-api-provider";
import { getVideoEngineConfig, type VideoGenerationInput, type VideoGenerationResult, type VideoProvider } from "./types";
import { TemplateVideoProvider } from "./template-provider";

export function createVideoProviderRouter(templateRenderer: (input: VideoGenerationInput) => Promise<VideoGenerationResult>, env = process.env) {
  const config = getVideoEngineConfig(env);
  const providers: Record<string, VideoProvider> = {
    template: new TemplateVideoProvider(templateRenderer),
    comfyui: new ComfyUIVideoProvider(env.COMFYUI_BASE_URL),
    free_api: new FreeApiVideoProvider(),
  };
  return {
    config,
    async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
      const candidates = config.aiEnabled ? config.order : ["template" as const];
      for (const name of candidates) {
        if (name === "comfyui" && !config.comfyUiEnabled) continue;
        if (name === "free_api" && !config.freeApiEnabled) continue;
        const provider = providers[name];
        if (!provider || !(await provider.isAvailable())) continue;
        const result = await provider.generate(input);
        if (result.ok) return result;
      }
      return { ok: false, provider: "template", error: "All enabled video providers failed." };
    },
  };
}
