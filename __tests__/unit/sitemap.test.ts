import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSitemapShardId } from '../../src/app/sitemap-content/[id]/route';

test('normalizes sitemap shard ids with the XML suffix emitted by the index', () => {
  assert.equal(normalizeSitemapShardId('0.xml'), 0);
  assert.equal(normalizeSitemapShardId('12.XML'), 12);
  assert.equal(normalizeSitemapShardId('3'), 3);
  assert.ok(Number.isNaN(normalizeSitemapShardId('not-a-shard.xml')));
});
