import { getContactRateLimitActorId } from '../../contact/rate-limit-identity';

export const SPIRITUAL_AI_RATE_LIMIT_BUCKET = 'spiritual_ai_chat';
export const SPIRITUAL_AI_RATE_LIMIT_MAX_REQUESTS = 5;
export const SPIRITUAL_AI_RATE_LIMIT_WINDOW_SECONDS = 600;

export const MEMORIZATION_AI_RATE_LIMIT_BUCKET = 'memorization_evaluation';
export const MEMORIZATION_AI_RATE_LIMIT_MAX_REQUESTS = 3;
export const MEMORIZATION_AI_RATE_LIMIT_WINDOW_SECONDS = 600;

export const POETRY_INSIGHT_RATE_LIMIT_BUCKET = 'poetry_insight';
export const POETRY_INSIGHT_RATE_LIMIT_MAX_REQUESTS = 5;
export const POETRY_INSIGHT_RATE_LIMIT_WINDOW_SECONDS = 600;

export type AiRateLimitPolicy = {
  bucket: string;
  limit: number;
  windowSeconds: number;
};

export function buildAiRateLimitParams(clientIdentifier: string, secret: string, policy: AiRateLimitPolicy) {
  if (!policy.bucket.trim() || !Number.isSafeInteger(policy.limit) || policy.limit < 1 || !Number.isSafeInteger(policy.windowSeconds) || policy.windowSeconds < 1) {
    throw new Error('Invalid AI rate-limit policy');
  }
  return {
    p_actor: getContactRateLimitActorId(clientIdentifier, secret),
    p_bucket: policy.bucket,
    p_limit: policy.limit,
    p_window_seconds: policy.windowSeconds,
  };
}

export function buildSpiritualAiRateLimitParams(clientIdentifier: string, secret: string) {
  return buildAiRateLimitParams(clientIdentifier, secret, {
    bucket: SPIRITUAL_AI_RATE_LIMIT_BUCKET,
    limit: SPIRITUAL_AI_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: SPIRITUAL_AI_RATE_LIMIT_WINDOW_SECONDS,
  });
}

export function buildMemorizationAiRateLimitParams(clientIdentifier: string, secret: string) {
  return buildAiRateLimitParams(clientIdentifier, secret, {
    bucket: MEMORIZATION_AI_RATE_LIMIT_BUCKET,
    limit: MEMORIZATION_AI_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: MEMORIZATION_AI_RATE_LIMIT_WINDOW_SECONDS,
  });
}

export function buildPoetryInsightRateLimitParams(clientIdentifier: string, secret: string) {
  return buildAiRateLimitParams(clientIdentifier, secret, {
    bucket: POETRY_INSIGHT_RATE_LIMIT_BUCKET,
    limit: POETRY_INSIGHT_RATE_LIMIT_MAX_REQUESTS,
    windowSeconds: POETRY_INSIGHT_RATE_LIMIT_WINDOW_SECONDS,
  });
}
