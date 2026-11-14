import { getContactRateLimitActorId } from '../../contact/rate-limit-identity';

export const SPIRITUAL_AI_RATE_LIMIT_BUCKET = 'spiritual_ai_chat';
export const SPIRITUAL_AI_RATE_LIMIT_MAX_REQUESTS = 5;
export const SPIRITUAL_AI_RATE_LIMIT_WINDOW_SECONDS = 600;

export function buildSpiritualAiRateLimitParams(clientIdentifier: string, secret: string) {
  return {
    p_actor: getContactRateLimitActorId(clientIdentifier, secret),
    p_bucket: SPIRITUAL_AI_RATE_LIMIT_BUCKET,
    p_limit: SPIRITUAL_AI_RATE_LIMIT_MAX_REQUESTS,
    p_window_seconds: SPIRITUAL_AI_RATE_LIMIT_WINDOW_SECONDS,
  };
}
