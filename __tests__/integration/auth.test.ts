/**
 * Auth utilities unit tests (node:test)
 * Tests pure functions in lib/auth-enhanced.ts — no network, no DB needed.
 * Run with: node --test __tests__/integration/auth.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  extractNextPath,
  getCanonicalAuthBaseUrl,
  buildOAuthRedirectUri,
  isPkceVerifierError,
} from '../../lib/auth-enhanced.ts';

describe('extractNextPath', () => {
  it('defaults to /profile when no next param', () => {
    const params = new URLSearchParams();
    assert.equal(extractNextPath(params), '/profile');
  });

  it('accepts a valid relative path', () => {
    const params = new URLSearchParams({ next: '/quran' });
    assert.equal(extractNextPath(params), '/quran');
  });

  it('rejects absolute URLs (open redirect)', () => {
    const params = new URLSearchParams({ next: 'https://evil.com' });
    assert.equal(extractNextPath(params), '/profile');
  });

  it('rejects paths starting with //', () => {
    const params = new URLSearchParams({ next: '//evil.com' });
    assert.equal(extractNextPath(params), '/profile');
  });

  it('preserves query string in path', () => {
    const params = new URLSearchParams({ next: '/hadith?book=muslim' });
    assert.equal(extractNextPath(params), '/hadith?book=muslim');
  });
});

describe('getCanonicalAuthBaseUrl', () => {
  it('preserves localhost for development', () => {
    const result = getCanonicalAuthBaseUrl('http://localhost:3000');
    assert.equal(result, 'http://localhost:3000');
  });

  it('returns production URL for Supabase host', () => {
    const result = getCanonicalAuthBaseUrl('https://eydxvcamhjhajxjrsgym.supabase.co');
    assert.match(result, /^https:\/\//);
    assert.ok(!result.includes('supabase.co'));
  });

  it('falls back to production URL for null', () => {
    const result = getCanonicalAuthBaseUrl(null);
    assert.match(result, /^https:\/\//);
  });
});

describe('isPkceVerifierError', () => {
  it('recognizes a missing PKCE verifier as a recoverable OAuth restart', () => {
    assert.equal(
      isPkceVerifierError(
        new Error('PKCE code verifier not found in storage'),
      ),
      true,
    );
  });

  it('recognizes an invalid or missing flow state as a recoverable OAuth restart', () => {
    assert.equal(isPkceVerifierError(new Error('invalid flow state, no valid flow state found')), true);
  });

  it('does not classify unrelated OAuth errors as PKCE expiry', () => {
    assert.equal(isPkceVerifierError(new Error('invalid grant')), false);
  });
});

describe('buildOAuthRedirectUri', () => {
  it('builds a /auth/callback URL', () => {
    const uri = buildOAuthRedirectUri('http://localhost:3000', '/profile');
    assert.ok(uri.includes('/auth/callback'));
  });

  it('encodes the next path as a query param', () => {
    const uri = buildOAuthRedirectUri('http://localhost:3000', '/quran');
    assert.ok(uri.includes('next='));
  });
});
