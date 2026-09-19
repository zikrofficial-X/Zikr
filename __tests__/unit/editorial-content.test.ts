import assert from "node:assert/strict";
import test from "node:test";
import { staticArticles } from "../../src/features/articles/data/fallback";

const MIN_PUBLIC_ARTICLE_CHARS = 1800;

test("the bundled editorial library has substantial unique articles", () => {
  assert.ok(staticArticles.length >= 12);
  const slugs = staticArticles.map(article => article.slug);
  assert.equal(new Set(slugs).size, slugs.length);

  for (const article of staticArticles) {
    assert.ok(article.title_ar.trim().length >= 10, article.slug);
    assert.ok(article.summary_ar.trim().length >= 60, article.slug);
    assert.ok(article.content_ar.trim().length >= MIN_PUBLIC_ARTICLE_CHARS, article.slug);
    assert.ok(article.author.trim().length > 0, article.slug);
  }
});

test("editorial references use safe absolute URLs", () => {
  for (const article of staticArticles) {
    const references = article.metadata?.references ?? [];
    assert.ok(references.length >= 2, article.slug);
    for (const reference of references) {
      const url = new URL(reference.url);
      assert.ok(url.protocol === "https:" || url.protocol === "http:", `${article.slug}: ${reference.url}`);
      assert.ok(reference.title_ar.trim().length > 0, article.slug);
    }
  }
});
