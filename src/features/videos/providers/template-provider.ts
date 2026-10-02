import type { VideoGenerationInput, VideoGenerationResult, VideoProvider } from "./types";

export type TemplateRenderer = (input: VideoGenerationInput) => Promise<VideoGenerationResult>;

export class TemplateVideoProvider implements VideoProvider {
  readonly name = "template" as const;
  constructor(private readonly renderer?: TemplateRenderer) {}
  async isAvailable() { return Boolean(this.renderer); }
  async generate(input: VideoGenerationInput) {
    if (!this.renderer) return { ok: false, provider: this.name, error: "Template renderer is not attached." };
    return this.renderer(input);
  }
}
