import type { VideoGenerationInput, VideoGenerationResult, VideoProvider } from "./types";

export class FreeApiVideoProvider implements VideoProvider {
  readonly name = "free_api" as const;
  private readonly endpoint = process.env.FREE_VIDEO_PROVIDER_URL?.trim() ?? "";
  private readonly token = process.env.FREE_VIDEO_PROVIDER_TOKEN?.trim() ?? "";

  async isAvailable() {
    return Boolean(this.endpoint && this.token);
  }

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    if (!(await this.isAvailable())) return { ok: false, provider: this.name, error: "Free video API is not configured." };
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
        body: JSON.stringify({ requestId: input.requestId, title: input.title, text: input.text, format: input.format, durationSeconds: input.durationSeconds }),
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) return { ok: false, provider: this.name, error: `Free video API failed (HTTP ${response.status}).` };
      const data = await response.json() as { videoUrl?: string; jobId?: string };
      return data.videoUrl
        ? { ok: true, provider: this.name, videoUrl: data.videoUrl, providerJobId: data.jobId, audioPresent: true }
        : { ok: false, provider: this.name, providerJobId: data.jobId, error: "Free video API returned no video URL." };
    } catch {
      return { ok: false, provider: this.name, error: "Free video API request failed." };
    }
  }
}
