import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import { buildSpiritualAiRateLimitParams } from './rate-limit-identity';

/**
 * Shared atomic limiter for the public Spiritual AI server action.
 * The actor identifier is HMAC-derived; raw client addresses are never stored.
 */
export async function consumeSpiritualAiRateLimit(clientIdentifier: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    'consume_admin_rate_limit',
    buildSpiritualAiRateLimitParams(
      clientIdentifier,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    ),
  );

  if (error || typeof data !== 'boolean') {
    console.error('[spiritual-ai rate limit] RPC failed', error?.code ?? 'invalid_result');
    throw new Error('Shared Spiritual AI rate limit is unavailable');
  }

  return data;
}
