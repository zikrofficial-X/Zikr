import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { VideoGenerationInput, VideoGenerationResult, VideoProvider } from "./types";

const DEFAULT_TIMEOUT_MS = 120_000;

export class ComfyUIVideoProvider implements VideoProvider {
  readonly name = "comfyui" as const;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly model: "wan2.1" | "ltx";

  constructor(baseUrl = process.env.COMFYUI_BASE_URL ?? "http://127.0.0.1:8188", timeoutMs = Number(process.env.COMFYUI_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS)) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeoutMs = Math.max(5_000, timeoutMs || DEFAULT_TIMEOUT_MS);
    this.model = process.env.COMFYUI_MODEL === "ltx" ? "ltx" : "wan2.1";
  }

  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`, { signal: AbortSignal.timeout(5_000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    if (!(await this.isAvailable())) return { ok: false, provider: this.name, error: "ComfyUI health check failed." };
    const workflowText = this.model === "ltx" ? process.env.COMFYUI_LTX_WORKFLOW_JSON : process.env.COMFYUI_WAN_WORKFLOW_JSON;
    if (!workflowText) return { ok: false, provider: this.name, error: `No ComfyUI ${this.model} workflow is configured.` };
    let prompt: Record<string, unknown>;
    try {
      prompt = JSON.parse(workflowText) as Record<string, unknown>;
      const serialized = JSON.stringify(prompt)
        .replaceAll("{{PROMPT}}", input.text.slice(0, 2_000))
        .replaceAll("{{REQUEST_ID}}", input.requestId)
        .replaceAll("{{TITLE}}", input.title);
      prompt = JSON.parse(serialized) as Record<string, unknown>;
    } catch {
      return { ok: false, provider: this.name, error: `Invalid ComfyUI ${this.model} workflow JSON.` };
    }
    const queued = await fetch(`${this.baseUrl}/prompt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, client_id: input.requestId }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!queued.ok) return { ok: false, provider: this.name, error: `ComfyUI queue failed (HTTP ${queued.status}).` };
    const payload = await queued.json() as { prompt_id?: string };
    const providerJobId = payload.prompt_id;
    if (!providerJobId) return { ok: false, provider: this.name, error: "ComfyUI did not return a prompt id." };

    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      const history = await fetch(`${this.baseUrl}/history/${encodeURIComponent(providerJobId)}`, { signal: AbortSignal.timeout(10_000) });
      if (history.ok) {
        const result = await history.json() as Record<string, { outputs?: Record<string, unknown> }>;
        const outputs = result[providerJobId]?.outputs;
        if (outputs) {
          const media = findMediaOutput(outputs);
          if (!media) return { ok: false, provider: this.name, providerJobId, error: "ComfyUI completed without a video output." };
          const response = await fetch(`${this.baseUrl}/view?filename=${encodeURIComponent(media.filename)}&subfolder=${encodeURIComponent(media.subfolder)}&type=${encodeURIComponent(media.type)}`, { signal: AbortSignal.timeout(30_000) });
          if (!response.ok) return { ok: false, provider: this.name, providerJobId, error: `ComfyUI output download failed (HTTP ${response.status}).` };
          const dir = await mkdtemp(path.join(tmpdir(), "zikr-comfyui-"));
          const localPath = path.join(dir, `${input.requestId}.mp4`);
          await writeFile(localPath, new Uint8Array(await response.arrayBuffer()));
          return { ok: true, provider: this.name, providerJobId, localPath, audioPresent: false };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2_000));
    }
    try { await fetch(`${this.baseUrl}/interrupt`, { method: "POST", signal: AbortSignal.timeout(5_000) }); } catch { /* best effort cancellation */ }
    return { ok: false, provider: this.name, providerJobId, error: "ComfyUI generation timed out." };
  }
}

function findMediaOutput(outputs: Record<string, unknown>) {
  for (const value of Object.values(outputs)) {
    if (!value || typeof value !== "object") continue;
    for (const key of ["gifs", "videos", "images"]) {
      const files = (value as Record<string, unknown>)[key];
      if (!Array.isArray(files)) continue;
      const file = files.find((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).filename === "string"));
      if (file) return { filename: String(file.filename), subfolder: String(file.subfolder ?? ""), type: String(file.type ?? "output") };
    }
  }
  return null;
}
