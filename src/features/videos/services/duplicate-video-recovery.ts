import { URL } from "node:url";

export type DuplicateVideoHashOwner = {
  status: string;
  video_url?: string | null;
  content_hash?: string | null;
  source_hash?: string | null;
  template_version?: string | null;
  category: string;
};

export type DuplicateVideoRenderCandidate = {
  category: string;
  contentHash: string;
  sourceHash: string;
  templateVersion: string;
};

export type DuplicateVideoSiteRecord = {
  published: boolean | null;
  metadata: Record<string, unknown> | null;
} | null;

function isGeneratedCloudinaryVideoUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return false;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = parts.findIndex((part, index) => part === "video" && parts[index + 1] === "upload");
    if (uploadIndex < 0) return false;
    const assetParts = parts.slice(uploadIndex + 2);
    if (/^v\d+$/.test(assetParts[0] ?? "")) assetParts.shift();
    const filename = assetParts.pop() ?? "";
    const publicId = [...assetParts, filename.replace(/\.[^.]+$/, "")].filter(Boolean).join("/");
    return publicId.startsWith("auto-");
  } catch {
    return false;
  }
}

/**
 * Build a compare-and-set PostgREST filter for replacing the canonical request's
 * media pointer. A stale URL is included only for a generated Cloudinary asset;
 * unexpected URLs cannot be overwritten by the recovery path.
 */
export function buildDuplicateVideoOwnerVideoUrlFilter(videoUrl: string | null | undefined): string {
  const alternatives = ["video_url.is.null", "video_url.eq."];
  if (typeof videoUrl === "string" && isGeneratedCloudinaryVideoUrl(videoUrl)) {
    alternatives.push("video_url.eq." + encodeURIComponent(videoUrl));
  }
  return "or=(" + alternatives.join(",") + ")";
}

/**
 * Compare-and-set guard for restoring a canonical completed request. The URL
 * check protects the media pointer; updated_at protects the rest of the row
 * from a concurrent metadata/hash change after the duplicate was inspected.
 */
export function buildDuplicateVideoOwnerRecoveryFilter(
  videoUrl: string | null | undefined,
  updatedAt: string | null | undefined,
): string | null {
  const revision = updatedAt?.trim();
  if (!revision || !Number.isFinite(Date.parse(revision))) return null;
  return [
    "status=eq.completed",
    "updated_at=eq." + encodeURIComponent(revision),
    buildDuplicateVideoOwnerVideoUrlFilter(videoUrl),
  ].join("&");
}

/**
 * Reuse a newly rendered asset only when the canonical completed request has
 * lost its media and its public catalog row is absent or explicitly marked as
 * purged. Ambiguous, live, or intentionally unpublished records fail closed.
 */
export function canRecoverDuplicateVideoRender(input: {
  owner: DuplicateVideoHashOwner;
  candidate: DuplicateVideoRenderCandidate;
  qaApproved: boolean;
  siteRecord: DuplicateVideoSiteRecord;
}): boolean {
  const { owner, candidate, qaApproved, siteRecord } = input;
  if (!qaApproved || owner.status !== "completed") return false;
  if (!candidate.contentHash || owner.content_hash !== candidate.contentHash) return false;
  if (!candidate.sourceHash || owner.source_hash !== candidate.sourceHash) return false;
  if (!candidate.templateVersion || owner.template_version !== candidate.templateVersion) return false;
  if (!candidate.category || owner.category !== candidate.category) return false;
  if (typeof owner.video_url === "string" && owner.video_url.trim() && !isGeneratedCloudinaryVideoUrl(owner.video_url)) {
    return false;
  }

  const purgedUnpublishedSiteRecord = siteRecord !== null && siteRecord.published === false &&
    siteRecord.metadata?.mediaState === "purged" &&
    siteRecord.metadata?.mediaPurgedFromPublished === true &&
    ![siteRecord.metadata.generatedVideoUrl, siteRecord.metadata.videoUrl].some(
      (value) => typeof value === "string" && value.trim().length > 0,
    );

  // The purge intentionally clears the catalog URLs but leaves the original
  // generation request's video_url as an audit pointer. Treat that request URL
  // as stale only when the matching catalog row is explicitly purged and hidden.
  if (typeof owner.video_url === "string" && owner.video_url.trim() && !purgedUnpublishedSiteRecord) {
    return false;
  }

  if (siteRecord === null) return true;
  return purgedUnpublishedSiteRecord;
}
