export type SourceItem = {
  externalId: string;
  title: string | null;
  body: string | null;
  sourceUrl: string;
  metadata: Record<string, unknown>;
};

export type SourceParseSkipReason = "catalog_only_source" | "parser_not_implemented";

export type SourceParseOutcome =
  | { kind: "items"; items: SourceItem[] }
  | { kind: "skipped"; reason: SourceParseSkipReason };

export function getSourceParserSkipReason(source: { parser_key: string }): SourceParseSkipReason | null {
  if (source.parser_key === "alquran_cloud") return "catalog_only_source";
  return "parser_not_implemented";
}

/**
 * Keep source ingestion explicit: a successful HTTP fetch is not a successful
 * editorial ingestion when no reviewed provider parser exists.
 */
export function parseSourceItems(
  source: { parser_key: string },
  _payload: unknown,
  _retrievedAt: string,
): SourceParseOutcome {
  const skipReason = getSourceParserSkipReason(source);
  if (skipReason) return { kind: "skipped", reason: skipReason };

  // Credentialed providers remain disabled until a provider-specific parser
  // has been implemented and reviewed.
  return { kind: "skipped", reason: "parser_not_implemented" };
}
