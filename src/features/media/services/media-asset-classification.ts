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
function classifyMediaDescriptor(value: unknown): MediaAssetKind | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return null;

  if (/(^|[^a-z])audio([^a-z]|$)|^audio\//.test(normalized)) {
    return "audio";
  }
  if (/(^|[^a-z])(image|video|visual)([^a-z]|$)|^(image|video)\//.test(normalized)) {
    return "visual";
  }
  return null;
}

export function classifyMediaAssetKind(asset: MediaAssetKindInput): MediaAssetKind {
  // MIME is the most specific descriptor, followed by media_type and then the
  // broader governance label. An older asset_type must never override either.
  for (const value of [asset.mime_type, asset.media_type, asset.asset_type]) {
    const kind = classifyMediaDescriptor(value);
    if (kind) return kind;
  }
  return "unclassified";
}

export type MediaAssetRightsInput = {
  rights_verified?: boolean | null;
  verified_rights?: boolean | null;
};

/**
 * Publishing requires both legacy and current rights flags to be true.
 * Governance screens must report the same contract as the publish gate.
 */
export function areMediaAssetRightsVerified(asset: MediaAssetRightsInput): boolean {
  return asset.rights_verified === true && asset.verified_rights === true;
}
