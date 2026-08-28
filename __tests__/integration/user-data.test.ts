/**
 * User-data route smoke tests.
 *
 * These tests verify that the server-side user-data handlers can load through
 * the project TypeScript runtime. Authenticated persistence is validated by
 * the production smoke test when a real Supabase test environment is supplied.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('User data route exports', () => {
  it('exports profile read and update handlers', async () => {
    const profileRoute = await import('../../app/api/user/profile/route.ts');
    assert.equal(typeof profileRoute.GET, 'function');
    assert.equal(typeof profileRoute.PUT, 'function');
  });

  it('exports favorites read, create, and delete handlers', async () => {
    const favoritesRoute = await import('../../app/api/user/favorites/route.ts');
    assert.equal(typeof favoritesRoute.GET, 'function');
    assert.equal(typeof favoritesRoute.POST, 'function');
    assert.equal(typeof favoritesRoute.DELETE, 'function');
  });
});
