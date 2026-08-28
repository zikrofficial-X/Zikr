import assert from 'node:assert/strict';
import test from 'node:test';
import { mergePublishedBySlug } from '@/lib/data/content-merge';
import { FALLBACK_CONQUESTS } from '@/lib/data/conquests-fallback';

test('content merge keeps database rows first and adds unseen fallback slugs', () => {
  const merged = mergePublishedBySlug(
    [{ slug: 'shared', value: 'database' }, { slug: 'db-only', value: 'database' }],
    [{ slug: 'shared', value: 'fallback' }, { slug: 'fallback-only', value: 'fallback' }],
  );

  assert.deepEqual(merged, [
    { slug: 'shared', value: 'database' },
    { slug: 'db-only', value: 'database' },
    { slug: 'fallback-only', value: 'fallback' },
  ]);
});

test('fallback conquest index contains the published conquest catalogue', () => {
  assert.equal(FALLBACK_CONQUESTS.length, 19);
  assert.equal(new Set(FALLBACK_CONQUESTS.map(item => item.slug)).size, 19);
  assert.ok(FALLBACK_CONQUESTS.every(item => item.name_ar && item.slug));
});
