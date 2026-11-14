function jsonNoStore(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

import { generatePoetryInsight } from '@/features/poetry/services/poetry-insight';
import { getSupabaseUser } from '@/lib/supabase/server';
import { consumePoetryInsightRateLimit } from '@/features/spiritual-ai/services/rate-limit';
import { readBoundedJsonBody } from '@/lib/request/bounded-json-body';

const MAX_POETRY_INSIGHT_REQUEST_BYTES = 64 * 1024;

/**
 * @openapi
 * POST /api/poetry-insight
 *
 * Summary: Generate AI literary analysis of a poem
 * Description: Uses Google Gemini to produce a short Arabic literary analysis of an Islamic poem.
 * Tags: AI, Poetry
 *
 * Request:
 *   Headers:
 *     - Content-Type: application/json (required)
 *   Body:
 *     - poem: string (required) - The poem text to analyze
 *     - title: string (required) - The poem title
 *
 * Responses:
 *   200:
 *     Body: { insight: string } - AI-generated analysis in Arabic
 *   400:
 *     Body: { error: "Missing poem or title" }
 *   401:
 *     Body: { error: "Authentication required." }
 *   500:
 *     Body: { error: "Failed to generate insight" | "Internal server error" }
 */
export async function POST(request: Request) {
  try {
    const user = await getSupabaseUser();
    if (!user) {
      return jsonNoStore({ error: 'Authentication required.' }, { status: 401 });
    }

    const parsedBody = await readBoundedJsonBody(request, MAX_POETRY_INSIGHT_REQUEST_BYTES);
    if (!parsedBody.ok) {
      return jsonNoStore(
        { error: parsedBody.error },
        { status: parsedBody.status },
      );
    }
    const body = parsedBody.value;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonNoStore(
        { error: 'Request body must be a JSON object.' },
        { status: 400 },
      );
    }
    const { poem, title } = body as { poem?: unknown; title?: unknown };

    if (typeof poem !== 'string' || typeof title !== 'string' || !poem.trim() || !title.trim()) {
      return jsonNoStore(
        { error: 'Missing poem or title' },
        { status: 400 },
      );
    }
    if (title.length > 200 || poem.length > 12000) {
      return jsonNoStore(
        { error: 'The poem or title is too long.' },
        { status: 400 },
      );
    }

    let rateLimitAllowed = false;
    try {
      rateLimitAllowed = await consumePoetryInsightRateLimit(user.id);
    } catch {
      return jsonNoStore(
        { error: 'AI rate limit is temporarily unavailable.' },
        { status: 503 },
      );
    }
    if (!rateLimitAllowed) {
      return jsonNoStore(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 },
      );
    }

    const insight = await generatePoetryInsight(poem, title);

    if (!insight) {
      return jsonNoStore(
        { error: 'Failed to generate insight' },
        { status: 500 },
      );
    }

    return jsonNoStore({ insight });
  } catch (error) {
    console.error('[poetry-insight] Error:', error);
    return jsonNoStore(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
