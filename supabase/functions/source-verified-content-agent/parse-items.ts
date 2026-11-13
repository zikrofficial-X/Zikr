export type SourceItem = {
  externalId: string;
  title: string | null;
  body: string | null;
  sourceUrl: string;
  metadata: Record<string, unknown>;
};

export type SourceParseOutcome =
  | { kind: "items"; items: SourceItem[] }
  | { kind: "skipped"; reason: "catalog_only_source" | "parser_not_implemented" };

/**
 * Keep source ingestion explicit: a successful HTTP fetch is not a successful
 * editorial ingestion when no reviewed provider parser exists.
 */
export function parseSourceItems(
  source: { parser_key: string },
  _payload: unknown,
  _retrievedAt: string,
): SourceParseOutcome {
  if (source.parser_key === "alquran_cloud") {
    // Quran chapter catalog is synchronized into quran_surahs and is not a
    // reviewable editorial-content queue item.
    return { kind: "skipped", reason: "catalog_only_source" };
  }

  // Credentialed providers remain disabled until a provider-specific parser
  // has been implemented and reviewed.
  return { kind: "skipped", reason: "parser_not_implemented" };
}
