import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { requireAdminPermission } from "@/features/admin/services/admin";
import { getAdminSettings } from "@/features/admin/services/platform";
import { saveCustomVideoSpacesAction } from "@/app/admin/system-actions";
import { AI_VISUAL_POLICY_TEXT, AI_VISUAL_POLICY_VERSION } from "@/features/videos/providers/ai-visual-policy";
import { getVideoEngineConfig, type VideoProviderName } from "@/features/videos/providers/types";

export const dynamic = "force-dynamic";

const PROVIDER_LABELS: Partial<Record<VideoProviderName, string>> = {
  hf_ltx_fast: "Hugging Face 路 LTX Fast",
  hf_wan: "Hugging Face 路 Wan",
  comfyui: "ComfyUI",
  free_api: "Free API",
  template: "FFmpeg Template",
  hf_custom_1: "Hugging Face 路 Custom Space 1",
  hf_custom_2: "Hugging Face 路 Custom Space 2",
  hf_custom_3: "Hugging Face 路 Custom Space 3",
  hf_custom_4: "Hugging Face 路 Custom Space 4",
  hf_custom_5: "Hugging Face 路 Custom Space 5",
};

export default async function VideoFactoryVisualsPage() {
  await requireAdminPermission("video.manage");
  const adminSettings = await getAdminSettings();
  const storedSpaces = Array.isArray(adminSettings.video_custom_spaces)
    ? adminSettings.video_custom_spaces
    : null;
  const config = getVideoEngineConfig(
    storedSpaces
      ? { ...process.env, HF_VIDEO_CUSTOM_SPACES: JSON.stringify(storedSpaces) }
      : pr痘玘