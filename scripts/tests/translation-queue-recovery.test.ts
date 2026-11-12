import assert from "node:assert/strict";
import { resolveStaleTranslationQueueRecovery } from "../../src/features/articles/services/translation-queue-recovery";

const completedArticle = {
  published: true,
  title_en: "A verified English title",
  summary_en: "A concise English summary",
  content_en: "A complete English article body.",
};

const recovered = resolveStaleTranslationQueueRecovery({
  article: completedArticle,
  sourceHashMatches: true,
});
assert.deepEqual(recovered, {
  status: "generated",
  draftPayload: {
    title_en: "A verified English title",
    summary_en: "A concise English summary",
    content_en: "A complete English article body.",
  },
});

assert.equal(
  resolveStaleTranslationQueueRecovery({
    article: completedArticle,
    sourceHashMatches: false,
  }).status,
  "failed",
  "a stale worker must not finalize a translation for a changed Arabic source",
);
assert.equal(
  resolveStaleTranslationQueueRecovery({
    article: { ...completedArticle, published: false },
    sourceHashMatches: true,
  }).status,
  "failed",
  "a translation for an unpublished article must not be reconciled as generated",
);
assert.equal(
  resolveStaleTranslationQueueRecovery({
    article: { ...completedArticle, content_en: null },
    sourceHashMatches: true,
  }).status,
  "failed",
  "partial English fields must remain retryable rather than being marked generated",
);
assert.equal(
  resolveStaleTranslationQueueRecovery({
    article: null,
    sourceHashMatches: false,
  }).status,
  "failed",
  "a deleted source article must not leave a permanently processing queue row",
);

console.log("Stale translation queue recovery contracts passed.");
