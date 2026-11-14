import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildMemorizationAiRateLimitParams,
  buildPoetryInsightRateLimitParams,
  buildSpiritualAiRateLimitParams,
  MEMORIZATION_AI_RATE_LIMIT_BUCKET,
  MEMORIZATION_AI_RATE_LIMIT_MAX_REQUESTS,
  MEMORIZATION_AI_RATE_LIMIT_WINDOW_SECONDS,
  POETRY_INSIGHT_RATE_LIMIT_BUCKET,
  POETRY_INSIGHT_RATE_LIMIT_MAX_REQUESTS,
  POETRY_INSIGHT_RATE_LIMIT_WINDOW_SECONDS,
} from '../../src/features/spiritual-ai/services/rate-limit-identity';
import { MAX_MEMORIZATION_AUDIO_BYTES } from '../../src/features/memorization/constants';

const secret = 'server-only-test-secret';
const memorizationParams = buildMemorizationAiRateLimitParams('203.0.113.25', secret);
assert.equal(memorizationParams.p_bucket, MEMORIZATION_AI_RATE_LIMIT_BUCKET);
assert.equal(memorizationParams.p_limit, MEMORIZATION_AI_RATE_LIMIT_MAX_REQUESTS);
assert.equal(memorizationParams.p_window_seconds, MEMORIZATION_AI_RATE_LIMIT_WINDOW_SECONDS);
assert.equal(memorizationParams.p_limit, 3);
assert.equal(memorizationParams.p_window_seconds, 600);

const poetryParams = buildPoetryInsightRateLimitParams('user-uuid-123', secret);
assert.equal(poetryParams.p_bucket, POETRY_INSIGHT_RATE_LIMIT_BUCKET);
assert.equal(poetryParams.p_limit, POETRY_INSIGHT_RATE_LIMIT_MAX_REQUESTS);
assert.equal(poetryParams.p_window_seconds, POETRY_INSIGHT_RATE_LIMIT_WINDOW_SECONDS);
assert.equal(poetryParams.p_limit, 5);
assert.equal(poetryParams.p_window_seconds, 600);

const spiritualParams = buildSpiritualAiRateLimitParams('203.0.113.25', secret);
assert.equal(spiritualParams.p_bucket, 'spiritual_ai_chat');
assert.equal(spiritualParams.p_limit, 5);
assert.notEqual(memorizationParams.p_bucket, poetryParams.p_bucket);
assert.notEqual(memorizationParams.p_actor, buildMemorizationAiRateLimitParams('203.0.113.26', secret).p_actor);
assert.throws(() => buildMemorizationAiRateLimitParams('203.0.113.25', ''));

const memorizationAction = readFileSync('src/app/memorization/actions.ts', 'utf8');
const memorizationLimitIndex = memorizationAction.indexOf('consumeMemorizationAiRateLimit(clientAddress)');
const audioGeminiIndex = memorizationAction.indexOf('generateGeminiFromAudio(');
const textGeminiIndex = memorizationAction.indexOf('generateGeminiText(textFallbackPrompt');
assert.ok(memorizationLimitIndex >= 0, 'unauthenticated memorization evaluation must use the shared IP limiter');
assert.ok(memorizationLimitIndex < audioGeminiIndex, 'memorization rate limit must run before audio Gemini calls');
assert.ok(memorizationLimitIndex < textGeminiIndex, 'memorization rate limit must run before text Gemini calls');
assert.match(memorizationAction, /await headers\(\)/);
assert.match(memorizationAction, /getTrustedClientAddress\(/);
assert.match(memorizationAction, /MAX_MEMORIZATION_AUDIO_BYTES/);

const voiceRecorder = readFileSync('src/app/memorization/voice-recorder.tsx', 'utf8');
assert.match(voiceRecorder, /recordingBytesRef/);
assert.match(voiceRecorder, /recordingTooLargeRef/);
assert.match(voiceRecorder, /MAX_MEMORIZATION_AUDIO_BYTES/);
assert.match(voiceRecorder, /MEMORIZATION_AUDIO_LIMIT_MESSAGE/);

const poetryRoute = readFileSync('src/app/api/poetry-insight/route.ts', 'utf8');
const authIndex = poetryRoute.indexOf('const user = await getSupabaseUser()');
const poetryLimitIndex = poetryRoute.indexOf('consumePoetryInsightRateLimit(user.id)');
const poetryGeminiIndex = poetryRoute.indexOf('generatePoetryInsight(poem, title)');
assert.ok(authIndex >= 0 && authIndex < poetryLimitIndex, 'poetry insight must resolve the authenticated user before rate limiting');
assert.ok(poetryLimitIndex >= 0 && poetryLimitIndex < poetryGeminiIndex, 'poetry insight must rate-limit before Gemini');
assert.match(poetryRoute, /status: 429/);
assert.match(poetryRoute, /status: 503/);

const poetryService = readFileSync('src/features/poetry/services/poetry-insight.ts', 'utf8');
assert.match(poetryService, /import ['"]server-only['"]/);

const nextConfig = readFileSync('next.config.ts', 'utf8');
assert.match(nextConfig, /serverActions:\s*\{\s*bodySizeLimit:\s*'4mb'/);
assert.ok(MAX_MEMORIZATION_AUDIO_BYTES < 4 * 1024 * 1024, 'audio payload cap must leave room below the Server Action body cap');

const apiDocs = readFileSync('docs/api/README.md', 'utf8');
const poetryDocsStart = apiDocs.indexOf('### POST /api/poetry-insight');
const poetryDocsEnd = apiDocs.indexOf('\\n---', poetryDocsStart);
const poetryDocs = apiDocs.slice(poetryDocsStart, poetryDocsEnd);
assert.match(apiDocs, /\\| POST \\| `\\/api\\/poetry-insight` \\|[^\\n]*\\| Required \\|/);
assert.match(poetryDocs, /\\*\\*Authentication:\\*\\* Required \\(authenticated Supabase session\\)/);
assert.match(poetryDocs, /\\*\\*Authorization:\\*\\* Any signed-in user; no admin role required/);
assert.match(poetryDocs, /401 Unauthorized/);
assert.doesNotMatch(poetryDocs, /\\*\\*Authentication:\\*\\* None/);
assert.match(apiDocs, /3 evaluations per 10 minutes/);
assert.match(apiDocs, /maximum 3 MiB/);

const rateLimitService = readFileSync('src/features/spiritual-ai/services/rate-limit.ts', 'utf8');
assert.match(rateLimitService, /consume_admin_rate_limit/);
assert.match(rateLimitService, /typeof data !== 'boolean'/, 'shared limiter must fail closed on an invalid RPC response');

console.log('Public AI cost guards passed: shared per-client limits, authenticated poetry quota, and bounded audio payloads.');
