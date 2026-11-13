export type MediaAssetKindInput = {
  asset_type?: string | null;
  media_type?: string | null;
  mime_type?: string | null;
};

export type MediaAssetKind = "audio" | "visual" | "unclassified";

/**
 * Classify the media kind from every available descriptor. Asset type is a
 * governance label and must not mask a more specific media_type or MIME type.
 */
export function classifyMediaAssetKind(asset: MediaAssetKindInput): MediaAssetKind {
  const values = [asset.asset_type, asset.media_type, asset.mime_type]
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean);

  if (values.some((value) => /(^|[^a-z])audio([^a-z]|$)|^audio\//.test(value))) {
    return "audio";
  }
  if (values.some((value) => /(^|[^a-z])(image|video|visual)([^a-z]|$)|^(image|video)\//.test(value))) {
    return "visual";
  }
  return "unclassified";
}
