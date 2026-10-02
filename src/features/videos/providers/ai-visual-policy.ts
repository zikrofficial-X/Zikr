export const AI_VISUAL_POLICY_VERSION = "2026-10-02-source-locked-v1";

export const AI_VISUAL_POLICY_TEXT =
  "Respectful, contemplative visuals only; no depictions of prophets or sacred figures; no invented Arabic scripture; no invented religious quotations; no embedded subtitles in the generated scene; use the supplied verified source only as factual context.";

export function aiVisualPolicyPromptLine() {
  return "Visual policy version: " + AI_VISUAL_POLICY_VERSION + ". " + AI_VISUAL_POLICY_TEXT;
}
