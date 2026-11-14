import 'server-only';

import { createAdminClient } from '@/lib/supabase/server';
import {
  buildAiRateLimitParams,
  type AiRateLimitPolicy,
  SPIRITUAL_AI_RATE_LIMIT_BUCKET,
  SPIRITUAL_AI_RATE_LIMIT_MAX_REQUESTS,
  SPIRITUAL_AI_RATE_LIMIT_WINDOW_SECONDS,
  MEMORIZATION_AI_RATE_LIMIT_BUCKET,
  MEMORIZATION_AI_RATE_LIMIT_MAX_REQUESTS,
  MEMORIZATION_AI_RATE_LIMIT_WINDOW_SECONDS,
  POETRY_INSIGHT_RATE_LIMIT_BUCKET,
  POETRY_INSIGHT_RATE_LIMIT_MAX_REQUESTS,
  POETRY_INSIGHT_RATE_LIMIT_WINDOW_SECONDS,
} from './rate-limit-identity';

async function consumeAiRateLimit(clientIdentifier: string, policy: AiRateLimitPolicy, label: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc(
    'consume_admin_rate_limit',
    buildAiRateLimitParams(clientIdentifier, process.env.SUPABASE_SERVICE_ROLE_KEY ?? '', policy),
  );
  if (error || typeof data !== 'boolean') {
    console.error(`[${label} rate limit] RPC failed`, error?.code ?? 'invalid_result');
    throw new Error(`Shared ${label} rate limit is unavailable`);
  }
  return data;
}

export function consumeSpiritualAiRateLimit(clientIdentifier: string): Promise<boolean> {
  return consumeAiRateLimit(clientIdentifier, {
    bucket: SPIRITUAL_AI_RATE_LIMIT_BUCKET,
    limit: SPIRITUAL_AI_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: SPIRITUAL_AI_RATE_LIMIT_WINDOW_SECONDS,
  }, 'Spiritual AI');
}

export function consumeMemorizationAiRateLimit(clientIdentifier: string): Promise<boolean> {
  return consumeAiRateLimit(clientIdentifier, {
    bucket: MEMORIZATION_AI_RATE_LIMIT_BUCKET,
    limit: MEMORIZATION_AI_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: MEMORIZATION_AI_RATE_LIMIT_WINDOW_SECONDS,
  }, 'memorization AI');
}

export function consumePoetryInsightRateLimit(clientIdentifier: string): Promise<boolean> {
  return consumeAiRateLimit(clientIdentifier, {
    bucket: POETRY_INSIGHT_RATE_LIMIT_BUCKET,
    limit: POETRY_INSIGHT_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: POETRY_INSIGHT_RATE_LIMIT_WINDOW_SECONDS,
  }, 'poetry insight');
}
