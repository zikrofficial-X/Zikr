/**
 * Resolve the render duration without truncating the audio track.
 *
 * Automated vertical videos allow up to 60 seconds. The 0.8s tail provides
 * room for the end of speech and audio fade; longer narrations fail clearly
 * instead of silently cutting off verified or child-safe content.
 */
export const MAX_AUTO_VIDEO_SECONDS = 60;

export function resolveRenderDuration(
  audioDuration: number,
  targetVideoSeconds: number = 18,
): number {
  const target = Number.isFinite(targetVideoSeconds)
    ? Math.min(45, Math.max(10, targetVideoSeconds))
    : 18;

  if (!Number.isFinite(audioDuration) || audioDuration <= 0) {
    return target;
  }

  const desired = Math.max(Math.min(target, 10), audioDuration + 0.8);
  if (desired > MAX_AUTO_VIDEO_SECONDS) {
    throw new Error(
      "Narration is too long for an automated short: " +
        audioDuration.toFixed(1) +
        "s > " +
        MAX_AUTO_VIDEO_SECONDS.toFixed(1) +
        "s max.",
    );
  }

  return Math.min(MAX_AUTO_VIDEO_SECONDS, desired);
}
