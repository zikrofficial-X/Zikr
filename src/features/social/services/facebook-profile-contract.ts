export type FacebookPublicProfileIdentityUpsert = {
  platform: "facebook";
  external_id: string;
  name: string;
  page_url: string;
  status: "ok";
  last_error: null;
  updated_at: string;
};

/**
 * OAuth only verifies Page identity. Keep this payload deliberately narrow:
 * PostgREST merge-duplicates preserves existing metrics, artwork, and
 * descriptive fields when they are omitted instead of being overwritten by
 * null placeholders.
 */
export function buildFacebookPublicProfileIdentityUpsert(input: {
  pageId: string;
  pageName: string;
  updatedAt: string;
}): FacebookPublicProfileIdentityUpsert {
  const pageId = input.pageId.trim();
  const pageName = input.pageName.trim();
  if (!pageId || !pageName) {
    throw new Error("Facebook Page ID and name are required to update the public profile identity.");
  }

  return {
    platform: "facebook",
    external_id: pageId,
    name: pageName,
    page_url: `https://www.facebook.com/${encodeURIComponent(pageId)}`,
    status: "ok",
    last_error: null,
    updated_at: input.updatedAt,
  };
}
