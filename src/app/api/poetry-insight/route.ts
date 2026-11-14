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
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const parsedBody = await readBoundedJsonBody(request, MAX_POETRY_INSIGHT_REQUEST_BYTES);
    if (!parsedBody.ok) {
      return Response.json(
        { error: parsedBody.error },
        { status: parsedBody.status },
      );
    }
    const body = parsedBody.value;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json(
        { error: 'Request body must be a JSON object.' },
        { status: 400 },
      );
    }
    const { poem, title } = body as { poem?: unknown; title?: unknown };

    if (typeof poem !== 'string' || typeof title !== 'string' || !poem.trim() || !title.trim()) {
      return Response.json(
        { error: 'Missing poem or title' },
        { status: 400 },
      );
    }
    if (title.length > 200 || poem.length > 12000) {
      return Response.json(
        { error: 'The poem or title is too long.' },
        { status: 400 },
      );
    }

    let rateLimitAllowed = false;
    try {
      rateLimitAllowed = await consumePoetryInsightRateLimit(user.id);
    } catch {
      return Response.json(
        { error: 'AI rate limit is temporarily unavailable.' },
        { status: 503 },
      );
    }
    if (!rateLimitAllowed) {
      return Response.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 },
      );
    }

    const insight = await generatePoetryInsight(poem, title);

    if (!insight) {
      return Response.json(
        { error: 'Failed to generate insight' },
        { status: 500 },
      );
    }

    return Response.json({ insight });
  } catch (error) {
    console.error('[poetry-insight] Error:', error);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
