import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { VideoGenerationInput, VideoGenerationResult, VideoProvider } from "./types";

const execFileAsync = promisify(execFile);

type HuggingFaceVariant = "wan2_2_fast" | "ltx_fast";

const DEFAULT_SPACES: Record<HuggingFaceVariant, string> = {
  wan2_2_fast: "zerogpu-aoti/wan2-2-fp8da-aoti-faster",
  ltx_fast: "Lightricks/ltx-video-distilled",
};

const PYTHON_TIMEOUT_MS =
  Math.max(120_000, Number(process.env.HF_VIDEO_PROVIDER_TIMEOUT_MS ?? 900_000) || 900_000);

function configuredSpace(variant: HuggingFaceVariant) {
  const value =
    variant === "wan2_2_fast" ? process.env.HF_WAN_SPACE : process.env.HF_LTX_FAST_SPACE;
  return value?.trim() || DEFAULT_SPACES[variant];
}

function configuredEnabled(variant: HuggingFaceVariant) {
  return (
    (variant === "wan2_2_fast"
      ? process.env.HF_WAN_VIDEO_ENABLED
      : process.env.HF_LTX_FAST_VIDEO_ENABLED)?.toLowerCase() === "true"
  );
}

function configuredPython() {
  return process.env.HF_VIDEO_PYTHON?.trim() || process.env.ARABIC_TTS_PYTHON?.trim() || "python3";
}

function styleAsset(style: VideoGenerationInput["style"]) {
  const normalized =
    style === "dawn" || style === "night" || style === "gold" ? style : "calm";
  return path.join(process.cwd(), "public", "video", "templates", normalized + ".svg");
}

async function makeWanConditioningImage(tempDir: string, style?: VideoGenerationInput["style"]) {
  const output = path.join(tempDir, "wan-conditioning.png");
  await execFileAsync(
    "rsvg-convert",
    ["-w", "832", "-h", "480", styleAsset(style), "-o", output],
    { timeout: 30_000, maxBuffer: 2 * 1024 * 1024 },
  );
  return output;
}

async function writePromptFile(tempDir: string, input: VideoGenerationInput) {
  const prompt = [
    "Create a premium cinematic Arabic Islamic short video for the ZIKR platform.",
    "Title: " + input.title + ".",
    "Section: " + input.category + ".",
    "Verified source text: " + input.text.slice(0, 1800) + ".",
    input.sourceUrl ? "Reference URL: " + input.sourceUrl + "." : "",
    "Visual rules: respectful, contemplative, no depictions of prophets or sacred figures, no invented Arabic scripture, no subtitles embedded into the generated scene, cinematic camera movement, natural light, refined green/gold palette.",
    "Treat the supplied source text as factual content context, not as a license to invent religious quotations.",
  ]
    .filter(Boolean)
    .join("\n");
  const promptPath = path.join(tempDir, "prompt.txt");
  await writeFile(promptPath, prompt, "utf8");
  return promptPath;
}

export class HuggingFaceSpaceVideoProvider implements VideoProvider {
  readonly name: "hf_wan" | "hf_ltx_fast";
  private readonly variant: HuggingFaceVariant;

  constructor(variant: HuggingFaceVariant) {
    this.variant = variant;
    this.name = variant === "wan2_2_fast" ? "hf_wan" : "hf_ltx_fast";
  }

  async isAvailable() {
    if (!configuredEnabled(this.variant)) return false;
    try {
      await execFileAsync(
        configuredPython(),
        ["-c", "import gradio_client; print('gradio_client:ok')"],
        { timeout: 20_000, maxBuffer: 512_000 },
      );
      return true;
    } catch {
      return false;
    }
  }

  async generate(input: VideoGenerationInput): Promise<VideoGenerationResult> {
    if (!(await this.isAvailable())) {
      return {
        ok: false,
        provider: this.name,
        error: this.name + " is disabled or gradio_client is unavailable.",
      };
    }

    const tempDir = await mkdtemp(path.join(tmpdir(), "zikr-" + this.name + "-"));
    const outputPath = path.join(tempDir, input.requestId + ".mp4");
    const promptPath = await writePromptFile(tempDir, input);
    let conditioningImage: string | null = null;

    try {
      if (this.variant === "wan2_2_fast") {
        conditioningImage = await makeWanConditioningImage(tempDir, input.style);
      }

      const args = [
        "scripts/jobs/hf-space-video.py",
        "--provider",
        this.variant,
        "--space",
        configuredSpace(this.variant),
        "--prompt-file",
        promptPath,
        "--output",
        outputPath,
        "--duration",
        String(Math.min(8, Math.max(2, Math.round(input.durationSeconds ?? 6)))),
        "--seed",
        String(Math.abs(hashCode(input.requestId))),
      ];

      if (conditioningImage) args.push("--image", conditioningImage);

      const token = process.env.HF_TOKEN?.trim();
      if (token) args.push("--hf-token", token);

      const { stdout, stderr } = await execFileAsync(configuredPython(), args, {
        timeout: PYTHON_TIMEOUT_MS,
        maxBuffer: 4 * 1024 * 1024,
      });

      if (stdout.trim()) console.log("[" + this.name + "] " + stdout.trim());
      if (stderr.trim()) console.warn("[" + this.name + "] " + stderr.trim());

      return {
        ok: true,
        provider: this.name,
        localPath: outputPath,
        durationSeconds: input.durationSeconds,
        audioPresent: false,
      };
    } catch (error) {
      return {
        ok: false,
        provider: this.name,
        error: (error instanceof Error ? error.message : String(error)).slice(0, 2000),
      };
    } finally {
      await rm(promptPath, { force: true }).catch(() => undefined);
      if (conditioningImage) await rm(conditioningImage, { force: true }).catch(() => undefined);
    }
  }
}

function hashCode(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}
