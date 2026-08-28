/**
 * Server actions smoke tests (node:test)
 * Verifies that auth server actions are exported correctly.
 * Run with: node --test __tests__/integration/server-actions.test.ts
 *
 * Note: These tests verify export shapes only. Full integration requires a
 * running Supabase instance and is validated via E2E tests.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('Auth server actions exports', () => {
  it('exports loginAction', async () => {
    // Dynamic import avoids "use server" pragma issues in test context
    const mod = await import('../../app/auth/actions.ts');
    assert.equal(typeof mod.loginAction, 'function');
  });

  it('exports registerAction', async () => {
    const mod = await import('../../app/auth/actions.ts');
    assert.equal(typeof mod.registerAction, 'function');
  });

  it('exports logoutAction', async () => {
    const mod = await import('../../app/auth/actions.ts');
    assert.equal(typeof mod.logoutAction, 'function');
  });

  it('exports forgotAction', async () => {
    const mod = await import('../../app/auth/actions.ts');
    assert.equal(typeof mod.forgotAction, 'function');
  });

  it('exports updateProfileAction', async () => {
    const mod = await import('../../app/auth/actions.ts');
    assert.equal(typeof mod.updateProfileAction, 'function');
  });
});
