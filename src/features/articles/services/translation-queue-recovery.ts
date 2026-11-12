export type TranslationQueueRecoveryArticle = {
  published: boolean;
  title_en: string | null;
  summary_en: string | null;
  content_en: string | null;
};

export type TranslationQueueRecoveryDecision =
  | {
      status: "generated";
      draftPayload: {
        title_en: string;
        summary_en: string;
        content_en: string;
      };
    }
  | {
      status: "failed";
      errorMessage: string;
    };

export function resolveStaleTranslationQueueRecovery(input: {
  article: TranslationQueueRecoveryArticle | null;
  sourceHashMatches: boolean;
}): TranslationQueueRecoveryDecision {
  if (!input.article) {
    return {
      status: "failed",
      errorMessage: "Source article no longer exists; stale translation claim requires review.",
    };
  }
  if (input.article.published !== true) {
    return {
      status: "failed",
      errorMessage: "Source article is no longer published; stale translation claim was not exposed.",
    };
  }
  if (!input.sourceHashMatches) {
    return {
      status: "failed",
      errorMessage: "Source article changed while the translation worker was interrupted.",
    };
  }

  const draftPayload = {
    title_en: input.article.title_en?.trim() ?? "",
    summary_en: input.article.summary_en?.trim() ?? "",
    content_en: input.article.content_en?.trim() ?? "",
  };
  if (!draftPayload.title_en || !draftPayload.summary_en || !draftPayload.content_en) {
    return {
      status: "failed",
      errorMessage: "English article fields are incomplete after the stale translation lease expired.",
    };
  }

  return { status: "generated", draftPayload };
}
