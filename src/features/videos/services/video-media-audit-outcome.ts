export const VIDEO_MEDIA_AUDIT_VIDEO_LIMIT = 1000;
export const VIDEO_MEDIA_AUDIT_SOCIAL_QUEUE_LIMIT = 2000;

export type VideoMediaAuditOutcome = {
  state: string;
  youtubeFallback?: boolean;
};

export function assertCompleteVideoMediaAuditInventory(
  publishedVideoCount: number,
  socialPublicationCount: number,
): void {
  if (!Number.isSafeInteger(publishedVideoCount) || publishedVideoCount < 0) {
    throw new Error("Published video audit inventory returned an invalid row count.");
  }
  if (!Number.isSafeInteger(socialPublicationCount) || socialPublicationCount < 0) {
    throw new Error("Social publication audit inventory returned an invalid row count.");
  }
  if (publishedVideoCount >= VIDEO_MEDIA_AUDIT_VIDEO_LIMIT) {
    throw new Error(
      `Published video audit reached the ${VIDEO_MEDIA_AUDIT_VIDEO_LIMIT}-row query limit; refusing to report a partial audit.`,
    );
  }
  if (socialPublicationCount >= VIDEO_MEDIA_AUDIT_SOCIAL_QUEUE_LIMIT) {
    throw new Error(
      `Social publication audit reached the ${VIDEO_MEDIA_AUDIT_SOCIAL_QUEUE_LIMIT}-row query limit; refusing to report a partial audit.`,
    );
  }
}

export function isBlockingVideoMediaAuditOutcome(
  result: VideoMediaAuditOutcome,
): boolean {
  return result.state === "conflict" ||
    result.state === "error" ||
    result.state === "unavailable" ||
    (result.state === "cloudinary_missing" && result.youtubeFallback !== true);
}
