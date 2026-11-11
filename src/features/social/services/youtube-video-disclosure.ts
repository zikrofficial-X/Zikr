type YouTubeVideoDisclosureInput = {
  content: unknown;
  provider?: unknown;
  queueMetadata?: unknown;
  contentType?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

/**
 * Prefer the canonical generation request, but retain the queue audience marker
 * for older Kids rows whose content JSON predates the audience field. Unknown
 * providers are disclosed conservatively; only the local template renderer is
 * excluded from the synthetic-media flag.
 */
export function resolveYouTubeVideoDisclosure(input: YouTubeVideoDisclosureInput): {
  selfDeclaredMadeForKids: boolean;
  containsSyntheticMedia: boolean;
} {
  const content = asRecord(input.content);
  const queueMetadata = asRecord(input.queueMetadata);
  const contentType = typeof input.contentType === "string"
    ? input.contentType.trim().toLowerCase()
    : "";
  const isKidsContentType = contentType === "kids" || contentType.startsWith("kids_");
  const audience = content.audience === "kids" || queueMetadata.audience === "kids" || isKidsContentType
    ? "kids"
    : content.audience === "general" || queueMetadata.audience === "general"
      ? "general"
      : null;
  const contentProvider = typeof content.aiProvider === "string"
    ? content.aiProvider.trim()
    : "";
  const storedProvider = typeof input.provider === "string"
    ? input.provider.trim()
    : "";
  const provider = contentProvider || storedProvider;

  return {
    selfDeclaredMadeForKids: audience === "kids",
    containsSyntheticMedia: provider !== "template",
  };
}
