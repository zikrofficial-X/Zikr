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
  if (typeof owner.video_url === "string" && owner.video_url.trim()) return false;
  if (!candidate.contentHash || owner.content_hash !== candidate.contentHash) return false;
  if (!candidate.sourceHash || owner.source_hash !== candidate.sourceHash) return false;
  if (!candidate.templateVersion || owner.template_version !== candidate.templateVersion) return false;
  if (!candidate.category || owner.category !== candidate.category) return false;

  if (siteRecord === null) return true;
  if (siteRecord.published !== false) return false;

  const metadata = siteRecord.metadata ?? {};
  const hasExistingMedia = [metadata.generatedVideoUrl, metadata.videoUrl].some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  return metadata.mediaState === "purged" && !hasExistingMedia;
}
