import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { VideoGenerationInput, VideoGenerationResult, VideoProvider, VideoProviderName } from "./types";
import { aiVisualPolicyPromptLine } from "./ai-visual-policy";

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
    style === "dawn" || style === "night" || style === "gold" || style === "em¶»§q«^