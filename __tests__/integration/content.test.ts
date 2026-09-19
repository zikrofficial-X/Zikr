/**
 * Content-route smoke tests.
 *
 * This suite verifies that all public content handlers load through the
 * project TypeScript runtime. Data-integrity and remote-provider behavior are
 * covered by production smoke checks against a configured deployment.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const publicContentRoutes = [
  '../../src/app/api/quran/surahs/route.ts',
  '../../src/app/api/quran/audio/route.ts',
  '../../src/app/api/hadith/books/route.ts',
  '../../src/app/api/duas/route.ts',
  '../../src/app/api/duas/categories/route.ts',
  '../../src/app/api/content/stories/route.ts',
  '../../src/app/api/content/prophets/route.ts',
  '../../src/app/api/content/companions/route.ts',
  '../../src/app/api/content/articles/route.ts',
  '../../src/app/api/search/route.ts',
] as const;

describe('Public content route exports', () => {
  for (const routePath of publicContentRoutes) {
    it(`exports a GET handler from ${routePath}`, async () => {
      const route = await import(routePath);
      assert.equal(typeof route.GET, 'function');
    });
  }
});
