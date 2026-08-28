/**
 * Hooks smoke tests (node:test)
 * Verifies that hooks can be imported from their application locations.
 * Run with: pnpm test
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('Prayer times hook exports', () => {
  it('exports usePrayerTimes', async () => {
    const mod = await import('../../hooks/use-prayer-times.ts');
    assert.equal(typeof mod.usePrayerTimes, 'function');
  });
});

describe('Auth enhanced exports', () => {
  it('exports extractNextPath', async () => {
    const mod = await import('../../lib/auth-enhanced.ts');
    assert.equal(typeof mod.extractNextPath, 'function');
  });

  it('exports getCanonicalAuthBaseUrl', async () => {
    const mod = await import('../../lib/auth-enhanced.ts');
    assert.equal(typeof mod.getCanonicalAuthBaseUrl, 'function');
  });

  it('exports buildOAuthRedirectUri', async () => {
    const mod = await import('../../lib/auth-enhanced.ts');
    assert.equal(typeof mod.buildOAuthRedirectUri, 'function');
  });
});
